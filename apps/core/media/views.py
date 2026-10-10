# media/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated  # <-- Import this
from .storage import generate_presigned_upload

class PresignedURLView(APIView):
    # Enforce that only users with a valid Bearer token can hit this view
    permission_classes = [IsAuthenticated] 
    
    def post(self, request):
        # ... (keep all the existing code inside the post method exactly the same) ...