import requests
from django.conf import settings
from rest_framework.exceptions import APIException


class ServiceUnavailable(APIException):
    status_code = 503
    default_detail = "Um dos serviços internos do sistema está indisponível."
    default_code = "service_unavailable"


class AccountsServiceClient:

    BASE_URL = settings.ACCOUNTS_SERVICE_URL

    @classmethod
    def register(cls, username, email, password, plan=None):
        try:
            payload = {"username": username, "email": email, "password": password}
            if plan:
                payload["plan"] = plan
            response = requests.post(f"{cls.BASE_URL}/register/", json=payload, timeout=5)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de contas (8001).")

    @classmethod
    def verify_credentials(cls, email, password):
        try:
            payload = {"email": email, "password": password}
            response = requests.post(f"{cls.BASE_URL}/verify-credentials/", json=payload, timeout=5)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de contas (8001).")

    @classmethod
    def get_user(cls, user_id):
        try:
            response = requests.get(f"{cls.BASE_URL}/{user_id}/", timeout=5)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de contas (8001).")

    @classmethod
    def check_storage(cls, user_id, file_size):
        try:
            response = requests.post(
                f"{cls.BASE_URL}/{user_id}/check-storage/",
                json={"file_size": file_size},
                timeout=5
            )
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de contas (8001).")

    @classmethod
    def add_storage(cls, user_id, file_size):
        try:
            response = requests.post(
                f"{cls.BASE_URL}/{user_id}/add-storage/",
                json={"file_size": file_size},
                timeout=5
            )
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de contas (8001).")

    @classmethod
    def release_storage(cls, user_id, file_size):
        try:
            response = requests.post(
                f"{cls.BASE_URL}/{user_id}/release-storage/",
                json={"file_size": file_size},
                timeout=5
            )
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de contas (8001).")


class StorageServiceClient:
    """Cliente HTTP para comunicação com o microsserviço de armazenamento (Porta 8002)."""

    BASE_URL = settings.STORAGE_SERVICE_URL

    @classmethod
    def upload_file(cls, user_id, file_obj):
        try:
            files = {'file': (file_obj.name, file_obj.read(), file_obj.content_type)}
            data = {'user_id': user_id}
            response = requests.post(f"{cls.BASE_URL}/upload/", files=files, data=data, timeout=30)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de arquivos (8002).")

    @classmethod
    def list_files(cls, user_id):
        try:
            response = requests.get(f"{cls.BASE_URL}/user/{user_id}/", timeout=5)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de arquivos (8002).")

    @classmethod
    def get_file(cls, file_id):
        try:
            response = requests.get(f"{cls.BASE_URL}/{file_id}/", timeout=5)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de arquivos (8002).")

    @classmethod
    def delete_file(cls, file_id):
        try:
            response = requests.delete(f"{cls.BASE_URL}/{file_id}/", timeout=10)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de arquivos (8002).")

    @classmethod
    def get_file_content(cls, file_id, action="download"):
        try:
            response = requests.get(f"{cls.BASE_URL}/{file_id}/{action}/", stream=True, timeout=30)
            return response
        except requests.RequestException:
            raise ServiceUnavailable("Não foi possível conectar ao serviço de arquivos (8002).")
