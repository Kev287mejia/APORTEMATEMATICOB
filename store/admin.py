from django.contrib import admin
from .models import DigitalPurchase, ActivationCode, PhysicalOrder, ContactMessage

admin.site.site_header = "Aporte Matemático — Panel de Administración"
admin.site.site_title = "Aporte Matemático Admin"
admin.site.index_title = "Gestión de Ventas, Códigos y Mensajes"


@admin.register(DigitalPurchase)
class DigitalPurchaseAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'buyer_email', 'amount', 'currency', 'status', 'is_used', 'created_at')
    search_fields = ('transaction_id', 'buyer_email')
    list_filter = ('status', 'payment_method', 'is_used', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'


@admin.register(ActivationCode)
class ActivationCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'is_used', 'purchase', 'created_at', 'used_at')
    search_fields = ('code', 'purchase__transaction_id', 'purchase__buyer_email')
    list_filter = ('is_used', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'


@admin.register(PhysicalOrder)
class PhysicalOrderAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'department', 'quantity', 'created_at')
    search_fields = ('name', 'phone', 'department', 'notes')
    list_filter = ('department', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'

