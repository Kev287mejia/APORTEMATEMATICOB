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
        
        # Cargar firma manuscrita en base64
        import base64
        sig_file_path = os.path.join(settings.BASE_DIR, 'static', 'firma_acevedo.png')
        sig_b64_src = ""
        try:
            with open(sig_file_path, 'rb') as sf:
                sig_b64_src = f"data:image/png;base64,{base64.b64encode(sf.read()).decode('utf-8')}"
        except Exception:
            pass

        # Enviar correo al comprador
        resend.api_key = getattr(settings, 'RESEND_API_KEY', '')
        try:
            resend.Emails.send({
                "from": "onboarding@resend.dev",
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
                            <h1 style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 22px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 1.5px; line-height: 1.3;">
                                ¡Gracias por tu compra!
                            </h1>
                            <p style="font-family: 'Josefin Sans', sans-serif; font-size: 12px; color: #e0d8cf; margin: 8px 0 0 0; letter-spacing: 1px;">
                                Edición Digital Desbloqueada
                            </p>
                        </div>
                        
                        <!-- Body -->
                        <div style="padding: 36px 34px 28px 34px; background-color: #faf7f2; color: #2c2c2c;">
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 16px; color: #2c2c2c; margin: 0 0 16px 0;">
                                <strong>Estimado/a Lector/a:</strong>
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 16px 0;">
                                Es un verdadero honor para mí agradecerle personalmente por la adquisición de mi libro digital:
                            </p>
                            
                            <!-- Book Title Box -->
                            <div style="background-color: #ffffff; border: 1px solid #e8decb; border-left: 4px solid #d38d45; padding: 18px 22px; margin: 22px 0; border-radius: 0 4px 4px 0; text-align: center;">
                                <span style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 15px; font-weight: 700; color: #1a2744; letter-spacing: 0.5px; line-height: 1.6; display: block;">
                                    "Un Aporte Matemático en el Siglo 21:<br>
                                    Factorización de a²+b², en los Números Reales"
                                </span>
                            </div>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                                Espero con esta obra satisfacer su curiosidad sobre la factorización de la suma de dos cuadrados (a² + b², el Teorema de Pitágoras), porque éste hasta la fecha ha sido irreductible.
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                                Al haber procesado su pago, el libro <strong style="color: #1a2744;">ya se ha desbloqueado de forma automática</strong> en el dispositivo desde el cual realizó la compra.
                            </p>
                            
                            <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                                Sin embargo, si en algún momento desea visualizar la obra desde un segundo dispositivo (como su computadora personal o una tablet), le proporciono a continuación su código de activación único:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
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
                                <img src="{sig_b64_src}" alt="Firma Prof. Bienvenido H. Acevedo" style="max-height: 85px; width: auto; max-width: 250px; display: inline-block;" />
                            </div>

                            <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1a2744; font-family: 'Cinzel Decorative', Georgia, serif; letter-spacing: 0.5px;">
                                Prof. Bienvenido Hernaldo Acevedo González
                            </p>
                            <p style="margin: 0 0 22px 0; font-size: 11px; font-weight: 700; color: #d38d45; font-family: 'Josefin Sans', sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                                Autor de "Un Aporte Matemático en el Siglo 21"
                            </p>
                            
                            <p style="font-size: 11px; color: #9e9a93; font-family: 'Josefin Sans', sans-serif; margin: 0; padding-top: 16px; border-top: 1px solid #ebe4d8;">
                                Este es un mensaje automático, por favor no respondas a este correo.
                            </p>
                        </div>
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
            except Exception as e:
                print("Error enviando notificación de contacto:", e)
                
            messages.success(request, '¡Gracias por contactarnos! Tu mensaje ha sido enviado.')
            return redirect('contacto')
        else:
            messages.error(request, 'Por favor completa todos los campos requeridos.')
    return redirect('contacto')
