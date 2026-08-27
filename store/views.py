from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import DigitalPurchase, ActivationCode
from django.utils import timezone

def index_view(request):
    return render(request, 'index.html')

def contacto_view(request):
    return render(request, 'contacto.html')

def pedido_view(request):
    return render(request, 'pedido.html')

def activador_view(request):
    return render(request, 'activador.html')

@api_view(['POST'])
def verify_purchase(request):
    code = request.data.get('code', '').strip()
    
    if not code:
        return Response({'success': False, 'message': 'Código vacío'}, status=400)
    
    # 1. Chequear si es un código de activación manual
    try:
        activation = ActivationCode.objects.get(code=code)
        if activation.is_used:
            return Response({'success': False, 'message': 'Este código ya ha sido utilizado.'}, status=400)
        
        # Marcar como usado
        activation.is_used = True
        activation.used_at = timezone.now()
        activation.save()
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
        
        return Response({'success': True, 'message': 'Compra verificada con éxito.'})
    except DigitalPurchase.DoesNotExist:
        return Response({'success': False, 'message': 'Código o transacción inválidos.'}, status=404)

@api_view(['POST'])
def save_paypal_purchase(request):
    data = request.data
    transaction_id = data.get('id')
    payer_email = data.get('payerEmail')
    status = data.get('status', 'completed').lower()
    
    if not transaction_id:
        return Response({'success': False, 'message': 'Falta el ID de transacción'}, status=400)
    
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
        import resend
        import string
        import random
        from django.conf import settings
        
        # Generar código aleatorio de 8 caracteres
        code_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        activation = ActivationCode.objects.create(
            purchase=purchase,
            code=code_str
        )
        
        # Enviar correo al comprador
        resend.api_key = getattr(settings, 'RESEND_API_KEY', '')
        try:
            resend.Emails.send({
                "from": "onboarding@resend.dev",
                "to": payer_email,
                "subject": '¡Gracias por adquirir "Un Aporte Matemático en el Siglo 21 - Factorización de a^2+b^2, en los Números Reales"!',
                "html": f"""
                <div style="font-family: 'Playfair Display', Georgia, serif; background-color: #f5f0eb; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 40px 30px; border: 1px solid #e0d8cf; border-radius: 4px;">
                    
                    <div style="text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #d38d45;">
                        <h1 style="font-family: 'Cinzel Decorative', serif; color: #333; font-size: 28px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Aporte Matematico</h1>
                    </div>
                    
                    <h2 style="font-family: 'Cinzel Decorative', serif; color: #d38d45; text-align: center; font-size: 22px; margin-bottom: 30px;">
                        ¡Gracias por tu compra!
                    </h2>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">Estimado/a Lector/a,</p>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">
                        Es un verdadero honor para mí agradecerle personalmente por la adquisición de mi libro digital: <strong>"Un Aporte Matemático en el Siglo 21 - Factorización de a^2+b^2, en los Números Reales"</strong>.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">
                        Espero con esta obra satisfacer su curiosidad sobre la factorización de la suma de dos cuadrados (a² + b², el Teorema de Pitágoras), porque éste hasta la fecha ha sido irreductible y nadie lo ha podido factorizar. Únicamente en esta obra está factorizado, facilitándole la factorización de la suma de dos cuadrados en los números reales.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">
                        Al haber procesado su pago, el libro <strong>ya se ha desbloqueado de forma automática</strong> en el dispositivo desde el cual realizó la compra.
                    </p>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">
                        Sin embargo, si en algún momento desea visualizar la obra desde un segundo dispositivo (como su computadora personal o una tablet), le proporciono a continuación su código de activación único:
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <span style="background-color: #fafafa; color: #d38d45; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 4px; border: 1px solid #faab9f; letter-spacing: 2px;">
                            {code_str}
                        </span>
                    </div>
                    
                    <div style="background-color: #fafafa; padding: 15px 20px; border-left: 4px solid #faab9f; margin: 30px 0;">
                        <p style="font-size: 13px; color: #555; margin: 0; line-height: 1.5;">
                            <em><strong>Nota de Seguridad:</strong> Le recordamos que, para proteger los derechos de autor, este código es de uso único. Una vez que lo ingrese en un nuevo dispositivo, quedará vinculado y el código caducará para evitar su distribución no autorizada.</em>
                        </p>
                    </div>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">Quedo a su entera disposición para cualquier consulta académica o comentario a través de la sección de contacto en nuestra página web.</p>
                    
                    <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">Nuevamente, muchas gracias por su confianza y apoyo a la educación matemática.</p>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #e0d8cf; padding-top: 30px;">
                        <p style="font-size: 16px; color: #555; margin-bottom: 5px;">Atentamente,</p>
                        <p style="font-size: 18px; margin: 0;">
                            <strong style="color: #333; font-family: 'Cinzel Decorative', serif; font-size: 18px;">Prof. Bienvenido Hernaldo Acevedo González</strong><br>
                            <span style="color: #d38d45; font-size: 14px; font-style: italic;">Autor de "Un Aporte Matemático en el Siglo 21"</span>
                        </p>
                    </div>
                </div>
                """
            })
        except Exception as e:
            print("Error enviando correo de compra:", e)
            
    return Response({'success': True, 'message': 'Compra guardada y correo enviado (si aplica).'})

from .models import PhysicalOrder, ContactMessage
from django.shortcuts import redirect
from django.contrib import messages

def submit_physical_order(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        phone = request.POST.get('phone')
        department = request.POST.get('department')
        quantity = request.POST.get('quantity', 1)
        notes = request.POST.get('notes', '')
        
        if name and phone and department:
            PhysicalOrder.objects.create(
                name=name, phone=phone, department=department, 
                quantity=quantity, notes=notes
            )
            messages.success(request, '¡Tu pedido ha sido recibido con éxito! Nos pondremos en contacto pronto.')
            return redirect('pedido')
        else:
            messages.error(request, 'Por favor completa todos los campos requeridos.')
    return redirect('pedido')

def submit_contact(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject', '')
        message = request.POST.get('message')
        
        if name and email and message:
            ContactMessage.objects.create(
                name=name, email=email, subject=subject, message=message
            )
            
            # Enviar correo de notificación al profesor
            import resend
            from django.conf import settings
            resend.api_key = getattr(settings, 'RESEND_API_KEY', '')
            try:
                resend.Emails.send({
                    "from": "onboarding@resend.dev",
                    "to": "bienvenidohernaldoa@gmail.com",
                    "reply_to": email,
                    "subject": f"Nuevo mensaje web: {subject}",
                    "html": f"""
                    <div style="font-family: 'Playfair Display', Georgia, serif; background-color: #f5f0eb; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 40px 30px; border: 1px solid #e0d8cf; border-radius: 4px;">
                        
                        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #d38d45;">
                            <h1 style="font-family: 'Cinzel Decorative', serif; color: #333; font-size: 24px; margin: 0; letter-spacing: 1px; text-transform: uppercase;">Notificación de Contacto</h1>
                        </div>
                        
                        <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">Hola, <strong>Prof. Bienvenido</strong>,</p>
                        
                        <p style="font-size: 16px; line-height: 1.7; color: #2c2c2c;">
                            Ha recibido un nuevo mensaje a través de la página web de su libro <em>"Un Aporte Matemático en el Siglo 21"</em>.
                        </p>
                        
                        <div style="background-color: #fafafa; padding: 25px; border-radius: 4px; border: 1px solid #faab9f; margin: 30px 0;">
                            <p style="font-size: 15px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                <strong style="color: #d38d45;">Nombre:</strong> {name}
                            </p>
                            <p style="font-size: 15px; margin: 0 0 10px 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                                <strong style="color: #d38d45;">Correo:</strong> {email}
                            </p>
                            <p style="font-size: 15px; margin: 0 0 15px 0;">
                                <strong style="color: #d38d45;">Asunto:</strong> {subject}
                            </p>
                            
                            <h3 style="font-size: 16px; color: #333; margin: 20px 0 10px 0; font-family: 'Cinzel Decorative', serif;">Mensaje:</h3>
                            <p style="font-size: 15px; line-height: 1.6; color: #444; background-color: #fff; padding: 15px; border-left: 3px solid #faab9f; font-style: italic;">
                                "{message}"
                            </p>
                        </div>
                        
                        <p style="font-size: 15px; line-height: 1.7; color: #555; text-align: center; margin-top: 40px; border-top: 1px solid #e0d8cf; padding-top: 20px;">
                            Este es un correo automático generado por el sistema de su página web.<br>
                            <strong>Puede responder directamente a este mensaje para contactar al remitente.</strong>
                        </p>
                    </div>
                    """
                })
            except Exception as e:
                print("Error enviando notificación de contacto:", e)
                
            messages.success(request, '¡Gracias por contactarnos! Tu mensaje ha sido enviado.')
            return redirect('contacto')
        else:
            messages.error(request, 'Por favor completa todos los campos requeridos.')
    return redirect('contacto')
