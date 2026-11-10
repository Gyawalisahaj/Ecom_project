# order/urls.py
from django.urls import path
from .views import CartAPIView, CheckoutAPIView

urlpatterns = [
    path('cart/', CartAPIView.as_view(), name='cart'),
    path('checkout/', CheckoutAPIView.as_view(), name='checkout'),
]