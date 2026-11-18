# media/models.py
from django.db import models

class ProductImage(models.Model):
    product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return f"Image for {self.product.name} ({'Primary' if self.is_primary else 'Secondary'})"
