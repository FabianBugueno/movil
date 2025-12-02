# FitPlan Recovery Demo Server

Este servidor de ejemplo permite enviar correos de recuperación de contraseña automáticamente usando **nodemailer** (compatible con cualquier servicio SMTP, incluyendo Gmail, mailjs, etc.).

IMPORTANTE: Este código es un demo. Para producción debes:
- Usar almacenamiento persistente para tokens.
- Añadir límites de tasa (rate limiting).
- Asegurar el endpoint con validaciones, autenticación y logging.
- No exponer credenciales en .env en repositorios públicos.

## Variables de entorno

- `EMAIL_USER` (requerido): Tu dirección de correo (ej: tuusuario@gmail.com o tuusuario@mailjs.com).
- `EMAIL_PASS` (requerido): Tu contraseña o token de aplicación.
- `EMAIL_SERVICE` (opcional): Servicio SMTP a usar. Por defecto: `gmail`. Otros: `mailjs`, `outlook`, etc. Si usas SMTP personalizado, configura `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`.
- `PORT` (opcional), por defecto `3000`.
- `FRONTEND_BASE` (opcional), URL base del frontend para generar enlaces de recuperación (por defecto `http://localhost:8100`).

## Instalación y ejecución

```bash
cd server
npm install
```

### Opción 1: Usar Gmail (más simple)

```bash
# En PowerShell (Windows)
$env:EMAIL_USER="tuusuario@gmail.com"
$env:EMAIL_PASS="tucontraseña_o_app_password"
$env:EMAIL_SERVICE="gmail"
npm start
```

**Nota para Gmail**: Si tienes 2FA activado, genera una [contraseña de aplicación](https://support.google.com/accounts/answer/185833) en lugar de usar tu contraseña normal.

### Opción 2: Usar mailjs

```bash
$env:EMAIL_USER="tuusuario@mailjs.com"
$env:EMAIL_PASS="tucontraseña"
$env:EMAIL_SERVICE="mailjs"
npm start
```

### Opción 3: Usar SMTP personalizado

```bash
$env:EMAIL_USER="usuario@tudominio.com"
$env:EMAIL_PASS="contraseña"
$env:EMAIL_HOST="smtp.tuproveedor.com"
$env:EMAIL_PORT="587"
$env:EMAIL_SECURE="false"  # true si puerto 465, false si 587
npm start
```

## Endpoints

- **POST /api/recovery**
  - Body: `{ "username": "usuario1", "email": "usuario@ejemplo.com" }`
  - Busca el correo en BD local (desde el cliente) y envía un correo de recuperación automáticamente.
  
- **GET /api/recovery/validate/:token**
  - Valida si un token de recuperación es válido (en demo, sin expiración persistente).

## Flujo completo

1. Usuario hace clic en "¿Olvidaste tu contraseña?" en la app.
2. Ingresa su usuario.
3. El cliente busca el correo asociado (desde BD local) y llama a `POST /api/recovery`.
4. El servidor envía un correo automáticamente con un enlace de recuperación.
5. El usuario abre el enlace en el correo y puede restablecer su contraseña (pantalla por implementar en frontend).

## Modo demo (sin credenciales)

Si no configuras `EMAIL_USER` y `EMAIL_PASS`, el servidor responde con `{ demo: true }` y registra en consola la solicitud (útil para pruebas sin enviar correos reales).

