from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from accounts.models import User
from accounts.serializers import UserSerializer, RegisterUserSerializer, StorageUpdateSerializer
from accounts.services import UserService



class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.create_user(**serializer.validated_data)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class VerifyCredentialsView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Credenciais inválidas'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = UserService.authenticate_user(email, password)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)


class UserDetailView(APIView):
    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class CheckStorageView(APIView):
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = StorageUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_size = serializer.validated_data['file_size']
        has_space = UserService.check_storage_available(user, file_size)
        return Response({
            "available": has_space,
            "current_used": user.storage_used,
            "storage_limit": user.storage_limit,
            "file_size": file_size
        }, status=status.HTTP_200_OK)

class AddStorageView(APIView):
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = StorageUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.add_storage_user(user, serializer.validated_data['file_size'])
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

class ReleaseStorageView(APIView):
    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = StorageUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserService.release_storage_user(user, serializer.validated_data['file_size'])
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)