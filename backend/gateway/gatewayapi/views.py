from django.http import HttpResponse, StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiResponse

from gatewayapi.serializers import (
    RegisterRequestSerializer,
    LoginRequestSerializer,
    FileUploadRequestSerializer,
)
from gatewayapi.clients import AccountsServiceClient, StorageServiceClient
from gatewayapi.auth import generate_jwt_for_user
from gatewayapi.hateoas import HateoasBuilder


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Registrar novo usuário",
        tags=["Autenticação"],
        request=RegisterRequestSerializer,
        responses={201: OpenApiResponse(description="Usuário criado com token JWT")}
    )
    def post(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Chama a API de Contas (8001)
        resp = AccountsServiceClient.register(
            username=serializer.validated_data["username"],
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            plan=serializer.validated_data.get("plan")
        )

        if resp.status_code != 201:
            return Response(resp.json(), status=resp.status_code)

        user_data = resp.json()
        token = generate_jwt_for_user(user_data)
        user_data["_links"] = HateoasBuilder.user_profile_links(user_data["id"])

        return Response({
            "message": "Usuário registrado com sucesso!",
            "token": token,
            "user": user_data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Login e obtenção de token JWT",
        tags=["Autenticação"],
        request=LoginRequestSerializer,
        responses={200: OpenApiResponse(description="Token JWT gerado com sucesso")}
    )
    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resp = AccountsServiceClient.verify_credentials(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"]
        )

        if resp.status_code != 200:
            return Response(resp.json(), status=resp.status_code)

        user_data = resp.json()
        token = generate_jwt_for_user(user_data)
        user_data["_links"] = HateoasBuilder.user_profile_links(
            user_data["id"],
            has_space=user_data.get("has_available_space", True)
        )

        return Response({
            "token": token,
            "user": user_data
        }, status=status.HTTP_200_OK)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Consultar perfil, plano e cota do usuário logado",
        tags=["Autenticação"],
        responses={200: OpenApiResponse(description="Dados do perfil e links HATEOAS")}
    )
    def get(self, request):
        resp = AccountsServiceClient.get_user(request.user.id)
        if resp.status_code != 200:
            return Response(resp.json(), status=resp.status_code)

        user_data = resp.json()
        user_data["_links"] = HateoasBuilder.user_profile_links(
            request.user.id,
            has_space=user_data.get("has_available_space", True)
        )
        return Response(user_data, status=status.HTTP_200_OK)


class FileListUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Listar arquivos do usuário autenticado (com HATEOAS)",
        tags=["Arquivos"],
    )
    def get(self, request):
        resp = StorageServiceClient.list_files(request.user.id)
        if resp.status_code != 200:
            return Response(resp.json(), status=resp.status_code)

        files_data = resp.json()
        enriched_files = HateoasBuilder.enrich_file_list(files_data, request)
        return Response(enriched_files, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Upload de arquivo com validação distribuída de cota",
        tags=["Arquivos"],
        request=FileUploadRequestSerializer,
    )
    def post(self, request):
        serializer = FileUploadRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.validated_data["file"]

        check_resp = AccountsServiceClient.check_storage(request.user.id, uploaded_file.size)
        if check_resp.status_code != 200:
            return Response(check_resp.json(), status=check_resp.status_code)

        check_data = check_resp.json()
        if not check_data.get("available", False):
            return Response({
                "detail": "Cota de armazenamento insuficiente para este arquivo.",
                "current_used": check_data.get("current_used"),
                "storage_limit": check_data.get("storage_limit"),
                "file_size": uploaded_file.size
            }, status=status.HTTP_400_BAD_REQUEST)

        storage_resp = StorageServiceClient.upload_file(request.user.id, uploaded_file)
        if storage_resp.status_code != 201:
            return Response(storage_resp.json(), status=storage_resp.status_code)

        file_data = storage_resp.json()

        AccountsServiceClient.add_storage(request.user.id, uploaded_file.size)

        enriched_file = HateoasBuilder.enrich_file(file_data, request)
        return Response(enriched_file, status=status.HTTP_201_CREATED)


class FileDetailDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Obter metadados de um arquivo com HATEOAS", tags=["Arquivos"])
    def get(self, request, pk):
        resp = StorageServiceClient.get_file(pk)
        if resp.status_code != 200:
            return Response(resp.json(), status=resp.status_code)

        file_data = resp.json()
        if file_data.get("user_id") != request.user.id:
            return Response({"detail": "Acesso não autorizado a este arquivo."}, status=status.HTTP_403_FORBIDDEN)

        return Response(HateoasBuilder.enrich_file(file_data, request), status=status.HTTP_200_OK)

    @extend_schema(summary="Excluir arquivo e estornar cota no serviço de contas", tags=["Arquivos"])
    def delete(self, request, pk):
        file_resp = StorageServiceClient.get_file(pk)
        if file_resp.status_code != 200:
            return Response(file_resp.json(), status=file_resp.status_code)

        file_data = file_resp.json()
        if file_data.get("user_id") != request.user.id:
            return Response({"detail": "Acesso não autorizado a este arquivo."}, status=status.HTTP_403_FORBIDDEN)

        del_resp = StorageServiceClient.delete_file(pk)
        if del_resp.status_code != 200:
            return Response(del_resp.json(), status=del_resp.status_code)

        file_size = file_data.get("size_bytes", 0)
        AccountsServiceClient.release_storage(request.user.id, file_size)

        return Response({
            "message": "Arquivo excluído com sucesso e cota liberada!",
            "released_bytes": file_size
        }, status=status.HTTP_200_OK)


class FileDownloadProxyView(APIView):
    permission_classes = [AllowAny] 

    @extend_schema(summary="Download de arquivo via Gateway", tags=["Arquivos"])
    def get(self, request, pk):
        resp = StorageServiceClient.get_file_content(pk, action="download")
        if resp.status_code != 200:
            return Response({"detail": "Arquivo não encontrado."}, status=resp.status_code)

        response = HttpResponse(resp.content, content_type=resp.headers.get("Content-Type", "application/octet-stream"))
        if "Content-Disposition" in resp.headers:
            response["Content-Disposition"] = resp.headers["Content-Disposition"]
        return response


class FilePreviewProxyView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(summary="Visualização inline (preview) via Gateway", tags=["Arquivos"])
    def get(self, request, pk):
        resp = StorageServiceClient.get_file_content(pk, action="preview")
        if resp.status_code != 200:
            return Response({"detail": "Arquivo não encontrado."}, status=resp.status_code)

        response = HttpResponse(resp.content, content_type=resp.headers.get("Content-Type", "application/octet-stream"))
        if "Content-Disposition" in resp.headers:
            response["Content-Disposition"] = resp.headers["Content-Disposition"]
        return response
