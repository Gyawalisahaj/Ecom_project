# apps/core/payment/views.py
import requests
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from order.models import Order
from .models import PaymentTransaction

class KhaltiInitiateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        if not order_id:
            return Response({"error": "order_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        order = get_object_or_404(Order, id=order_id, user=request.user)
        if order.status != "pending":
            return Response({"error": "Order is already paid or cancelled"}, status=status.HTTP_400_BAD_REQUEST)

        # Khalti requires amounts in paisa (1 NPR = 100 paisa)
        amount_paisa = int(order.total_amount * 100)

        payload = {
            "return_url": f"{settings.FRONTEND_BASE_URL}/payment/verify",
            "website_url": settings.FRONTEND_BASE_URL,
            "amount": amount_paisa,
            "purchase_order_id": str(order.id),
            "purchase_order_name": f"BuyIt Order #{order.id}",
            "customer_info": {
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.email,
                "email": request.user.email,
                "phone": order.contact_number,
            },
        }

        headers = {
            "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        resp = requests.post(f"{settings.KHALTI_BASE_URL}/epayment/initiate/", json=payload, headers=headers, timeout=15)
        data = resp.json()

        if resp.status_code != 200 or "pidx" not in data:
            return Response({"error": "Khalti initiation failed", "details": data}, status=status.HTTP_502_BAD_GATEWAY)

        PaymentTransaction.objects.create(
            order=order,
            provider="khalti",
            pidx=data["pidx"],
            amount_paisa=amount_paisa,
            status="initiated",
            raw_response=data,
        )

        return Response({"pidx": data["pidx"], "payment_url": data["payment_url"]}, status=status.HTTP_200_OK)


class KhaltiVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        pidx = request.data.get("pidx")
        if not pidx:
            return Response({"error": "pidx is required"}, status=status.HTTP_400_BAD_REQUEST)

        tx = get_object_or_404(PaymentTransaction.objects.select_for_update(), pidx=pidx, order__user=request.user)

        if tx.status == "completed":
            return Response({"status": "already_verified", "order_id": tx.order.id}, status=status.HTTP_200_OK)

        headers = {
            "Authorization": f"Key {settings.KHALTI_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        resp = requests.post(f"{settings.KHALTI_BASE_URL}/epayment/lookup/", json={"pidx": pidx}, headers=headers, timeout=15)
        data = resp.json()
        tx.raw_response = data

        if resp.status_code == 200 and data.get("status") == "Completed":
            tx.status = "completed"
            tx.transaction_id = data.get("transaction_id")
            tx.save(update_fields=["status", "transaction_id", "raw_response", "updated_at"])

            tx.order.status = "processing"
            tx.order.save(update_fields=["status", "updated_at"])

            return Response(
                {"status": "completed", "order_id": tx.order.id, "transaction_id": tx.transaction_id},
                status=status.HTTP_200_OK,
            )

        tx.status = "failed"
        tx.save(update_fields=["status", "raw_response", "updated_at"])
        return Response({"status": "failed", "details": data}, status=status.HTTP_400_BAD_REQUEST)