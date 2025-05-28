const QRCode = require('qrcode');
const axios = require('axios');

class QRService {
  // Generar QR usando la librería local
  static async generarQRLocal(texto) {
    try {
      const qrDataUrl = await QRCode.toDataURL(texto, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        success: true,
        qr_url: qrDataUrl,
        texto: texto
      };

    } catch (error) {
      console.error('Error al generar QR local:', error);
      throw error;
    }
  }

  // Generar QR usando la API externa goqr.me
  static async generarQRExterno(texto) {
    try {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(texto)}`;

      return {
        success: true,
        qr_url: url,
        texto: texto
      };

    } catch (error) {
      console.error('Error al generar QR externo:', error);
      throw error;
    }
  }

  // Método principal que intenta ambos métodos
  static async generarQR(texto) {
    try {
      // Intentar con API externa primero
      return await this.generarQRExterno(texto);
    } catch (error) {
      console.log('API externa falló, usando generación local...');
      // Si falla, usar método local
      return await this.generarQRLocal(texto);
    }
  }

  // Generar código único para tickets
  static generarCodigoTicket(eventoId, usuarioId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `TICKET-${eventoId}-${usuarioId}-${timestamp}-${random}`.toUpperCase();
  }
}

module.exports = QRService;