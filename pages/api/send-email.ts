import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  const { nombre, apellido, email, motivo, mensaje } = req.body;

  if (!nombre || !email || !motivo || !mensaje) {
    return res.status(400).json({ message: 'Faltan datos requeridos' });
  }

  // Validar formato del correo electrónico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Correo electrónico inválido' });
  }

  if (mensaje.length < 10) {
    return res.status(400).json({ message: 'El mensaje debe tener al menos 10 caracteres' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Tu correo
        pass: process.env.GMAIL_PASSWORD, // Tu contraseña o app password
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `Nuevo mensaje de ${nombre} ${apellido || ''}`,
      text: `
        Correo electrónico: ${email}
        Motivo: ${motivo}
        
        Mensaje:
        ${mensaje}
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Correo enviado con éxito' });
  } catch (error) {
    console.error('Error enviando correo:', error);
    res.status(500).json({ message: 'Error enviando el correo' });
  }
}
