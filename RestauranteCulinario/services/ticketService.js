const { query } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const config = require('../config/config');

class TicketService {
    async createTicket(ticketData) {
        try {
            const ticketCode = this.generateTicketCode();
            const qrCodeUrl = await this.generateQRCode(ticketCode);

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            const result = await query(`
                INSERT INTO tickets (user_id, restaurant_id, ticket_code, qr_code_url, amount, expires_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                ticketData.userId,
                ticketData.restaurant_id,
                ticketCode,
                qrCodeUrl,
                ticketData.amount,
                expiresAt.toISOString()
            ]);

            return {
                id: result.insertId,
                ticket_code: ticketCode,
                qr_code: qrCodeUrl,
                amount: ticketData.amount,
                status: 'pending'
            };
        } catch (error) {
            console.error('Error creando ticket:', error);
            throw error;
        }
    }

    generateTicketCode() {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `BRABUS-${timestamp.slice(-6)}-${random}`;
    }

    async generateQRCode(data) {
        try {
            const qrData = encodeURIComponent(JSON.stringify({
                ticket_code: data,
                restaurant: 'BRABUS',
                timestamp: Date.now()
            }));

            return `${config.qr.apiUrl}create-qr-code/?size=200x200&data=${qrData}`;
        } catch (error) {
            console.error('Error generando QR:', error);
            return null;
        }
    }

    async createPaymentLink(ticket) {
        try {
            if (!config.mercadoPago.accessToken) {
                return `${config.server.host}:${config.server.port}/api/tickets/mock-payment/${ticket.id}`;
            }

            const paymentData = {
                items: [{
                    title: `Ticket Restaurante BRABUS - ${ticket.ticket_code}`,
                    quantity: 1,
                    unit_price: parseFloat(ticket.amount)
                }],
                external_reference: ticket.ticket_code,
                notification_url: `${config.server.host}:${config.server.port}/api/tickets/webhook`,
                back_urls: {
                    success: `${config.server.host}:${config.server.port}/payment-success`,
                    failure: `${config.server.host}:${config.server.port}/payment-failure`,
                    pending: `${config.server.host}:${config.server.port}/payment-pending`
                },
                auto_return: 'approved'
            };

            const response = await axios.post('https://api.mercadopago.com/checkout/preferences', paymentData, {
                headers: {
                    'Authorization': `Bearer ${config.mercadoPago.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data.init_point;
        } catch (error) {
            console.error('Error creando enlace de pago:', error);
            return `${config.server.host}:${config.server.port}/api/tickets/mock-payment/${ticket.id}`;
        }
    }

    async getUserTickets(userId) {
        try {
            const tickets = await query(`
                SELECT t.*, r.name as restaurant_name
                FROM tickets t
                JOIN restaurants r ON t.restaurant_id = r.id
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC
            `, [userId]);

            return tickets;
        } catch (error) {
            console.error('Error obteniendo tickets del usuario:', error);
            throw error;
        }
    }

    async verifyTicket(ticketCode) {
        try {
            const result = await query(`
                SELECT t.*, r.name as restaurant_name, u.name as user_name
                FROM tickets t
                JOIN restaurants r ON t.restaurant_id = r.id
                JOIN users u ON t.user_id = u.id
                WHERE t.ticket_code = ?
            `, [ticketCode]);

            return result[0] || null;
        } catch (error) {
            console.error('Error verificando ticket:', error);
            throw error;
        }
    }

    async updateTicketStatus(ticketId, status) {
        try {
            await query(`
                UPDATE tickets 
                SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, ticketId]);

            const result = await query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
            return result[0];
        } catch (error) {
            console.error('Error actualizando estado del ticket:', error);
            throw error;
        }
    }

    async handlePaymentWebhook(paymentData) {
        try {
            if (paymentData.status === 'approved') {
                const ticketCode = paymentData.external_reference;

                await query(`
                    UPDATE tickets 
                    SET status = 'paid', payment_id = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE ticket_code = ?
                `, [paymentData.id, ticketCode]);

                console.log(`Ticket ${ticketCode} marcado como pagado`);
            }
        } catch (error) {
            console.error('Error procesando webhook de pago:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const result = await query(`
                SELECT 
                    COUNT(*) as total_tickets,
                    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_tickets,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tickets,
                    COUNT(CASE WHEN status = 'used' THEN 1 END) as used_tickets,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_revenue
                FROM tickets
            `);

            return result[0];
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    async getAllTickets() {
        try {
            const tickets = await query(`
                SELECT t.*, r.name as restaurant_name, u.name as user_name
                FROM tickets t
                JOIN restaurants r ON t.restaurant_id = r.id
                JOIN users u ON t.user_id = u.id
                ORDER BY t.created_at DESC
            `);

            return tickets;
        } catch (error) {
            console.error('Error obteniendo todos los tickets:', error);
            throw error;
        }
    }
}

module.exports = new TicketService();