# catalog/serializers.py
from rest_framework import serializers
from .models import Category, Brand, Product, ProductVariant

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'sku', 'price_override', 'stock_quantity', 'attributes']

class ProductSerializer(serializers.ModelSerializer):
    # Nesting relations: read_only=True ensures we only read data out
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'brand', 'description', 
            'base_price', 'specifications', 'variants', 'created_at'
        ]