# Configuración de EmailJS para Recuperación de Contraseña

## Pasos para configurar EmailJS

### 1. Registrarse en EmailJS
- Ve a [https://www.emailjs.com/](https://www.emailjs.com/)
- Regístrate con tu correo
- Confirma tu cuenta

### 2. Conectar un servicio de correo
En el dashboard de EmailJS:
1. Ve a "Email Services" (lado izquierdo)
2. Haz clic en "Connect New Service"
3. Elige tu proveedor:
   - **Gmail**: Recomendado para pruebas
   - **Outlook**, **Yahoo**, **Custom SMTP**, etc.
4. Sigue las instrucciones para conectar (te pedirá autorizar acceso)
5. Una vez conectado, copia el **Service ID** (ej: `service_abc123xyz`)

### 3. Crear una plantilla de correo
En el dashboard:
1. Ve a "Email Templates"
2. Haz clic en "Create New Template"
3. Rellena los campos:
   - **Name**: `FitPlan Recovery` (o cualquier nombre)
   - **Subject**: `Recuperación de contraseña - FitPlan`
   - **Body**: Copia y pega esto:

```html
<h2>Hola {{to_name}},</h2>
<p>Solicitaste recuperar tu contraseña en FitPlan.</p>
<p>Haz clic en el siguiente enlace para restablecerla (válido por 1 hora):</p>
<p><a href="{{recovery_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Recuperar contraseña</a></p>
<p>O copia y pega este enlace en tu navegador:</p>
<p>{{recovery_url}}</p>
<p>Si no solicitaste esto, ignora este correo.</p>
<p>Saludos,<br/>Equipo FitPlan</p>
```

4. Haz clic en "Save" para guardar
5. Copia el **Template ID** (ej: `template_abc123xyz`)

### 4. Obtener tu Public Key
En el dashboard:
1. Ve a "Account" (esquina superior derecha)
2. En la pestaña "API", verás tu **Public Key** (ej: `abc123xyz_public_key`)

### 5. Configurar las credenciales en la app

En la app, hay dos formas de configurar EmailJS:

#### Opción A: Configurar al iniciar la app (recomendado)
Abre `src/app/app.component.ts` y añade esto en `ngOnInit()`:

```typescript
import { EmailRecoveryService } from './services/email-recovery.service';

constructor(private emailRecovery: EmailRecoveryService) {}

ngOnInit() {
  // Configurar EmailJS con tus credenciales
  this.emailRecovery.setCredentials(
    'YOUR_SERVICE_ID',
    'YOUR_TEMPLATE_ID',
    'YOUR_PUBLIC_KEY'
  );
}
```

Reemplaza:
- `YOUR_SERVICE_ID`: con tu Service ID
- `YOUR_TEMPLATE_ID`: con tu Template ID
- `YOUR_PUBLIC_KEY`: con tu Public Key

#### Opción B: Usar variables de entorno (más seguro para producción)
1. Crea un archivo `.env` en la raíz del proyecto `movil/`:
```
EMAILJS_SERVICE_ID=tu_service_id_aqui
EMAILJS_TEMPLATE_ID=tu_template_id_aqui
EMAILJS_PUBLIC_KEY=tu_public_key_aqui
```

2. En `src/environments/environment.ts`, añade:
```typescript
export const environment = {
  production: false,
  emailjs: {
    serviceId: process.env['EMAILJS_SERVICE_ID'] || '',
    templateId: process.env['EMAILJS_TEMPLATE_ID'] || '',
    publicKey: process.env['EMAILJS_PUBLIC_KEY'] || ''
  }
};
```

3. En `src/app/app.component.ts`:
```typescript
import { environment } from 'src/environments/environment';
import { EmailRecoveryService } from './services/email-recovery.service';

constructor(private emailRecovery: EmailRecoveryService) {}

ngOnInit() {
  const { serviceId, templateId, publicKey } = environment.emailjs;
  if (serviceId && templateId && publicKey) {
    this.emailRecovery.setCredentials(serviceId, templateId, publicKey);
  }
}
```

### 6. Probar desde la app

1. Construye y ejecuta la app:
```bash
npm run build
npx cap run android --no-sync
```

2. En la pantalla de login, haz clic en "¿Olvidaste tu contraseña?"
3. Ingresa un usuario que existe en tu BD
4. El correo se enviará automáticamente a la dirección asociada

### 7. Verificar el envío

- Revisa la bandeja de entrada del correo configurado
- En el dashboard de EmailJS, ve a "Logs" para ver el historial de envíos

## Notas importantes

- **Free tier**: EmailJS permite hasta 200 correos/mes en el plan gratuito
- **Seguridad**: Nunca commits tus credenciales en Git. Usa `.env` y `.gitignore`
- **Límites**: Configura rate limiting en el frontend si es necesario
- **Plantilla**: Puedes personalizar el HTML de la plantilla como desees en el dashboard
