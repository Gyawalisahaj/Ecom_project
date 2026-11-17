
from django.contrib import admin
from .models import PaymentTransaction

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'provider', 'pidx', 'amount_paisa', 'status', 'created_at')
    list_filter = ('provider', 'status')
    search_fields = ('pidx', 'transaction_id', 'order__id')