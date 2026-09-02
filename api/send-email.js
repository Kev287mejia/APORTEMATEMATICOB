const SIGNATURE_IMAGE = 'https://raw.githubusercontent.com/Kev287mejia/APORTEMATEMATICOB/main/static/firma_acevedo.png';

export default async function handler(req, res) {
  // CORS Headers for safety
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const ADMIN_EMAIL = process.env.RESEND_ADMIN_EMAIL || 'tu_correo@gmail.com'; // El administrador debe configurarlo en Vercel

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Missing RESEND_API_KEY in environment variables' });
  }

  try {
    const { type, data } = req.body;
    let emailPayloads = [];

    if (type === 'purchase') {
      // 1. Email al cliente (Agradecimiento)
      if (data.customerEmail) {
        emailPayloads.push({
          from: `Aporte Matemático <${FROM_EMAIL}>`,
          to: [data.customerEmail],
          subject: '¡Gracias por su compra! Su libro digital está desbloqueado',
          html: `
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
                    Al haber procesado su pago de <strong style="color: #1a2744;">$${data.price} USD</strong> a través de PayPal, el libro <strong style="color: #1a2744;">ya se ha desbloqueado de forma automática</strong> en el dispositivo desde el cual realizó la compra.
                  </p>

                  <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; color: #3a3a3a; line-height: 1.8; margin: 0 0 18px 0;">
                    Sin embargo, si en algún momento desea visualizar la obra desde un segundo dispositivo (como su computadora personal o una tablet), le proporciono a continuación su código de activación único:
                  </p>

                  <!-- Activation Code Box -->
                  <div style="text-align: center; margin: 28px 0;">
                    <span style="display: inline-block; background-color: #ffffff; color: #d38d45; padding: 14px 28px; font-size: 22px; font-weight: 700; font-family: 'Josefin Sans', sans-serif; border-radius: 4px; border: 1px solid #d38d45; letter-spacing: 3px; box-shadow: 0 4px 12px rgba(211,141,69,0.12);">
                      ${data.activationCode || 'MAT-ES-XXXX-YYYY'}
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

                  <!-- Firma Manuscrita Real -->
                  <div style="margin: 6px auto 12px auto; text-align: center;">
                    <img src="${SIGNATURE_IMAGE}" alt="Firma Bienvenido Hernaldo Acevedo" width="220" style="max-height: 95px; width: 220px; max-width: 100%; height: auto; display: inline-block; border: 0;" />
                  </div>

                  <!-- Nombre completo -->
                  <p style="margin: 0 0 4px 0; font-size: 15px; font-weight: 700; color: #1a2744; font-family: 'Cinzel Decorative', Georgia, serif; letter-spacing: 0.5px;">
                    Bienvenido Hernaldo Acevedo González
                  </p>

                  <!-- Rol -->
                  <p style="margin: 0 0 22px 0; font-size: 12px; font-weight: 700; color: #d38d45; font-family: 'Josefin Sans', sans-serif; letter-spacing: 2px; text-transform: uppercase;">
                    El Autor
                  </p>

                  <!-- Aviso -->
                  <p style="font-size: 11px; color: #9e9a93; font-family: 'Josefin Sans', sans-serif; margin: 0; padding-top: 16px; border-top: 1px solid #ebe4d8;">
                    Este es un mensaje automático, por favor no respondas a este correo.
                  </p>

                </div>

              </div>
            </div>
          `
        });

      }

      // 2. Email al administrador (Alerta de Venta)
      emailPayloads.push({
        from: `Notificaciones <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `Nueva Venta PayPal: $${data.price} USD`,
        html: `
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Josefin+Sans:wght@300;400;600;700&family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet">
          
          <div style="margin: 0; padding: 40px 15px; background-color: #ede7df; font-family: 'Playfair Display', Georgia, serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #faf7f2; border: 1px solid #dcd4c8; border-radius: 6px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.06);">
              <div style="background: #1a2744; padding: 26px 28px; text-align: center; border-bottom: 3px solid #d38d45;">
                <p style="font-family: 'Josefin Sans', sans-serif; font-size: 11px; font-weight: 700; color: #faab9f; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 6px 0;">
                  Aporte Matemático
                </p>
                <h2 style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 1px;">
                  ¡Nueva Venta Procesada!
                </h2>
              </div>
              
              <div style="padding: 28px 30px; font-family: 'Josefin Sans', sans-serif; color: #333;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #ebe4d8;">
                    <td style="padding: 10px 0; color: #888; font-weight: 600;">Cliente:</td>
                    <td style="padding: 10px 0; font-weight: 700; color: #1a2744; text-align: right;">${data.customerName}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #ebe4d8;">
                    <td style="padding: 10px 0; color: #888; font-weight: 600;">Correo:</td>
                    <td style="padding: 10px 0; font-weight: 600; color: #d38d45; text-align: right;">${data.customerEmail}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #ebe4d8;">
                    <td style="padding: 10px 0; color: #888; font-weight: 600;">Producto:</td>
                    <td style="padding: 10px 0; font-weight: 600; color: #333; text-align: right;">Edición Digital (${data.language})</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #ebe4d8;">
                    <td style="padding: 10px 0; color: #888; font-weight: 600;">Monto:</td>
                    <td style="padding: 10px 0; font-weight: 700; color: #2e7d32; font-size: 16px; text-align: right;">$${data.price} USD</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #ebe4d8;">
                    <td style="padding: 10px 0; color: #888; font-weight: 600;">ID Transacción:</td>
                    <td style="padding: 10px 0; font-family: monospace; font-size: 13px; color: #1a2744; text-align: right;">${data.transactionId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #888; font-weight: 600;">Fecha:</td>
                    <td style="padding: 10px 0; color: #666; text-align: right;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        `
      });

    } else if (type === 'contact') {
      // Email de formulario de contacto
      emailPayloads.push({
        from: `Formulario Contacto <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `Nuevo mensaje de: ${data.name}`,
        html: `
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Josefin+Sans:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
          
          <div style="margin: 0; padding: 40px 15px; background-color: #ede7df; font-family: 'Playfair Display', Georgia, serif;">
            <div style="max-width: 560px; margin: 0 auto; background-color: #faf7f2; border: 1px solid #dcd4c8; border-radius: 6px; overflow: hidden; box-shadow: 0 8px 25px rgba(0,0,0,0.06);">
              <div style="background: #1a2744; padding: 26px 28px; text-align: center; border-bottom: 3px solid #d38d45;">
                <p style="font-family: 'Josefin Sans', sans-serif; font-size: 11px; font-weight: 700; color: #faab9f; letter-spacing: 3px; text-transform: uppercase; margin: 0 0 6px 0;">
                  Aporte Matemático
                </p>
                <h2 style="font-family: 'Cinzel Decorative', Georgia, serif; font-size: 20px; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 1px;">
                  Nuevo Mensaje Web
                </h2>
              </div>
              
              <div style="padding: 28px 30px; color: #333;">
                <p style="font-family: 'Josefin Sans', sans-serif; font-size: 14px; margin: 0 0 8px 0;">
                  <strong style="color: #888;">De:</strong> <span style="font-weight: 700; color: #1a2744;">${data.name}</span> (<a href="mailto:${data.email}" style="color: #d38d45;">${data.email}</a>)
                </p>
                
                <div style="margin-top: 18px; padding: 18px 20px; background-color: #ffffff; border: 1px solid #e8decb; border-left: 4px solid #d38d45; border-radius: 0 4px 4px 0;">
                  <p style="font-family: 'Playfair Display', Georgia, serif; font-size: 15px; line-height: 1.7; color: #3a3a3a; margin: 0; font-style: italic;">
                    "${data.message.replace(/\n/g, '<br>')}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      });
    } else {
      return res.status(400).json({ error: 'Invalid email type' });
    }

    // Send all emails to Resend API
    const responses = await Promise.all(emailPayloads.map(async (payload) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return response.json();
    }));

    return res.status(200).json({ success: true, responses });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
