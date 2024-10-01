import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, email, message } = req.body

    // E-posta gönderme işlemi için bir transporter oluşturun
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Gmail için. Diğer sağlayıcılar için değiştirin
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    try {
      // E-postayı gönderin
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'loww12391@gmail.com', // Kendi e-posta adresinizi buraya yazın
        subject: `Yeni İletişim Formu Mesajı: ${name}`,
        text: `Ad: ${name}\nE-posta: ${email}\nMesaj: ${message}`,
        html: `<p><strong>Ad:</strong> ${name}</p>
               <p><strong>E-posta:</strong> ${email}</p>
               <p><strong>Mesaj:</strong> ${message}</p>`
      })

      res.status(200).json({ success: true })
    } catch (error) {
      console.error('E-posta gönderme hatası:', error)
      res.status(500).json({ success: false, message: 'E-posta gönderilemedi' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}