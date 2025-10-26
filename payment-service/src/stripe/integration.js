import Stripe from 'stripe';
import axios from 'axios';

class StripeIntegration {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  async createPaymentIntent(amount, currency, paymentMethod, customerData) {
    try {
      // Validate amount and currency
      if (amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: this.convertToCents(amount),
        currency: currency.toLowerCase(),
        payment_method: paymentMethod,
        confirmation_method: 'manual',
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        metadata: {
          customer_id: customerData.id,
          region: customerData.region,
          compliance_checked: true
        }
      });

      // Log transaction for compliance
      await this.logTransaction({
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        region: customerData.region,
        timestamp: new Date()
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw new Error(`Webhook handler failed: ${error.message}`);
    }
  }

  async handlePaymentSuccess(paymentIntent) {
    // Update order status in database
    await this.updateOrderStatus(paymentIntent.metadata.order_id, 'completed');
    
    // Send confirmation email
    await this.sendConfirmationEmail(paymentIntent);
  }

  async handlePaymentFailure(paymentIntent) {
    // Update order status in database
    await this.updateOrderStatus(paymentIntent.metadata.order_id, 'failed');
    
    // Notify customer
    await this.sendFailureNotification(paymentIntent);
  }

  convertToCents(amount) {
    return Math.round(amount * 100);
  }

  async logTransaction(transactionData) {
    // Implementation for transaction logging
    console.log('Transaction logged:', transactionData);
  }

  async updateOrderStatus(orderId, status) {
    // Implementation for updating order status
    console.log(`Order ${orderId} status updated to: ${status}`);
  }

  async sendConfirmationEmail(paymentIntent) {
    // Implementation for sending confirmation email
    console.log('Confirmation email sent for:', paymentIntent.id);
  }

  async sendFailureNotification(paymentIntent) {
    // Implementation for sending failure notification
    console.log('Failure notification sent for:', paymentIntent.id);
  }
}

export default StripeIntegration;
