# orders/models.py
from django.db import models
from django.conf import settings
from catalog.models import ProductVariant

class Cart(models.Model):
    # A cart belongs to a user. If they aren't logged in yet, Next.js will store
    # items in localStorage until they register, then sync them here.
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    # We link to the Variant (e.g., Space Gray 512GB), NOT the base Product
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.variant.sku}"

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Payment'),
        ('processing', 'Processing (Paid)'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='orders')

    # Snapshot of the total price at the time of checkout
    # (in case the product price changes later, the receipt stays accurate)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Shipping details (We can expand this to a dedicated Address model later)
    shipping_address = models.TextField()
    contact_number = models.CharField(max_length=15)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.email}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    # Snapshot of the individual item price at the time of checkout
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity}x {self.variant.sku} for Order #{self.order.id}"