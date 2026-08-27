from django.db import models
import uuid

class DigitalPurchase(models.Model):
    PAYMENT_METHODS = [
        ('paypal', 'PayPal'),
        ('kash', 'Kash'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
    ]

    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True, help_text="ID de PayPal o Referencia Kash")
    buyer_email = models.EmailField(null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    currency = models.CharField(max_length=10, default='USD')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='paypal')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_used = models.BooleanField(default=False, help_text="Para evitar usos múltiples del ID de PayPal")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payment_method.upper()} - {self.transaction_id or 'Sin ID'} - {self.status}"


class ActivationCode(models.Model):
    code = models.CharField(max_length=50, unique=True, help_text="Código manual o generado. Ej: MAT-ES-XXXX-CCCC")
    is_used = models.BooleanField(default=False)
    purchase = models.OneToOneField(DigitalPurchase, on_delete=models.SET_NULL, null=True, blank=True, related_name='activation_code')
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        estado = "Usado" if self.is_used else "Disponible"
        return f"{self.code} [{estado}]"


class PhysicalOrder(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nombre Completo")
    phone = models.CharField(max_length=50, verbose_name="Teléfono")
    department = models.CharField(max_length=100, verbose_name="Departamento")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Cantidad")
    notes = models.TextField(null=True, blank=True, verbose_name="Notas")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pedido Físico: {self.name} - {self.quantity} libro(s) a {self.department}"

class ContactMessage(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nombre")
    email = models.EmailField(verbose_name="Correo Electrónico")
    subject = models.CharField(max_length=250, null=True, blank=True, verbose_name="Asunto")
    message = models.TextField(verbose_name="Mensaje")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mensaje de {self.name} - {self.subject or 'Sin Asunto'}"
