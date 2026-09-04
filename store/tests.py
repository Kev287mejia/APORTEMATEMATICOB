import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from unittest.mock import patch

from .models import DigitalPurchase, ActivationCode, PhysicalOrder, ContactMessage


class PhysicalOrderTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('submit_pedido')

    def test_valid_order_creates_record_and_redirects(self):
        """Un pedido físico con campos válidos debe persistirse en base de datos y redirigir."""
        payload = {
            'name': 'Profesor Martínez',
            'phone': '50588889999',
            'department': 'Managua',
            'quantity': '2',
            'notes': 'Entregar en la universidad'
        }
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(PhysicalOrder.objects.count(), 1)
        
        order = PhysicalOrder.objects.first()
        self.assertEqual(order.name, 'Profesor Martínez')
        self.assertEqual(order.quantity, 2)
        self.assertEqual(order.department, 'Managua')

    def test_order_missing_required_fields_rejected(self):
        """Un pedido físico sin nombre o teléfono debe ser rechazado sin persistir."""
        payload = {
            'name': '',
            'phone': '',
            'department': 'León'
        }
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(PhysicalOrder.objects.count(), 0)

    def test_order_quantity_boundary_validation(self):
        """Valores anómalos o negativos de cantidad deben normalizarse a 1."""
        payload = {
            'name': 'Docente Gómez',
            'phone': '50577778888',
            'department': 'Granada',
            'quantity': '-15'
        }
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 302)
        order = PhysicalOrder.objects.first()
        self.assertIsNotNone(order)
        self.assertEqual(order.quantity, 1)


class ContactMessageTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('submit_contacto')

    @patch('resend.Emails.send')
    def test_valid_contact_creates_record_and_sends_email(self, mock_email_send):
        """Mensaje de contacto válido debe guardarse y disparar notificación vía Resend."""
        mock_email_send.return_value = {'id': 'test-msg-123'}
        payload = {
            'name': 'Matemático Aficionado',
            'email': 'aficionado@example.com',
            'subject': 'Consulta sobre Teorema',
            'message': 'Excelente obra sobre la suma de dos cuadrados.'
        }
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(ContactMessage.objects.count(), 1)
        
        msg = ContactMessage.objects.first()
        self.assertEqual(msg.name, 'Matemático Aficionado')
        self.assertEqual(msg.email, 'aficionado@example.com')
        mock_email_send.assert_called_once()

    def test_invalid_email_format_rejected(self):
        """Correo con formato inválido debe ser rechazado sin persistir."""
        payload = {
            'name': 'Remitente Inválido',
            'email': 'correo-sin-arroba',
            'message': 'Hola mundo'
        }
        response = self.client.post(self.url, data=payload)
        self.assertEqual(response.status_code, 302)
        self.assertEqual(ContactMessage.objects.count(), 0)


class ActivationCodeRedemptionTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('verify_purchase')
        self.purchase = DigitalPurchase.objects.create(
            transaction_id='PAYID-TEST-12345',
            buyer_email='comprador@example.com',
            amount=10.00,
            status='completed'
        )
        self.activation = ActivationCode.objects.create(
            purchase=self.purchase,
            code='MAT-ES-TEST-9999'
        )

    def test_redeem_valid_activation_code_succeeds(self):
        """Un código existente y no usado debe marcarse como usado y retornar éxito."""
        response = self.client.post(
            self.url,
            data=json.dumps({'code': 'MAT-ES-TEST-9999'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        
        self.activation.refresh_from_db()
        self.assertTrue(self.activation.is_used)
        self.assertIsNotNone(self.activation.used_at)

    def test_cannot_reuse_already_redeemed_code(self):
        """Un código ya canjeado debe ser rechazado con código 400."""
        self.activation.is_used = True
        self.activation.save()

        response = self.client.post(
            self.url,
            data=json.dumps({'code': 'MAT-ES-TEST-9999'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertFalse(data.get('success'))
        self.assertIn('ya ha sido utilizado', data.get('message', ''))

    def test_invalid_or_nonexistent_code_returns_404(self):
        """Un código inventado o erróneo debe retornar código 404."""
        response = self.client.post(
            self.url,
            data=json.dumps({'code': 'CODIGO-INVENTADO-XYZ'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertFalse(data.get('success'))


class AdminGenerateCodeAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('admin_generate_code')
        self.staff_user = User.objects.create_user(
            username='admin_staff',
            password='Password123!',
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username='regular_user',
            password='Password123!',
            is_staff=False
        )

    def test_anonymous_access_forbidden(self):
        """Peticiones sin sesión administrativa deben retornar 403 Forbidden."""
        response = self.client.post(
            self.url,
            data=json.dumps({'name': 'Cliente Anónimo', 'phone': '12345678', 'lang': 'ES'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)

    def test_non_staff_user_forbidden(self):
        """Usuarios autenticados pero sin permisos de staff deben retornar 403 Forbidden."""
        self.client.login(username='regular_user', password='Password123!')
        response = self.client.post(
            self.url,
            data=json.dumps({'name': 'Cliente Test', 'phone': '12345678', 'lang': 'ES'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 403)

    def test_staff_user_generates_and_persists_code(self):
        """Un usuario staff debe poder generar un código y persistirlo en la base de datos."""
        self.client.login(username='admin_staff', password='Password123!')
        response = self.client.post(
            self.url,
            data=json.dumps({'name': 'Profesor Carlos', 'phone': '88881234', 'lang': 'ES'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))
        code = data.get('code')
        self.assertTrue(code.startswith('MAT-ES-'))

        # Verificar que el código se guardó en PostgreSQL/SQLite
        self.assertTrue(ActivationCode.objects.filter(code=code).exists())
        activation = ActivationCode.objects.get(code=code)
        self.assertFalse(activation.is_used)
        self.assertEqual(activation.purchase.payment_method, 'kash')

    def test_generated_code_can_be_redeemed_by_customer(self):
        """El código generado por el administrador debe poder ser canjeado por el cliente final."""
        self.client.login(username='admin_staff', password='Password123!')
        gen_resp = self.client.post(
            self.url,
            data=json.dumps({'name': 'Comprador Kash', 'phone': '50584180000', 'lang': 'ALL'}),
            content_type='application/json'
        )
        code = gen_resp.json().get('code')
        self.client.logout()

        # El cliente anónimo canjea el código en la web
        verify_url = reverse('verify_purchase')
        redeem_resp = self.client.post(
            verify_url,
            data=json.dumps({'code': code}),
            content_type='application/json'
        )
        self.assertEqual(redeem_resp.status_code, 200)
        self.assertTrue(redeem_resp.json().get('success'))
        
        # Debe quedar marcado como usado
        activation = ActivationCode.objects.get(code=code)
        self.assertTrue(activation.is_used)


class ExcelReportExportTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('export_master_report_excel')
        self.staff_user = User.objects.create_user(
            username='admin_export',
            password='Password123!',
            is_staff=True
        )

    def test_anonymous_access_redirects_to_login(self):
        """Descargar el reporte sin autenticación debe redirigir al login."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)

    def test_staff_user_downloads_valid_excel(self):
        """Usuario staff autenticado descarga el archivo Excel con Content-Type correcto."""
        self.client.login(username='admin_export', password='Password123!')
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        self.assertIn('Reporte_General_Estadisticas_Aporte_Matematico', response['Content-Disposition'])

