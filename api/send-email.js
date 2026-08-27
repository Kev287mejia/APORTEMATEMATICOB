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
          subject: '¡Gracias por tu compra! Tu libro digital está desbloqueado 📚',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2 style="color: #2c3e50;">¡Hola ${data.customerName}!</h2>
              <p>Tu pago de <strong>$${data.price} USD</strong> ha sido procesado con éxito a través de PayPal.</p>
              <p>El acceso a tu edición digital (<em>${data.language}</em>) ha sido desbloqueado en tu dispositivo automáticamente.</p>
              <p>Si tienes problemas para visualizarlo, o si borras la memoria de tu navegador, por favor contáctanos con tu código de transacción: <strong>${data.transactionId}</strong>.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 0.9em; color: #888;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </div>
          `
        });
      }

      // 2. Email al administrador (Alerta de Venta)
      emailPayloads.push({
        from: `Notificaciones <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `💰 Nueva Venta PayPal: $${data.price} USD`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>¡Nueva venta procesada!</h2>
            <ul>
              <li><strong>Cliente:</strong> ${data.customerName}</li>
              <li><strong>Correo:</strong> ${data.customerEmail}</li>
              <li><strong>Producto:</strong> ${data.language}</li>
              <li><strong>Monto:</strong> $${data.price} USD</li>
              <li><strong>ID Transacción:</strong> ${data.transactionId}</li>
              <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
            </ul>
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
          <div style="font-family: sans-serif; color: #333;">
            <h2>Nuevo Mensaje de Contacto</h2>
            <p><strong>De:</strong> ${data.name} (${data.email})</p>
            <p><strong>Mensaje:</strong></p>
            <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ccc;">
              ${data.message.replace(/\n/g, '<br>')}
            </blockquote>
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
