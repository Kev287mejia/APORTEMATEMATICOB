# 🗺️ GUÍA PASO A PASO: DESPLIEGUE A PRODUCCIÓN Y PUESTA EN MARCHA 100% OPERATIVA

**Proyecto:** *Aporte Matemático en el Siglo 21*  
**Autor:** *Bienvenido Hernaldo Acevedo González*  
**Desarrollado por:** *EternalLabs*  
**Repositorio GitHub:** `https://github.com/Kev287mejia/APORTEMATEMATICOB`

---

## 📌 RESUMEN DEL FLUJO DE LANZAMIENTO

```
[1. Credenciales PayPal Live] ➔ [2. Compra de Dominio Web] ➔ [3. Dominio en Resend]
       ⬇
[4. BD PostgreSQL en Render] ➔ [5. Servicio Web en Render] ➔ [6. Variables de Entorno]
       ⬇
[7. Vinculación DNS y SSL] ➔ [8. Superusuario Admin] ➔ [9. Prueba de Fuego Final]
```

---

## PASO 1: Obtener las Credenciales Reales de PayPal (Modo Live)

Para que el dinero de las ventas entre a la cuenta bancaria del autor:

1. Ingresa a [developer.paypal.com](https://developer.paypal.com/) con la cuenta de PayPal donde se recibirán los fondos.
2. En el menú, dirígete a **Apps & Credentials**.
3. En la parte superior, cambia de la pestaña **Sandbox** a **Live** (Producción / Pagos Reales).
4. Haz clic en el botón azul **Create App**:
   * **App Name:** `Aporte Matematico Produccion`
   * **App Type:** `Merchant`
5. Al crear la app, copia y guarda en un lugar seguro:
   * **Client ID** (identificador público)
   * **Secret** (haz clic en *Show* y copia la clave secreta)

---

## PASO 2: Comprar el Dominio Web Oficial

1. Entra a un registrador de confianza:
   * [Namecheap](https://www.namecheap.com/) (Recomendado)
   * [Porkbun](https://porkbun.com/)
   * [Cloudflare Registrar](https://www.cloudflare.com/)
   * [GoDaddy](https://www.godaddy.com/)
2. Busca el dominio (ejemplo: `aportematematico.com` o `elaportematematico.com`).
3. Realiza la compra (costo aproximado: $8 a $12 USD al año).
4. Deja abierta la pestaña de **Gestión de DNS** (Advanced DNS).

---

## PASO 3: Configurar el Dominio en Resend (Correos Transaccionales)

Para que los correos con la firma del profesor y los códigos de activación no caigan en la carpeta de SPAM:

1. Inicia sesión en [resend.com](https://resend.com/).
2. En el menú lateral, entra a **Domains** y haz clic en **Add Domain**.
3. Escribe tu dominio registrado (ejemplo: `aportematematico.com`).
4. Resend generará 3 o 4 registros DNS (tipo `TXT` y `MX`, como `resend._domainkey`).
5. Ve al panel de tu registrador de dominio (Paso 2), sección **DNS Records**, y copia exactamente cada valor (Type, Host, Value).
6. Regresa a Resend y haz clic en **Verify DNS**. Una vez confirmado, el estado cambiará a **Verified** (verde).
7. En la pestaña **API Keys**, asegúrate de tener a mano tu clave de producción (empieza con `re_...`).

---

## PASO 4: Crear la Base de Datos PostgreSQL en la Nube (Render.com)

1. Ingresa a [render.com](https://render.com/) e inicia sesión con tu cuenta de GitHub (`Kev287mejia`).
2. En el Dashboard, haz clic en **New +** (esquina superior derecha) y selecciona **PostgreSQL**.
3. Configura la base de datos:
   * **Name:** `db-aporte-matematico`
   * **Database:** `aportematematicodb`
   * **User:** `aporte_admin`
   * **Region:** `Ohio (US East)` u `Oregon (US West)`
   * **Instance Type:** `Free` (o `Starter` según el tráfico esperado)
4. Haz clic en **Create Database**.
5. Espera 1 minuto a que se aprovisione. En la página de detalles, desplázate a la sección **Connections** y copia el valor de:
   * **Internal Database URL** (formato: `postgres://aporte_admin:PASSWORD@dpg-xxxx:5432/aportematematicodb`).

---

## PASO 5: Crear el Servicio Web en Render.com

1. En el Dashboard de Render, haz clic en **New +** y selecciona **Web Service**.
2. Elige la opción **Build and deploy from a Git repository** y selecciona tu repositorio: `APORTEMATEMATICOB`.
3. Completa la configuración básica:
   * **Name:** `aporte-matematico-web`
   * **Region:** La misma que elegiste para la base de datos (ej. `Ohio`).
   * **Branch:** `main`
   * **Runtime:** `Python 3`
   * **Build Command:** `./build.sh`
   * **Start Command:** `gunicorn backend.wsgi:application`
   * **Instance Type:** `Free` o `Starter`

---

## PASO 6: Configurar las Variables de Entorno en Render

En la misma pantalla de configuración del Web Service (o en la pestaña **Environment**), agrega las siguientes variables de entorno:

| Nombre de la Variable (Key) | Valor Recomendado (Value) | Propósito |
| :--- | :--- | :--- |
| `DEBUG` | `False` | **Crítico:** Apaga el modo depuración |
| `SECRET_KEY` | `8e56bda=77knza==t_rr7$$=5r553zpdds((@t8p3x0sr1mq=t` | Clave secreta criptográfica de Django |
| `ALLOWED_HOSTS` | `*` *(o tu dominio: `aportematematico.com,*.onrender.com`)* | Permite peticiones autorizadas |
| `DATABASE_URL` | *(Pega aquí la Internal Database URL del Paso 4)* | Conexión directa a PostgreSQL |
| `PAYPAL_MODE` | `live` | Activa la pasarela real de PayPal |
| `PAYPAL_CLIENT_ID` | *(Pega el Client ID obtenido en el Paso 1)* | Identificador de comercio PayPal |
| `PAYPAL_CLIENT_SECRET` | *(Pega el Secret obtenido en el Paso 1)* | Validación server-side de compras |
| `RESEND_API_KEY` | *(Tu API Key de Resend: `re_...`)* | Envío de correos automáticos |
| `RESEND_FROM_EMAIL` | `pedidos@tudominio.com` *(ej: pedidos@aportematematico.com)* | Remitente oficial verificado |
| `ADMIN_EMAIL` | `bienvenidohernaldoa@gmail.com` | Notificaciones al autor |
| `SECURE_SSL_REDIRECT` | `True` | Fuerza navegación bajo HTTPS |
| `SESSION_COOKIE_SECURE` | `True` | Protege cookies de sesión |
| `CSRF_COOKIE_SECURE` | `True` | Protege tokens contra manipulaciones |

4. Haz clic en **Create Web Service**.
5. Render iniciará automáticamente la compilación:
   * Instalará dependencias (`gunicorn`, `Django`, `openpyxl`, etc.).
   * Ejecutará las migraciones en PostgreSQL.
   * Compilará los archivos estáticos con WhiteNoise (`collectstatic`).
   * Al finalizar dirá: `==> Your service is live 🎉`.

---

## PASO 7: Conectar tu Dominio Propio y Certificado SSL (HTTPS)

1. En tu servicio web de Render, ve a la pestaña **Settings** > sección **Custom Domains**.
2. Haz clic en **Add Custom Domain** y escribe:
   * `aportematematico.com`
   * `www.aportematematico.com`
3. Render te mostrará los registros DNS requeridos:
   * Un registro **A** apuntando a la IP de Render (ej. `216.24.57.1`).
   * Un registro **CNAME** para `www` apuntando a tu URL de Render (`aporte-matematico-web.onrender.com`).
4. Ve al panel de tu registrador de dominio (Paso 2) e inserta esos dos registros.
5. Render generará e instalará automáticamente tu certificado **SSL/HTTPS gratuito** en cuestión de minutos.

---

## PASO 8: Crear el Usuario Administrador en Producción

1. En el panel de Render, entra a tu Web Service y haz clic en la pestaña **Shell** (terminal en vivo).
2. Ejecuta el comando:
   ```bash
   python manage.py createsuperuser
   ```
3. Llena los datos solicitados:
   * **Username:** (ej: `admin` o `profesor`)
   * **Email address:** `bienvenidohernaldoa@gmail.com`
   * **Password:** *(Tu contraseña segura para la administración)*
4. Confirma la contraseña.
5. Ahora puedes ingresar al panel administrativo directamente en:
   `https://tudominio.com/admin/`

---

## PASO 9: 🚀 PRUEBA DE FUEGO FINAL (Verificación de Calidad)

Realiza este recorrido completo con tu dominio oficial activo:

1. **Lectura Digital Gratuita:** Abre la web y prueba leer las primeras páginas (debe permitir hasta la pág. 15 y luego mostrar el modal de compra).
2. **Acceso al Panel:** Entra a `https://tudominio.com/admin/login/`, inicia sesión con el superusuario y descarga el **Reporte Maestro en Excel** para comprobar que el archivo `.xlsx` se descarga correctamente.
3. **Generación de Claves (Kash):** En `/activador/`, genera una clave para un cliente ficticio y canjéala en el modal de activación de la web para certificar que desbloquea las 168 páginas.
4. **Formulario Físico:** Envía una orden de libro físico y verifica que se registre en la tabla `PhysicalOrder` del admin.
5. **Formulario de Contacto:** Envía un mensaje desde `/contacto/` y confirma que llegue a `bienvenidohernaldoa@gmail.com`.
6. **Compra Real PayPal:** Realiza una compra de $10 USD con una tarjeta externa y verifica:
   * Desbloqueo inmediato en la pantalla.
   * Redirección o confirmación por WhatsApp.
   * Llegada del correo de agradecimiento con la firma manuscrita del autor y el código de respaldo.

---

## 🛠️ ARCHIVOS Y CONFIGURACIÓN YA PREPARADOS EN ESTE REPOSITORIO:
* `requirements.txt`: Incluye `gunicorn==23.0.0` para producción.
* `Procfile`: Configurado para levantar la app WSGI automáticamente.
* `build.sh`: Script ejecutable para migraciones y `collectstatic`.
* `backend/settings.py`: Hardening de seguridad, base de datos híbrida (SQLite local / PostgreSQL nube) y compresión de estáticos WhiteNoise.

*¡El proyecto está completamente listo para su lanzamiento!*
