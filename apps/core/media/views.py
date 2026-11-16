# apps/core/media/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from accounts.permissions import IsSeller
from .storage import generate_presigned_upload

class PresignedURLView(APIView):
    permission_classes = [IsSeller]

    def post(self, request):
        file_name = request.data.get("file_name")
        file_type = request.data.get("file_type")
        if not file_name or not file_type:
            return Response({"error": "file_name and file_type are required"}, status=status.HTTP_400_BAD_REQUEST)

        upload_data = generate_presigned_upload(file_name, file_type)
        return Response(upload_data, status=status.HTTP_200_OK)