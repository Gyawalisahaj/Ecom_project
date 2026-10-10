# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # This acts as our login endpoint
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # This refreshes the access token in the background
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]