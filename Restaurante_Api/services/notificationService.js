const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async enviarNotificacion(tipo, destinatario, datos) {
    try {
      let subject, html;

      switch (tipo) {
        case 'bienvenida':
          subject = 'Bienvenido a GastroAPI';
          html = `
            <h2>¡Bienvenido ${datos.nombre}!</h2>
            <p>Tu cuenta ha sido creada exitosamente.</p>
          `;
          break;

        case 'ticket_comprado':
          subject = 'Ticket comprado exitosamente';
          html = `
            <h2>¡Ticket comprado!</h2>
            <p>Tu ticket para el evento "${datos.evento}" ha sido procesado.</p>
            <p>Código: ${datos.codigo}</p>
          `;
          break;

        case 'nueva_resena':
          subject = 'Nueva reseña en tu restaurante';
          html = `
            <h2>Nueva reseña</h2>
            <p>Se ha publicado una nueva reseña en "${datos.restaurante}".</p>
            <p>Calificación: ${datos.calificacion}/5</p>
          `;
          break;

        default:
          subject = 'Notificación de GastroAPI';
          html = '<p>Tienes una nueva notificación.</p>';
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Notificación enviada a ${destinatario}: ${subject}`);
        return { success: true, message: 'Notificación simulada en desarrollo' };
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: destinatario,
        subject: subject,
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Notificación enviada' };

    } catch (error) {
      console.error('Error al enviar notificación:', error);
      return { success: false, error: error.message };
    }
  }
}

const enviarNotificacion = async (tipo, destinatario, datos) => {
  const service = new NotificationService();
  return await service.enviarNotificacion(tipo, destinatario, datos);
};

module.exports = {
  NotificationService,
  enviarNotificacion
};