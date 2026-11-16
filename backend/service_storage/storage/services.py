import os
from django.core.files.base import ContentFile
from storage.models import File
from rest_framework.exceptions import NotFound


class StorageService:

    @staticmethod
    def save_file(user_id: int, uploaded_file) -> File:
        file_obj = File.objects.create(
            user_id=user_id,
            file=uploaded_file,
            original_name=uploaded_file.name,
            size_bytes=uploaded_file.size,
            content_type=getattr(uploaded_file, 'content_type', '') or 'application/octet-stream'
        )
        return file_obj

    @staticmethod
    def list_files(user_id: int):
        return File.objects.filter(user_id=user_id).order_by('-created_at')

    @staticmethod
    def get_file_by_id(file_id: int) -> File:
        try:
            return File.objects.get(id=file_id)
        except File.DoesNotExist:
            raise NotFound({"detail": "Arquivo não encontrado."})

    @staticmethod
    def delete_file(file_obj: File) -> dict:
        user_id = file_obj.user_id
        size_bytes = file_obj.size_bytes
        file_obj.delete()
        return {
            "user_id": user_id,
            "released_bytes": size_bytes
        }

    @staticmethod
    def clone_file(source_file_id: int, target_user_id: int) -> File:
        source = StorageService.get_file_by_id(source_file_id)
        if not source.file or not os.path.exists(source.file.path):
            raise NotFound({"detail": "Arquivo físico não encontrado para clonagem."})

        with open(source.file.path, 'rb') as f:
            cloned_content = ContentFile(f.read(), name=source.original_name)

        cloned_file = File.objects.create(
            user_id=target_user_id,
            file=cloned_content,
            original_name=source.original_name,
            size_bytes=source.size_bytes,
            content_type=source.content_type,
            hash_sha256=source.hash_sha256,
            protocolo_soap=source.protocolo_soap,
            autenticado_em=source.autenticado_em
        )
        return cloned_file
