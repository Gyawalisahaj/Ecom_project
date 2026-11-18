# catalog/views.py
from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from rest_framework import generics
from accounts.permissions import IsSeller
from .serializers import SellerProductCreateSerializer


class SellerProductCreateView(generics.CreateAPIView):
    serializer_class = SellerProductCreateSerializer
    permission_classes = [IsSeller]

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Retrieves the list of active products. 
    ReadOnlyModelViewSet automatically provides 'list' (GET /products/) 
    and 'retrieve' (GET /products/{id}/) actions.
    """
    serializer_class = ProductSerializer

    def get_queryset(self):
        # Acceptance Criteria: Only return products where is_active=True
        # select_related & prefetch_related prevent the "N+1 query problem" 
        # by joining the database tables efficiently in a single query.
        return Product.objects.filter(is_active=True)\
            .select_related('category', 'brand')\
            .prefetch_related('variants', 'images')\
            .order_by('-created_at')



class SellerProductManageView(generics.ListCreateAPIView):
    serializer_class = SellerProductCreateSerializer
    permission_classes = [IsSeller]

    def get_queryset(self):
        return Product.objects.all().select_related('brand', 'category').prefetch_related('variants', 'images').order_by('-created_at')

class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = SellerProductCreateSerializer
    permission_classes = [IsSeller]