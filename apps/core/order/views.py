# order/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from catalog.models import ProductVariant
from .models import Cart, CartItem
from .serializers import CartSerializer
# append to order/views.py
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer

from rest_framework import generics

class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = list(cart.items.select_related("variant__product"))

        if not cart_items:
            return Response({"error": "Your cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get("shipping_address")
        contact_number = request.data.get("contact_number")
        if not shipping_address or not contact_number:
            return Response({"error": "shipping_address and contact_number are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Lock variant rows inside the atomic transaction to prevent overselling
        variant_ids = [item.variant_id for item in cart_items]
        locked_variants = {
            v.id: v for v in ProductVariant.objects.select_for_update().filter(id__in=variant_ids)
        }

        total_amount = 0
        order_items_to_create = []

        for item in cart_items:
            variant = locked_variants[item.variant_id]
            if variant.stock_quantity < item.quantity:
                return Response(
                    {"error": f"Insufficient stock for SKU {variant.sku}"},
                    status=status.HTTP_409_CONFLICT
                )

            variant.stock_quantity -= item.quantity
            variant.save(update_fields=["stock_quantity"])

            unit_price = variant.price_override if variant.price_override else variant.product.base_price
            total_amount += unit_price * item.quantity
            order_items_to_create.append({
                "variant": variant,
                "quantity": item.quantity,
                "price_at_purchase": unit_price
            })

        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            shipping_address=shipping_address,
            contact_number=contact_number,
            status="pending"
        )

        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                variant=data["variant"],
                quantity=data["quantity"],
                price_at_purchase=data["price_at_purchase"]
            ) for data in order_items_to_create
        ])

        cart.items.all().delete()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderHistoryView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items__variant__product").order_by("-created_at")