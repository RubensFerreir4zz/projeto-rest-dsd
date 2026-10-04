from rest_framework import serializers


class RegisterRequestSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    plan = serializers.CharField(default="free", required=False)


class LoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class FileUploadRequestSerializer(serializers.Serializer):
    file = serializers.FileField()
