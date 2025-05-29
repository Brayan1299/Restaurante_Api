
const ticketService = require('../services/ticketService');
const emailService = require('../services/emailService');

class TicketController {
    async purchase(req, res) {
        try {
            const { restaurant_id, amount } = req.body;
            const userId = req.user.userId;

            const ticket = await ticketService.createTicket({
                userId,
                restaurant_id,
                amount
            });

            const paymentLink = await ticketService.createPaymentLink(ticket);

            res.json({
                success: true,
                message: 'Ticket creado exitosamente',
                ticket: {
                    id: ticket.id,
                    ticket_code: ticket.ticket_code,
                    amount: ticket.amount,
                    status: ticket.status,
                    qr_code: ticket.qr_code
                },
                payment_link: paymentLink
            });

        } catch (error) {
            console.error('Error comprando ticket:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async getMyTickets(req, res) {
        try {
            const userId = req.user.userId;
            const tickets = await ticketService.getUserTickets(userId);

            res.json({
                success: true,
                tickets
            });

        } catch (error) {
            console.error('Error obteniendo tickets:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async verifyTicket(req, res) {
        try {
            const { ticket_code } = req.params;
            const ticket = await ticketService.verifyTicket(ticket_code);

            if (!ticket) {
                return res.status(404).json({
                    success: false,
                    message: 'Ticket no encontrado'
                });
            }

            res.json({
                success: true,
                ticket
            });

        } catch (error) {
            console.error('Error verificando ticket:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async webhook(req, res) {
        try {
            const payment = req.body;
            
            if (payment.type === 'payment') {
                const paymentData = payment.data;
                await ticketService.handlePaymentWebhook(paymentData);
            }

            res.status(200).json({ success: true });

        } catch (error) {
            console.error('Error en webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Error procesando webhook'
            });
        }
    }

    async getStats(req, res) {
        try {
            const stats = await ticketService.getStats();
            
            res.json({
                success: true,
                stats
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async getAll(req, res) {
        try {
            const tickets = await ticketService.getAllTickets();
            
            res.json({
                success: true,
                tickets
            });

        } catch (error) {
            console.error('Error obteniendo todos los tickets:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const ticket = await ticketService.updateTicketStatus(id, status);

            res.json({
                success: true,
                message: 'Estado del ticket actualizado',
                ticket
            });

        } catch (error) {
            console.error('Error actualizando estado:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = new TicketController();
