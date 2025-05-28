const mercadopago = require('mercadopago');

class MercadoPagoService {
  constructor() {
    mercadopago.configure({
      access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST-access-token'
    });
  }

  async crearPreferencia(datos) {
    try {
      const preference = {
        items: [
          {
            title: datos.titulo,
            unit_price: parseFloat(datos.precio),
            quantity: parseInt(datos.cantidad) || 1,
            currency_id: 'ARS'
          }
        ],
        payer: {
          email: datos.email,
          name: datos.nombre
        },
        back_urls: {
          success: `${process.env.BASE_URL || 'http://localhost:5000'}/api/tickets/pago/success`,
          failure: `${process.env.BASE_URL || 'http://localhost:5000'}/api/tickets/pago/failure`,
          pending: `${process.env.BASE_URL || 'http://localhost:5000'}/api/tickets/pago/pending`
        },
        auto_return: 'approved',
        external_reference: datos.referencia_externa
      };

      const response = await mercadopago.preferences.create(preference);

      return {
        success: true,
        preference_id: response.body.id,
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point
      };

    } catch (error) {
      console.error('Error al crear preferencia de pago:', error);

      // En desarrollo, simular respuesta exitosa
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          preference_id: 'TEST-PREF-' + Date.now(),
          init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=TEST',
          sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=TEST',
          simulado: true
        };
      }

      throw error;
    }
  }

  async verificarPago(paymentId) {
    try {
      const payment = await mercadopago.payment.findById(paymentId);

      return {
        success: true,
        estado: payment.body.status,
        monto: payment.body.transaction_amount,
        referencia: payment.body.external_reference
      };

    } catch (error) {
      console.error('Error al verificar pago:', error);

      // En desarrollo, simular pago aprobado
      if (process.env.NODE_ENV === 'development') {
        return {
          success: true,
          estado: 'approved',
          monto: 100,
          referencia: 'TEST-REF',
          simulado: true
        };
      }

      throw error;
    }
  }
}

module.exports = MercadoPagoService;