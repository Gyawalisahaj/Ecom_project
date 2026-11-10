# accounts/views.py
from rest_framework import generics
from rest_framework.permissions import AllowAny
from django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    """
    Endpoint for new customers to create an account.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    # This must be AllowAny so unauthenticated guests can sign up
    permission_classes = [AllowAny]