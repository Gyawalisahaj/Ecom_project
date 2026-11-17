from django.db import models
from order.models import Order

class PaymentTransaction(models.Model):
    PROVIDER_CHOICES = (
        ('khalti', 'Khalti'),
        ('esewa', 'eSewa'),
    )
    STATUS_CHOICES = (
        ('initiated', 'Initiated'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='khalti')
    pidx = models.CharField(max_length=120, unique=True, db_index=True)
    transaction_id = models.CharField(max_length=120, blank=True, null=True)
    amount_paisa = models.PositiveBigIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    raw_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider.upper()} | Order #{self.order.id} | {self.status}"