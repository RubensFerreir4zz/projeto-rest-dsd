import hashlib
import os
import sys
import uuid
from datetime import datetime, timezone
from wsgiref.simple_server import make_server

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, 'service_storage')
if STORAGE_DIR not in sys.path:
    sys.path.insert(0, STORAGE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

from django.apps import apps
from django.utils import timezone as django_timezone

File = apps.get_model('storage', 'File')

from spyne import Application, Boolean, ComplexModel, Integer, ServiceBase, Unicode, rpc
from spyne.error import Fault
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication


class CertificadoAutenticacaoResponse(ComplexModel):
    __namespace__ = 'safodrive.soap.notary'

    protocolo = Unicode
    arquivo_id = Integer
    nome_arquivo = Unicode
    tamanho_bytes = Integer
    hash_sha256 = Unicode
    timestamp_utc = Unicode
    status = Unicode
    mensagem = Unicode


class ValidacaoIntegridadeResponse(ComplexModel):
    __namespace__ = 'safodrive.soap.notary'

    arquivo_id = Integer
    protocolo = Unicode
    autentico = Boolean
    hash_oficial = Unicode
    status = Unicode
    mensagem = Unicode


class FileShareNotaryService(ServiceBase):

    @rpc(Integer, _returns=CertificadoAutenticacaoResponse)
    def emitir_autenticacao_arquivo(ctx, arquivo_id):
        if not arquivo_id or arquivo_id <= 0:
            raise Fault(
                faultcode='Client.ParametroInvalido',
                faultstring='O ID do arquivo deve ser um inteiro positivo.'
            )

        try:
            file_obj = File.objects.get(id=arquivo_id)
        except File.DoesNotExist:
            raise Fault(
                faultcode='Client.ArquivoNaoEncontrado',
                faultstring=f'Arquivo ID {arquivo_id} não encontrado na base de dados do SafoDrive.'
            )

        if not file_obj.file or not os.path.isfile(file_obj.file.path):
            raise Fault(
                faultcode='Client.ArquivoInacessivel',
                faultstring=f'O arquivo físico "{file_obj.original_name}" não está acessível no disco para autenticação.'
            )

        hasher = hashlib.sha256()
        with open(file_obj.file.path, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                hasher.update(chunk)
        calculated_hash = hasher.hexdigest().lower()

        protocolo = f"CERT-2026-{uuid.uuid4().hex[:8].upper()}"
        now_dt = django_timezone.now()

        file_obj.hash_sha256 = calculated_hash
        file_obj.protocolo_soap = protocolo
        file_obj.autenticado_em = now_dt
        file_obj.save(update_fields=['hash_sha256', 'protocolo_soap', 'autenticado_em'])

        timestamp_iso = now_dt.isoformat()

        return CertificadoAutenticacaoResponse(
            protocolo=protocolo,
            arquivo_id=file_obj.id,
            nome_arquivo=file_obj.original_name,
            tamanho_bytes=file_obj.size_bytes,
            hash_sha256=calculated_hash,
            timestamp_utc=timestamp_iso,
            status='CERTIFICADO_EMITIDO',
            mensagem='Autenticação e hash SHA-256 registrados com sucesso pelo serviço notarial.'
        )

    @rpc(Integer, Unicode, _returns=ValidacaoIntegridadeResponse)
    def validar_integridade_arquivo(ctx, arquivo_id, hash_conferencia):
        """
        Operação 2: A Autoridade SOAP audita a integridade do arquivo.
        Confere se o arquivo no disco foi alterado ou compara contra um hash informado.
        Dispara SOAP Fault caso seja detectada qualquer divergência de integridade.
        """
        if not arquivo_id or arquivo_id <= 0:
            raise Fault(
                faultcode='Client.ParametroInvalido',
                faultstring='O ID do arquivo deve ser um inteiro positivo.'
            )

        try:
            file_obj = File.objects.get(id=arquivo_id)
        except File.DoesNotExist:
            raise Fault(
                faultcode='Client.ArquivoNaoEncontrado',
                faultstring=f'Arquivo ID {arquivo_id} não encontrado na base de dados.'
            )

        if not file_obj.protocolo_soap or not file_obj.hash_sha256:
            raise Fault(
                faultcode='Client.ArquivoNaoAutenticado',
                faultstring=f'O arquivo "{file_obj.original_name}" ainda não possui certificação SOAP emitida.'
            )

        clean_conferencia = (hash_conferencia or '').strip().lower()
        if clean_conferencia:
            if len(clean_conferencia) != 64:
                raise Fault(
                    faultcode='Client.HashInvalido',
                    faultstring='O hash de conferência informado deve possuir 64 caracteres hexadecimais.'
                )

            if clean_conferencia != file_obj.hash_sha256.lower():
                raise Fault(
                    faultcode='Client.IntegridadeViolada',
                    faultstring=(
                        f'ALERTA DE SEGURANÇA: O hash fornecido ({clean_conferencia}) diverge '
                        f'do hash oficial registrado na certidão ({file_obj.hash_sha256}). '
                        'O arquivo foi adulterado ou corrompido.'
                    )
                )

        if not file_obj.file or not os.path.isfile(file_obj.file.path):
            raise Fault(
                faultcode='Client.ArquivoFisicoInacessivel',
                faultstring='O arquivo físico original não foi localizado no disco para auditoria.'
            )

        hasher = hashlib.sha256()
        with open(file_obj.file.path, 'rb') as f:
            for chunk in iter(lambda: f.read(65536), b''):
                hasher.update(chunk)
        current_disk_hash = hasher.hexdigest().lower()

        if current_disk_hash != file_obj.hash_sha256.lower():
            raise Fault(
                faultcode='Client.IntegridadeViolada',
                faultstring=(
                    f'ALERTA DE SEGURANÇA: O arquivo físico no disco foi adulterado! '
                    f'Hash atual em disco: {current_disk_hash} | Hash oficial da certidão: {file_obj.hash_sha256}'
                )
            )

        return ValidacaoIntegridadeResponse(
            arquivo_id=file_obj.id,
            protocolo=file_obj.protocolo_soap,
            autentico=True,
            hash_oficial=file_obj.hash_sha256,
            status='INTEGRIDADE_CONFIRMADA',
            mensagem='Arquivo 100% íntegro e autêntico. Nenhuma adulteração detectada na auditoria.'
        )


class CorsMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        if environ.get('REQUEST_METHOD') == 'OPTIONS':
            headers = [
                ('Access-Control-Allow-Origin', '*'),
                ('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'),
                ('Access-Control-Allow-Headers', 'Content-Type, SOAPAction, Authorization'),
                ('Content-Length', '0'),
            ]
            start_response('200 OK', headers)
            return [b'']

        def custom_start_response(status, headers, exc_info=None):
            headers.append(('Access-Control-Allow-Origin', '*'))
            headers.append(('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'))
            headers.append(('Access-Control-Allow-Headers', 'Content-Type, SOAPAction, Authorization'))
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)


TARGET_NAMESPACE = 'safodrive.soap.notary'

application = Application(
    services=[FileShareNotaryService],
    tns=TARGET_NAMESPACE,
    name='SafoDriveNotary',
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)

wsgi_application = CorsMiddleware(WsgiApplication(application))


def main():
    host = '0.0.0.0'
    port = 8003
    print(f"Servidor SOAP executando em http://127.0.0.1:{port}/ (WSDL: http://127.0.0.1:{port}/?wsdl)")
    server = make_server(host, port, wsgi_application)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor SOAP encerrado.")


if __name__ == '__main__':
    main()
