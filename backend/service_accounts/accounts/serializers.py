from rest_framework import serializers
from accounts.models import User

class UserSerializer(serializers.ModelSerializer):
    storage_limit = serializers.ReadOnlyField()
    has_available_space = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email', 
            'plan', 
            'storage_used', 
            'storage_limit', 
            'has_available_space'
        ]
        read_only_fields = ['id', 'storage_used']

class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'plan']

class StorageUpdateSerializer(serializers.Serializer):
    file_size = serializers.IntegerField(min_value=1)