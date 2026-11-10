# order/serializers.py
from rest_framework import serializers
from .models import Cart, CartItem
from .models import Order, OrderItem

class CartItemSerializer(serializers.ModelSerializer):
    # We pull data across the relationship so Next.js doesn't have to make extra API calls
    variant_sku = serializers.CharField(source='variant.sku', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'variant', 'variant_sku', 'product_name', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'created_at']

    def get_total_items(self, obj):
        # Calculates the total quantity of all items in the cart
        return sum(item.quantity for item in obj.items.all())




class OrderItemSerializer(serializers.ModelSerializer):
    variant_sku = serializers.CharField(source='variant.sku', read_only=True)
    product_name = serializers.CharField(source='variant.product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'variant_sku', 'product_name', 'quantity', 'price_at_purchase']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'total_amount', 'status', 'shipping_address', 'contact_number', 'items', 'created_at']