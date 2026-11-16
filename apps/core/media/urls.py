# apps/core/media/urls.py
from django.urls import path
from .views import PresignedURLView

urlpatterns = [
    path("upload-url/", PresignedURLView.as_view(), name="presigned_upload_url"),
]