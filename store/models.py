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

    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True, verbose_name="ID de Transacción", help_text="ID de PayPal o Referencia Kash")
    buyer_email = models.EmailField(null=True, blank=True, verbose_name="Correo del Comprador")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=10.00, verbose_name="Monto (USD)")
    currency = models.CharField(max_length=10, default='USD', verbose_name="Moneda")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='paypal', verbose_name="Método de Pago")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name="Estado")
    is_used = models.BooleanField(default=False, verbose_name="¿Activado / Usado?", help_text="Para evitar usos múltiples del ID de PayPal")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Compra")

    class Meta:
        verbose_name = "Venta Digital"
        verbose_name_plural = "Ventas Digitales (PayPal / Kash)"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.payment_method.upper()} - {self.transaction_id or 'Sin ID'} - {self.status}"


class ActivationCode(models.Model):
    code = models.CharField(max_length=50, unique=True, verbose_name="Código de Activación", help_text="Código manual o generado. Ej: MAT-ES-XXXX-CCCC")
    is_used = models.BooleanField(default=False, verbose_name="¿Ya fue usado?")
    purchase = models.OneToOneField(DigitalPurchase, on_delete=models.SET_NULL, null=True, blank=True, related_name='activation_code', verbose_name="Venta Digital Vinculada")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    used_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Uso")

    class Meta:
        verbose_name = "Código de Activación"
        verbose_name_plural = "Códigos de Activación"
        ordering = ['-created_at']

    def __str__(self):
        estado = "Usado" if self.is_used else "Disponible"
        return f"{self.code} [{estado}]"


class PhysicalOrder(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nombre Completo")
    phone = models.CharField(max_length=50, verbose_name="Teléfono / WhatsApp")
    department = models.CharField(max_length=100, verbose_name="Departamento")
    quantity = models.PositiveIntegerField(default=1, verbose_name="Cantidad de Libros")
    notes = models.TextField(null=True, blank=True, verbose_name="Notas Adicionales")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha del Pedido")

    class Meta:
        verbose_name = "Pedido de Libro Físico"
        verbose_name_plural = "Pedidos de Libros Físicos"
        ordering = ['-created_at']

    def __str__(self):
        return f"Pedido Físico: {self.name} - {self.quantity} libro(s) a {self.department}"


class ContactMessage(models.Model):
    name = models.CharField(max_length=200, verbose_name="Nombre del Remitente")
    email = models.EmailField(verbose_name="Correo Electrónico")
    subject = models.CharField(max_length=250, null=True, blank=True, verbose_name="Asunto")
    message = models.TextField(verbose_name="Mensaje")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Envío")

    class Meta:
        verbose_name = "Mensaje de Contacto"
        verbose_name_plural = "Mensajes de Contacto"
        ordering = ['-created_at']

    def __str__(self):
        return f"Mensaje de {self.name} - {self.subject or 'Sin Asunto'}"

