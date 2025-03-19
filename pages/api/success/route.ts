import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    // Parsear el cuerpo de la solicitud
    const { demanda_id, correo_pagador, nombre_pagador } = await req.json();

    if (!demanda_id || !correo_pagador || !nombre_pagador) {
      return NextResponse.json(
        { success: false, message: 'Faltan datos necesarios.' },
        { status: 400 }
      );
    }

    // Obtener los datos de la demanda desde Supabase
    const { data: demanda, error } = await supabase
      .from('demandas')
      .select('*')
      .eq('id', demanda_id)
      .single();

    if (error || !demanda) {
      return NextResponse.json(
        { success: false, message: 'No se encontró la demanda.' },
        { status: 404 }
      );
    }

    // Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    // Crear y enviar el correo al pagador
    const mailResponse = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correo_pagador,
      subject: `Detalles de la demanda: ${demanda.titulo}`,
      text: `Hola ${nombre_pagador},\n\nAquí están los detalles de la demanda:\n\n${JSON.stringify(
        demanda,
        null,
        2
      )}\n\nGracias por usar nuestro servicio.`,
    });

    return NextResponse.json({
      success: true,
      message: 'Correo enviado correctamente.',
      emailResponse: mailResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error en el servidor.' },
      { status: 500 }
    );
  }
}
