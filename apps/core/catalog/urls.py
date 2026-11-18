
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, SellerProductManageView, SellerProductDetailView

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

urlpatterns = [
    path("seller/products/", SellerProductManageView.as_view(), name="seller_manage_products"),
    path("seller/products/<int:pk>/", SellerProductDetailView.as_view(), name="seller_detail_product"),
    path("", include(router.urls)),
]