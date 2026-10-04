from django.urls import path
from storage.views import (
    FileUploadView,
    UserFilesListView,
    FileDetailView,
    FileDownloadView,
    FilePreviewView,
)

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('user/<int:user_id>/', UserFilesListView.as_view(), name='user-files-list'),
    path('<int:pk>/', FileDetailView.as_view(), name='file-detail'),
    path('<int:pk>/download/', FileDownloadView.as_view(), name='file-download'),
    path('<int:pk>/preview/', FilePreviewView.as_view(), name='file-preview'),
]
