
from django.urls import path
from .views import CartAPIView, CheckoutAPIView, OrderHistoryView

urlpatterns = [
    path("cart/", CartAPIView.as_view(), name="cart"),
    path("checkout/", CheckoutAPIView.as_view(), name="checkout"),
    path("history/", OrderHistoryView.as_view(), name="order_history"),
]