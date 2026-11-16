from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SellerProductCreateView

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [
    path("seller/products/", SellerProductCreateView.as_view(), name="seller_create_product"),
    path("", include(router.urls)),
]