from django.contrib import admin
from .models import DigitalPurchase, ActivationCode, PhysicalOrder, ContactMessage

@admin.register(DigitalPurchase)
class DigitalPurchaseAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'buyer_email', 'status', 'payment_method', 'created_at')
    search_fields = ('transaction_id', 'buyer_email')
    list_filter = ('status', 'payment_method')

@admin.register(ActivationCode)
class ActivationCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'is_used', 'created_at', 'used_at')
    search_fields = ('code',)
    list_filter = ('is_used',)

@admin.register(PhysicalOrder)
class PhysicalOrderAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'department', 'quantity', 'created_at')
    search_fields = ('name', 'phone', 'department')
    list_filter = ('department',)

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    search_fields = ('name', 'email', 'subject')
