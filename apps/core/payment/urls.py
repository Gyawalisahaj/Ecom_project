# apps/core/payment/urls.py
from django.urls import path
from .views import KhaltiInitiateView, KhaltiVerifyView

urlpatterns = [
    path("khalti/initiate/", KhaltiInitiateView.as_view(), name="khalti_initiate"),
    path("khalti/verify/", KhaltiVerifyView.as_view(), name="khalti_verify"),
]