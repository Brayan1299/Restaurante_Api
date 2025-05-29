const nodemailer = require('nodemailer');
const config = require('../config/config');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        if (!config.email.user || !config.email.password) {
            console.log('⚠ Servicio de email no configurado (usando modo de desarrollo)');
            return;
        }

        this.transporter = nodemailer.createTransport({
            service: config.email.service,
            auth: {
                user: config.email.user,
                pass: config.email.password
            }
        });
    }

    async sendTicketConfirmation(userEmail, ticketData) {
        try {
            if (!this.transporter) {
                console.log(`📧 Email simulado enviado a ${userEmail} para ticket ${ticketData.ticket_code}`);
                return true;
            }

            const mailOptions = {
                from: config.email.user,
                to: userEmail,
                subject: `Confirmación de Ticket - Restaurante BRABUS`,
                html: `
                    <h2>¡Gracias por tu compra!</h2>
                    <p>Tu ticket para el Restaurante BRABUS ha sido confirmado.</p>
                    <p><strong>Código del ticket:</strong> ${ticketData.ticket_code}</p>
                    <p><strong>Monto:</strong> $${ticketData.amount}</p>
                    <p><strong>Estado:</strong> ${ticketData.status}</p>
                    ${ticketData.qr_code ? `<p><img src="${ticketData.qr_code}" alt="Código QR" /></p>` : ''}
                    <p>Presenta este código en el restaurante para usar tu ticket.</p>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email enviado exitosamente a ${userEmail}`);
            return true;
        } catch (error) {
            console.error('Error enviando email:', error);
            return false;
        }
    }

    async sendReviewNotification(restaurantEmail, reviewData) {
        try {
            if (!this.transporter) {
                console.log(`📧 Notificación de reseña simulada para ${restaurantEmail}`);
                return true;
            }

            const mailOptions = {
                from: config.email.user,
                to: restaurantEmail,
                subject: `Nueva reseña en Restaurante BRABUS`,
                html: `
                    <h2>Nueva reseña recibida</h2>
                    <p>Has recibido una nueva reseña en tu restaurante.</p>
                    <p><strong>Calificación:</strong> ${reviewData.rating}/5 estrellas</p>
                    <p><strong>Comentario:</strong> ${reviewData.comment || 'Sin comentario'}</p>
                    <p><strong>Usuario:</strong> ${reviewData.user_name}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Notificación de reseña enviada a ${restaurantEmail}`);
            return true;
        } catch (error) {
            console.error('Error enviando notificación de reseña:', error);
            return false;
        }
    }

    async sendWelcomeEmail(userEmail, userName) {
        try {
            if (!this.transporter) {
                console.log(`📧 Email de bienvenida simulado para ${userEmail}`);
                return true;
            }

            const mailOptions = {
                from: config.email.user,
                to: userEmail,
                subject: `¡Bienvenido a Restaurante BRABUS!`,
                html: `
                    <h2>¡Bienvenido ${userName}!</h2>
                    <p>Gracias por registrarte en el sistema de reseñas del Restaurante BRABUS.</p>
                    <p>Ahora puedes:</p>
                    <ul>
                        <li>Escribir reseñas y calificaciones</li>
                        <li>Comprar tickets con código QR</li>
                        <li>Recibir recomendaciones personalizadas</li>
                        <li>Explorar nuestro menú</li>
                    </ul>
                    <p>¡Esperamos verte pronto en nuestro restaurante!</p>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email de bienvenida enviado a ${userEmail}`);
            return true;
        } catch (error) {
            console.error('Error enviando email de bienvenida:', error);
            return false;
        }
    }
}

module.exports = new EmailService();