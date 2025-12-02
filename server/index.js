require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configurar transporte de correo con nodemailer (compatible con cualquier proveedor SMTP o mailjs)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // o 'mailjs', o SMTP personalizado
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Simple in-memory token store for demo purposes
const tokens = new Map(); // token -> { username, email, expires }

function generateToken() {
  return crypto.randomBytes(20).toString('hex');
}

app.post('/api/recovery', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Falta username o email' });
    }

    // Validar que las credenciales de correo estén configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('WARNING: EMAIL_USER or EMAIL_PASS not configured. Recovery emails will NOT be sent.');
      console.log(`[DEMO] Recovery requested for user: ${username}, email: ${email}`);
      return res.json({ ok: true, demo: true, message: 'Demo mode: email not sent (configure EMAIL_USER and EMAIL_PASS)' });
    }

    // Generar token y guardarlo temporalmente
    const token = generateToken();
    const expires = Date.now() + 1000 * 60 * 60; // 1 hora
    tokens.set(token, { username, email, expires });

    const recoveryUrl = `${process.env.FRONTEND_BASE || 'http://localhost:8100'}/recovery?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperación de contraseña - FitPlan',
      html: `
        <h2>Hola ${username},</h2>
        <p>Solicitaste recuperar tu contraseña en FitPlan.</p>
        <p>Haz clic en el siguiente enlace para restablecerla (expira en 1 hora):</p>
        <p><a href="${recoveryUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Recuperar contraseña</a></p>
        <p>O copia y pega este enlace en tu navegador:</p>
        <p>${recoveryUrl}</p>
        <p>Si no solicitaste esto, ignora este correo.</p>
        <p>Saludos,<br/>Equipo FitPlan</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Recovery email sent to ${email} for user ${username}`);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error /api/recovery', e);
    res.status(500).json({ error: 'Error interno al enviar correo' });
  }
});

// Endpoint to validate token (demo)
app.get('/api/recovery/validate/:token', (req, res) => {
  const token = req.params.token;
  const entry = tokens.get(token);
  if (!entry) return res.status(404).json({ valid: false });
  if (Date.now() > entry.expires) {
    tokens.delete(token);
    return res.status(410).json({ valid: false, expired: true });
  }
  res.json({ valid: true, username: entry.username, email: entry.email });
});

app.listen(PORT, () => {
  console.log(`FitPlan recovery server running on http://localhost:${PORT}`);
});
