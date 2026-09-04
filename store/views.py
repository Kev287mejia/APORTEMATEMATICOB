import os
import logging
import string
import random
import base64
import uuid
import requests
import resend

import datetime
from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape, strip_tags
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings


from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import DigitalPurchase, ActivationCode, PhysicalOrder, ContactMessage

logger = logging.getLogger('store')


def index_view(request):
    return render(request, 'index.html')


def contacto_view(request):
    return render(request, 'contacto.html')


def pedido_view(request):
    return render(request, 'pedido.html')


from .excel_reports import generate_master_executive_workbook

@staff_member_required(login_url='/admin/login/?next=/activador/')
def activador_view(request):
    return render(request, 'activador.html')



@staff_member_required(login_url='/admin/login/?next=/admin/exportar-reporte-general/')
def export_master_report_excel(request):
    """Endpoint administrativo para descargar el Reporte Maestro en Excel con KPIs ejecutivos."""
    wb = generate_master_executive_workbook()
    response = HttpResponse(content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    filename = f"Reporte_General_Estadisticas_Aporte_Matematico_{datetime.datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    wb.save(response)
    return response



@api_view(['POST'])
def verify_purchase(request):
    raw_code = request.data.get('code', '')
    if not isinstance(raw_code, str):
        return Response({'success': False, 'message': 'Formato inválido.'}, status=400)
    
    code = raw_code.strip()
    
    # Input validation: check max length and characters
    if not code or len(code) > 60:
        return Response({'success': False, 'message': 'Código vacío o excede la longitud permitida.'}, status=400)
    
    # 1. Chequear si es un código de activación manual
    try:
        activation = ActivationCode.objects.get(code=code)
        if activation.is_used:
            return Response({'success': False, 'message': 'Este código ya ha sido utilizado.'}, status=400)
        
        # Marcar como usado
        activation.is_used = True
        activation.used_at = timezone.now()
        activation.save()
        logger.info(f"ActivationCode {code} successfully activated.")
        return Response({'success': True, 'message': 'Código activado con éxito.'})
    except ActivationCode.DoesNotExist:
        pass
    
    # 2. Chequear si es un ID de transacción de PayPal completado
    try:
        purchase = DigitalPurchase.objects.get(transaction_id=code, status='completed')
        
        if purchase.is_used:
            return Response({'success': False, 'message': 'Este ID de transacción ya fue utilizado en otro dispositivo.'}, status=400)
            
        # Marcar como usado
        purchase.is_used = True
        purchase.save()
        logger.info(f"DigitalPurchase {code} successfully verified.")
        return Response({'success': True, 'message': 'Compra verificada con éxito.'})
    except DigitalPurchase.DoesNotExist:
        return Response({'success': False, 'message': 'Código o transacción inválidos.'}, status=404)


def verify_paypal_order(order_id):
    """
    Verifica una orden de compra contra la API REST oficial de PayPal.
    Retorna (is_valid: bool, result_or_error: dict/str).
    """
    client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '')
    client_secret = getattr(settings, 'PAYPAL_CLIENT_SECRET', '')
    mode = getattr(settings, 'PAYPAL_MODE', 'live').lower()
    base_url = "https://api-m.sandbox.paypal.com" if mode == 'sandbox' else "https://api-m.paypal.com"

    if not client_id or not client_secret:
        # En modo de desarrollo (DEBUG=True), permitir simulación para testing local
        if getattr(settings, 'DEBUG', True):
            logger.warning(f"PAYPAL_CLIENT_SECRET no configurado. Permitiendo simulación de orden {order_id} en modo DEBUG.")
            return True, {'status': 'COMPLETED', 'simulated': True}
        return False, "Credenciales de PayPal no configuradas en el servidor de producción."

    try:
        # 1. Obtener Token de acceso OAuth2
        auth_resp = requests.post(
            f"{base_url}/v1/oauth2/token",
            auth=(client_id, client_secret),
            data={'grant_type': 'client_credentials'},
            headers={'Accept': 'application/json'},
            timeout=10
        )
        if auth_resp.status_code != 200:
            logger.error(f"Fallo de autenticación OAuth2 en PayPal: {auth_resp.status_code} - {auth_resp.text}")
            return False, f"Error de autenticación con PayPal (código {auth_resp.status_code})."

        access_token = auth_resp.json().get('access_token')

        # 2. Consultar detalles de la orden
        order_resp = requests.get(
            f"{base_url}/v2/checkout/orders/{order_id}",
            headers={
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
            },
            timeout=10
        )
        if order_resp.status_code != 200:
            logger.error(f"Fallo consultando orden {order_id} en PayPal: {order_resp.status_code} - {order_resp.text}")
            return False, f"Orden no encontrada en PayPal (código {order_resp.status_code})."

        order_data = order_resp.json()
        status = order_data.get('status', '').upper()
        if status != 'COMPLETED':
            return False, f"Estado de orden no completado: {status}."

        # 3. Validar montos y moneda
        purchase_units = order_data.get('purchase_units', [])
        if not purchase_units:
            return False, "Orden sin unidades de compra válidas."

        amount_info = purchase_units[0].get('amount', {})
        currency = amount_info.get('currency_code', '')
        value_str = amount_info.get('value', '0')

        if currency != 'USD':
            return False, f"Moneda inválida ({currency}). Se requiere USD."

        try:
            val_float = float(value_str)
            if val_float < 9.99:
                return False, f"Monto recibido insuficiente (${val_float} USD)."
        except ValueError:
            return False, f"Monto no convertible: {value_str}."

        return True, order_data
    except requests.RequestException as e:
        logger.error(f"Error de conexión con la API de PayPal: {e}")
        return False, f"Error de comunicación con PayPal: {str(e)}"
    except Exception as e:
        logger.error(f"Error inesperado validando orden PayPal: {e}")
        return False, f"Error interno: {str(e)}"


@api_view(['POST'])
def save_paypal_purchase(request):
    data = request.data
    transaction_id = data.get('id')
    payer_email = data.get('payerEmail')
    status = data.get('status', 'completed').lower()
    
    if not transaction_id:
        return Response({'success': False, 'message': 'Falta el ID de transacción'}, status=400)
    
    # Verificación server-side con la API oficial de PayPal
    is_valid, paypal_res = verify_paypal_order(transaction_id)
    if not is_valid:
        logger.warning(f"Intento de registro de compra PayPal inválido: {transaction_id} - {paypal_res}")
        return Response({'success': False, 'message': f'Verificación de PayPal fallida: {paypal_res}'}, status=400)

    # Si PayPal retornó información detallada del pagador y no venía en la petición, usarla
    if isinstance(paypal_res, dict) and not payer_email:
        payer_info = paypal_res.get('payer', {})
        payer_email = payer_info.get('email_address', payer_email)
    
    with transaction.atomic():
        # Crear o actualizar la compra digital
        purchase, created = DigitalPurchase.objects.get_or_create(
            transaction_id=transaction_id,
            defaults={
                'buyer_email': payer_email,
                'payment_method': 'paypal',
                'status': status
            }
        )
        
        # Si la compra es nueva y fue completada, generar código y enviar correo
        if created and status == 'completed':
            # Generar código único aleatorio de 8 caracteres
            while True:
                code_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
                if not ActivationCode.objects.filter(code=code_str).exists():
                    break

            activation = ActivationCode.objects.create(
                purchase=purchase,
                code=code_str
            )
            logger.info(f"Generated new activation code {code_str} for purchase {transaction_id}")
            
            # URL publica alojada en CDN para maxima compatibilidad en Gmail/Outlook
            sig_image_url = "https://raw.githubusercontent.com/Kev287mejia/APORTEMATEMATICOB/main/static/firma_acevedo.png"

            # Enviar correo al comprador
            resend.api_key = getattr(settings, 'RESEND_API_KEY', '')
            from_email = getattr(settings, 'RESEND_FROM_EMAIL', 'onboarding@resend.dev')
            try:
                resend.Emails.send({
                    "from": f"Aporte Matemático <{from_email}>",
                    "to": payer_email,
                    "subject": '¡Gracias por adquirir "Un Aporte Matemático en el Siglo 21 - Factorización de a^2+b^2, en los Números Reales"!',
                "html": f"""
                <link rel="preconnect" href="https://fonts.googleapis.com">
                <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Josefin+Sans:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
                
                <div style="margin: 0; padding: 40px 15px; background-color: #ede7df; font-family: 'Playfair Display', Georgia, serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #faf7f2; border: 1px solid #dcd4c8; border-radius: 6px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
                        
                        <!-- Header Odrin Classical -->
                        <div style="background: #1a2744; padding: 36px 30px 28px 30px; text-align: center; border-bottom: 3px solid #d38d45;">
                            <p style="font-family: 'Josefin Sans', sans-serif; font-size: 11px; font-weight: 700; color: #faab9f; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 10px 0;">
                                Aporte Matemático
                            </p>
                            <h1 style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 24px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 1.5px; line-height: 1.3;">
                                ¡Gracias!
                            </h1>
                            <p style="font-family: 'Josefin Sans', sans-serif; font-size: 12px; color: #e0d8cf; margin: 8px 0 0 0; letter-spacing: 1px;">
                                Edición Digital Desbloqueada
                            </p>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 36px 34px 28px 34px; background-color: #faf7f2; color: #2c2c2c;">
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #2c2c2c; margin: 0 0 16px 0;">
                                <strong>Estimado(a) Lector(a):</strong>
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 16px 0;">
                                Gracias por la adquisición de esta obra literaria:
                            </p>
                            
                            <!-- Book Title Box -->
                            <div style="background-color: #ffffff; border: 1px solid #e8decb; border-left: 4px solid #d38d45; padding: 18px 22px; margin: 22px 0; border-radius: 0 4px 4px 0; text-align: center;">
                                <span style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 15px; font-weight: 700; color: #1a2744; letter-spacing: 0.5px; line-height: 1.6; display: block;">
                                    "Un Aporte Matemático en el Siglo 21:<br>
                                    Factorización de a²+b², en los Números Reales"
                                </span>
                            </div>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                                Como autor del libro, me place tu adquisición y espero que lo disfrutes y que, a la vez, satisfaga tu curiosidad de ver cómo se factoriza en los Números Reales, la Suma de Dos Cuadrados. Los matemáticos de toda época, han dicho que este polinomio es irreducible, es decir, que no tiene factorización en el conjunto de los Números Reales, ahora tú tienes a tu disposición algo inédito.
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                                Al haber procesado su pago, el libro <strong style="color: #1a2744;">ya se ha desbloqueado de forma automática</strong> en el dispositivo desde el cual realizó la compra.
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                                Sin embargo, si en algún momento desea visualizar la obra desde un segundo dispositivo (como su computadora personal o una tablet), le proporciono a continuación su código de activación único:
                            </p>
                            
                            <div style="text-align: center; margin: 28px 0;">
                                <span style="display: inline-block; background-color: #ffffff; color: #d38d45; padding: 14px 28px; font-size: 22px; font-weight: 700; font-family: 'Josefin Sans', sans-serif; border-radius: 4px; border: 1px solid #d38d45; letter-spacing: 3px; box-shadow: 0 4px 12px rgba(211,141,69,0.12);">
                                    {code_str}
                                </span>
                            </div>
                            
                            <div style="background-color: #f4ede3; padding: 16px 20px; border-left: 4px solid #d38d45; border-radius: 0 4px 4px 0; margin: 26px 0;">
                                <p style="font-family: 'Josefin Sans', sans-serif; font-size: 13px; color: #555; margin: 0; line-height: 1.6;">
                                    <em><strong>Nota de Seguridad:</strong> Le recordamos que, para proteger los derechos de autor, este código es de uso único. Una vez que lo ingrese en un nuevo dispositivo, quedará vinculado y el código caducará para evitar su distribución no autorizada.</em>
                                </p>
                            </div>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; line-height: 1.8; color: #3a3a3a; margin: 0 0 16px 0;">
                                Quedo a su entera disposición para cualquier consulta académica o comentario a través de la sección de contacto en nuestra página web.
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; line-height: 1.8; color: #3a3a3a; margin: 0 0 24px 0;">
                                Nuevamente, muchas gracias por su confianza y apoyo a la educación matemática.
                            </p>
                        </div>

                        
                        <!-- Symmetrical Luxury Divider -->
                        <div style="padding: 0 34px;">
                            <div style="border-top: 1px solid #d38d45;"></div>
                        </div>
                        
                        <!-- Footer con Firma -->
                        <div style="background: #faf7f2; padding: 26px 34px 34px 34px; text-align: center;">
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-style: italic; color: #666; margin: 0 0 10px 0;">
                                Atentamente,
                            </p>
                            
                            <!-- Firma manuscrita Real -->
                            <div style="margin: 6px auto 12px auto; text-align: center;">
                                <img src="{sig_image_url}" alt="Firma Bienvenido Hernaldo Acevedo" width="220" style="max-height: 95px; width: 220px; max-width: 100%; height: auto; display: inline-block; border: 0;" />
                            </div>


                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1a2744; font-family: 'Cinzel Decorative', Georgia, serif; letter-spacing: 0.5px;">
                                Bienvenido Hernaldo Acevedo González
                            </p>
                            <p style="margin: 0 0 22px 0; font-size: 12px; font-weight: 700; color: #d38d45; font-family: 'Josefin Sans', sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                                El Autor
                            </p>
                            
                            <p style="font-size: 11px; color: #9e9a93; font-family: 'Josefin Sans', sans-serif; margin: 0; padding-top: 16px; border-top: 1px solid #ebe4d8;">
                                Este es un mensaje automático, por favor no respondas a este correo.
                            </p>
                        </div>
                    </div>
                </div>
                """
            })
                logger.info(f"Purchase confirmation email sent successfully to {payer_email}")
            except Exception as e:
                logger.error(f"Error sending purchase confirmation email to {payer_email}: {e}")
            
    return Response({'success': True, 'message': 'Compra guardada y correo enviado (si aplica).'})


@api_view(['POST'])
def admin_generate_code(request):
    """
    Endpoint administrativo para generar códigos de activación únicos (Kash / Transferencia / Manual)
    y persistirlos atómicamente en la base de datos de Django para que el cliente pueda canjearlos.
    """
    if not request.user.is_authenticated or not request.user.is_staff:
        return Response({'success': False, 'message': 'No autorizado. Se requiere sesión de administrador.'}, status=403)

    data = request.data
    name = (data.get('name') or 'Cliente').strip()[:150]
    phone = (data.get('phone') or '').strip()[:50]
    lang = (data.get('lang') or 'ES').upper().strip()
    if lang not in ('ES', 'EN', 'ALL'):
        lang = 'ES'

    with transaction.atomic():
        # Generar código único con formato MAT-{LANG}-{CHUNK1}-{CHUNK2}
        while True:
            chunk1 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            chunk2 = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
            code_str = f"MAT-{lang}-{chunk1}-{chunk2}"
            if not ActivationCode.objects.filter(code=code_str).exists():
                break

        # Crear la venta digital asociada (método Kash / Manual)
        tx_id = f"KASH-{uuid.uuid4().hex[:10].upper()}"
        placeholder_email = f"{phone.replace(' ', '').replace('+', '')}@kash.com" if phone else f"cliente_{uuid.uuid4().hex[:6]}@aporte.com"

        purchase = DigitalPurchase.objects.create(
            transaction_id=tx_id,
            buyer_email=placeholder_email,
            amount=10.00,
            currency='USD',
            payment_method='kash',
            status='completed'
        )

        activation = ActivationCode.objects.create(
            purchase=purchase,
            code=code_str
        )

        logger.info(f"Staff member {request.user.username} generated activation code {code_str} for {name} ({phone})")

        return Response({
            'success': True,
            'code': code_str,
            'transaction_id': tx_id,
            'message': 'Código generado y registrado con éxito en la base de datos.'
        })



def submit_physical_order(request):
    if request.method == 'POST':
        raw_name = request.POST.get('name', '').strip()
        raw_phone = request.POST.get('phone', '').strip()
        raw_department = request.POST.get('department', '').strip()
        raw_quantity = request.POST.get('quantity', 1)
        raw_notes = request.POST.get('notes', '').strip()
        
        # Validar campos requeridos
        if raw_name and raw_phone and raw_department:
            # Sanitizar y delimitar longitud
            name = escape(raw_name)[:150]
            phone = escape(raw_phone)[:40]
            department = escape(raw_department)[:100]
            notes = escape(raw_notes)[:1000]
            
            try:
                quantity = int(raw_quantity)
                if quantity < 1 or quantity > 100:
                    quantity = 1
            except (ValueError, TypeError):
                quantity = 1
            
            try:
                order = PhysicalOrder.objects.create(
                    name=name, phone=phone, department=department, 
                    quantity=quantity, notes=notes
                )
                logger.info(f"New physical order created: {order.id} for {name}")
                messages.success(request, '¡Tu pedido ha sido recibido con éxito! Nos pondremos en contacto pronto.')
            except Exception as e:
                logger.error(f"Error creating physical order: {e}")
                messages.error(request, 'Hubo un problema al procesar tu pedido. Por favor intenta nuevamente.')
            return redirect('pedido')
        else:
            messages.error(request, 'Por favor completa todos los campos requeridos.')
    return redirect('pedido')


def submit_contact(request):
    if request.method == 'POST':
        raw_name = request.POST.get('name', '').strip()
        raw_email = request.POST.get('email', '').strip()
        raw_subject = request.POST.get('subject', '').strip()
        raw_message = request.POST.get('message', '').strip()
        
        if raw_name and raw_email and raw_message:
            # Validar formato de correo electrónico
            try:
                validate_email(raw_email)
            except ValidationError:
                messages.error(request, 'Por favor ingresa un correo electrónico válido.')
                return redirect('contacto')
            
            # Sanitizar y limpiar etiquetas HTML para almacenamiento
            name = strip_tags(raw_name)[:150]
            email = strip_tags(raw_email)[:254]
            subject = strip_tags(raw_subject)[:200] if raw_subject else 'Sin Asunto'
            message = strip_tags(raw_message)[:5000]
            
            try:
                ContactMessage.objects.create(
                    name=name, email=email, subject=subject, message=message
                )
                logger.info(f"New contact message from {name} ({email})")

            except Exception as e:
                logger.error(f"Error saving contact message: {e}")
            
            # Enviar correo de notificación al profesor
            resend.api_key = getattr(settings, 'RESEND_API_KEY', '')
            from_email = getattr(settings, 'RESEND_FROM_EMAIL', 'onboarding@resend.dev')
            admin_email = getattr(settings, 'ADMIN_EMAIL', 'bienvenidohernaldoa@gmail.com')
            try:
                resend.Emails.send({
                    "from": f"Notificaciones Aporte Matemático <{from_email}>",
                    "to": admin_email,
                    "reply_to": email,
                    "subject": f"Nuevo mensaje web: {subject}",
                    "html": f"""
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Josefin+Sans:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
                    
                    <div style="margin: 0; padding: 40px 15px; background-color: #ede7df; font-family: 'Playfair Display', Georgia, serif;">
                        <div style="max-width: 580px; margin: 0 auto; background-color: #faf7f2; border: 1px solid #dcd4c8; border-radius: 6px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
                            
                            <div style="background: #1a2744; padding: 30px 28px 24px 28px; text-align: center; border-bottom: 3px solid #d38d45;">
                                <p style="font-family: 'Josefin Sans', sans-serif; font-size: 11px; font-weight: 700; color: #faab9f; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 8px 0;">
                                    Aporte Matemático
                                </p>
                                <h1 style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 22px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 1px;">
                                    Notificación de Contacto
                                </h1>
                            </div>
                            
                            <div style="padding: 32px 30px 24px 30px; color: #2c2c2c;">
                                <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; margin: 0 0 14px 0;">
                                    Hola, <strong>Prof. Bienvenido</strong>,
                                </p>
                                
                                <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; line-height: 1.7; color: #3a3a3a; margin: 0 0 20px 0;">
                                    Ha recibido un nuevo mensaje a través de la página web de su obra <em>"Un Aporte Matemático en el Siglo 21 - Factorización de a^2+b^2, en los Números Reales"</em>:
                                </p>
                                
                                <div style="background-color: #ffffff; padding: 22px; border-radius: 4px; border: 1px solid #e8decb; border-left: 4px solid #d38d45; margin: 20px 0;">
                                    <p style="font-family: 'Josefin Sans', sans-serif; font-size: 14px; margin: 0 0 10px 0; border-bottom: 1px solid #f0e9df; padding-bottom: 10px;">
                                        <strong style="color: #888;">Nombre:</strong> <span style="font-weight: 700; color: #1a2744;">{name}</span>
                                    </p>
                                    <p style="font-family: 'Josefin Sans', sans-serif; font-size: 14px; margin: 0 0 10px 0; border-bottom: 1px solid #f0e9df; padding-bottom: 10px;">
                                        <strong style="color: #888;">Correo:</strong> <span style="font-weight: 600; color: #d38d45;">{email}</span>
                                    </p>
                                    <p style="font-family: 'Josefin Sans', sans-serif; font-size: 14px; margin: 0 0 14px 0;">
                                        <strong style="color: #888;">Asunto:</strong> <span style="font-weight: 600; color: #333;">{subject}</span>
                                    </p>
                                    
                                    <h3 style="font-size: 13px; color: #888; margin: 16px 0 8px 0; font-family: 'Josefin Sans', sans-serif; text-transform: uppercase; letter-spacing: 1px;">Mensaje:</h3>
                                    <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; line-height: 1.7; color: #3a3a3a; background-color: #faf7f2; padding: 14px 16px; border-radius: 4px; font-style: italic; margin: 0;">
                                        "{message}"
                                    </p>
                                </div>
                            </div>
                            
                            <div style="background: #faf7f2; padding: 18px 30px; text-align: center; border-top: 1px solid #ebe4d8;">
                                <p style="font-family: 'Josefin Sans', sans-serif; font-size: 12px; color: #888; margin: 0; line-height: 1.5;">
                                    Este es un correo automático generado por el sistema de su página web.<br>
                                    <strong style="color: #1a2744;">Puede responder directamente a este mensaje para contactar al remitente.</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                    """
                })
                logger.info(f"Contact notification email sent for message from {email}")
            except Exception as e:
                logger.error(f"Error sending contact notification email: {e}")
                
            messages.success(request, '¡Gracias por contactarnos! Tu mensaje ha sido enviado.')
            return redirect('contacto')
        else:
            messages.error(request, 'Por favor completa todos los campos requeridos.')
    return redirect('contacto')
