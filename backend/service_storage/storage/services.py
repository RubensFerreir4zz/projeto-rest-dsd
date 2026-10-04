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
