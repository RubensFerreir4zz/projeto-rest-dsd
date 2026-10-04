from django.urls import path
from accounts.views import (
    RegisterView,
    VerifyCredentialsView,
    UserDetailView,
    CheckStorageView,
    AddStorageView,
    ReleaseStorageView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('verify-credentials/', VerifyCredentialsView.as_view(), name='user-verify-credentials'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('<int:pk>/check-storage/', CheckStorageView.as_view(), name='user-check-storage'),
    path('<int:pk>/add-storage/', AddStorageView.as_view(), name='user-add-storage'),
    path('<int:pk>/release-storage/', ReleaseStorageView.as_view(), name='user-release-storage'),
]
