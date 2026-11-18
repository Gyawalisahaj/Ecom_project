# catalog/serializers.py
from rest_framework import serializers
from .models import Category, Brand, Product, ProductVariant
from media.models import ProductImage

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

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'url', 'alt_text', 'is_primary', 'display_order']

class ProductSerializer(serializers.ModelSerializer):
    # Nesting relations: read_only=True ensures we only read data out
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'brand', 'description', 
            'base_price', 'specifications', 'variants', 'images', 'created_at'
        ]

class SellerProductCreateSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(write_only=True)
    stock_quantity = serializers.IntegerField(write_only=True, default=1)
    image_url = serializers.URLField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "category", "brand", "description",
            "base_price", "specifications", "sku", "stock_quantity", "image_url"
        ]

    def create(self, validated_data):
        sku = validated_data.pop("sku")
        stock_quantity = validated_data.pop("stock_quantity")
        image_url = validated_data.pop("image_url", "")

        product = Product.objects.create(**validated_data, is_active=True)
        ProductVariant.objects.create(
            product=product,
            sku=sku,
            stock_quantity=stock_quantity,
            attributes={}
        )
        if image_url:
            ProductImage.objects.create(
                product=product,
                url=image_url,
                alt_text=product.name,
                is_primary=True,
                display_order=0
            )
        # Re-save to ensure Meilisearch indexes the newly attached primary image
        product.save()
        return product
