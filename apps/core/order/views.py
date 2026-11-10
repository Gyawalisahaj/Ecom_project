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

class CartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Fetch the cart for the user, or create an empty one if they just registered
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)

        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))

        if not variant_id:
            return Response({"error": "variant_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure the variant actually exists in the catalog
        variant = get_object_or_404(ProductVariant, id=variant_id)

        # If the item is already in the cart, increase quantity. Otherwise, add it.
        cart_item, created = CartItem.objects.get_or_create(cart=cart, variant=variant)
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        # Return the updated cart so Next.js can update the UI immediately
        serializer = CartSerializer(cart)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # 1. Grab the user's cart
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_items = cart.items.all()

        if not cart_items.exists():
            return Response({"error": "Your cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        shipping_address = request.data.get('shipping_address')
        contact_number = request.data.get('contact_number')

        if not shipping_address or not contact_number:
            return Response(
                {"error": "shipping_address and contact_number are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Calculate the total and prepare order items
        total_amount = 0
        order_items_to_create = []

        for item in cart_items:
            # Use price_override if the variant has a custom price, otherwise use the base Product price
            unit_price = item.variant.price_override if item.variant.price_override else item.variant.product.base_price
            total_amount += (unit_price * item.quantity)

            order_items_to_create.append({
                'variant': item.variant,
                'quantity': item.quantity,
                'price_at_purchase': unit_price
            })

        # 3. Create the parent Order
        order = Order.objects.create(
            user=request.user,
            total_amount=total_amount,
            shipping_address=shipping_address,
            contact_number=contact_number,
            status='pending'
        )

        # 4. Bulk create the OrderItems
        OrderItem.objects.bulk_create([
            OrderItem(
                order=order,
                variant=item_data['variant'],
                quantity=item_data['quantity'],
                price_at_purchase=item_data['price_at_purchase']
            ) for item_data in order_items_to_create
        ])

        # 5. Empty the customer's cart
        cart.items.all().delete()

        # 6. Return the finalized order receipt
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)