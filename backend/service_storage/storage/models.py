from django.db import models
import os

class File(models.Model):
    user_id = models.IntegerField(db_index=True)
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    original_name = models.CharField(max_length=255)
    size_bytes = models.BigIntegerField()
    content_type = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def size_mb(self):
        return round(self.size_bytes / (1024 * 1024), 2)

    def delete(self, *args, **kwargs):
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.original_name} (User {self.user_id})"