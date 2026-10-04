from django.urls import path
from gatewayapi.views import (
    RegisterView,
    LoginView,
    UserProfileView,
    FileListUploadView,
    FileDetailDeleteView,
    FileDownloadProxyView,
    FilePreviewProxyView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='gateway-register'),
    path('auth/login/', LoginView.as_view(), name='gateway-login'),
    path('me/', UserProfileView.as_view(), name='gateway-user-profile'),
    path('drive/files/', FileListUploadView.as_view(), name='gateway-files'),
    path('drive/files/<int:pk>/', FileDetailDeleteView.as_view(), name='gateway-file-detail'),
    path('drive/files/<int:pk>/download/', FileDownloadProxyView.as_view(), name='gateway-file-download'),
    path('drive/files/<int:pk>/preview/', FilePreviewProxyView.as_view(), name='gateway-file-preview'),
]
