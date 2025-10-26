const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const ComplianceService = require('../compliance/complianceService');

class StripeIntegration {
  constructor() {
    this.compliance = new ComplianceService();
  }

  async createPaymentIntent(amount, currency, paymentMethod, customerData) {
    // Compliance check
    await this.compliance.validatePayment(amount, currency, customerData.region);
    
    // Anti-fraud check
    await this.antiFraudCheck(customerData, amount);
    
    try {
      const paymentIntent = await stripe.paymentIntents.create({
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
      await this.compliance.logTransaction({
        paymentIntentId: paymentIntent.id,
        amount,
        currency,
        region: customerData.region,
        timestamp: new Date()
      });

      return paymentIntent;
    } catch (error) {
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  async antiFraudCheck(customerData, amount) {
    // Implement fraud detection logic
    const riskScore = await this.calculateRiskScore(customerData, amount);
    
    if (riskScore > 0.8) {
      throw new Error('Transaction flagged for manual review');
    }
    
    return true;
  }

  async calculateRiskScore(customerData, amount) {
    // Simplified risk calculation
    let score = 0;
    
    // Amount-based risk
    if (amount > 10000) score += 0.3;
    
    // Region-based risk
    const highRiskRegions = ['certain_regions'];
    if (highRiskRegions.includes(customerData.region)) score += 0.2;
    
    // Behavior-based risk
    // Add more sophisticated checks here
    
    return Math.min(score, 1);
  }

  convertToCents(amount) {
    return Math.round(amount * 100);
  }
}

module.exports = StripeIntegration;
