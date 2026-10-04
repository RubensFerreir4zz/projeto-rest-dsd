from rest_framework import serializers
from storage.models import File


class FileSerializer(serializers.ModelSerializer):
    size_mb = serializers.ReadOnlyField()

    class Meta:
        model = File
        fields = [
            'id',
            'user_id',
            'original_name',
            'size_bytes',
            'size_mb',
            'content_type',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'size_mb', 'created_at', 'updated_at']


class FileUploadSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    file = serializers.FileField()
