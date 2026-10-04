import os
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser

from storage.models import File
from storage.serializers import FileSerializer, FileUploadSerializer
from storage.services import StorageService


class FileUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        uploaded_file = serializer.validated_data['file']

        saved_file = StorageService.save_file(user_id=user_id, uploaded_file=uploaded_file)
        return Response(FileSerializer(saved_file).data, status=status.HTTP_201_CREATED)


class UserFilesListView(APIView):
    def get(self, request, user_id):
        files = StorageService.list_files(user_id=user_id)
        serializer = FileSerializer(files, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FileDetailView(APIView):
    def get(self, request, pk):
        file_obj = StorageService.get_file_by_id(pk)
        return Response(FileSerializer(file_obj).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        file_obj = StorageService.get_file_by_id(pk)
        result = StorageService.delete_file(file_obj)
        return Response({
            "detail": "Arquivo excluído com sucesso.",
            **result
        }, status=status.HTTP_200_OK)


class FileDownloadView(APIView):
    def get(self, request, pk):
        file_obj = StorageService.get_file_by_id(pk)
        if not file_obj.file or not os.path.exists(file_obj.file.path):
            raise Http404("Arquivo físico não encontrado no servidor.")

        response = FileResponse(open(file_obj.file.path, 'rb'), content_type=file_obj.content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_obj.original_name}"'
        return response


class FilePreviewView(APIView):
    def get(self, request, pk):
        file_obj = StorageService.get_file_by_id(pk)
        if not file_obj.file or not os.path.exists(file_obj.file.path):
            raise Http404("Arquivo físico não encontrado no servidor.")

        response = FileResponse(open(file_obj.file.path, 'rb'), content_type=file_obj.content_type)
        response['Content-Disposition'] = f'inline; filename="{file_obj.original_name}"'
        return response
