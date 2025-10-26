const { OpenAI } = require('openai');
const KnowledgeBase = require('../knowledge-base/knowledgeBase');
const TicketSystem = require('../ticket-system/ticketSystem');

class BronwynChatbot {
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.knowledgeBase = new KnowledgeBase();
    this.ticketSystem = new TicketSystem();
    this.conversationHistory = new Map();
  }

  async processMessage(userId, message, context = {}) {
    try {
      // Get conversation history
      const history = this.getConversationHistory(userId);
      
      // Enhanced context with platform knowledge
      const enhancedContext = await this.enhanceContext(context, message);
      
      // Generate response using OpenAI with custom training
      const response = await this.generateResponse(message, history, enhancedContext);
      
      // Update conversation history
      this.updateConversationHistory(userId, message, response);
      
      // Learn from interaction
      await this.learnFromInteraction(userId, message, response, context);
      
      return response;
    } catch (error) {
      console.error('Chatbot error:', error);
      return this.getFallbackResponse();
    }
  }

  async generateResponse(message, history, context) {
    const prompt = this.buildPrompt(message, history, context);
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: prompt,
      temperature: 0.7,
      max_tokens: 500,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    return completion.choices[0].message.content;
  }

  buildPrompt(message, history, context) {
    const systemMessage = {
      role: "system",
      content: `You are Bronwyn, an AI support agent for the AI Agent Platform. 
      You are helpful, knowledgeable, and professional.
      Platform Features: AI Agents, Graphics Studio, Content Creation, Payments
      Regions: South Africa, Namibia, Botswana, USA, Europe, Australia
      Always maintain compliance with regional regulations.
      If you don't know something, offer to create a support ticket.
      
      Context: ${JSON.stringify(context)}`
    };

    const historyMessages = history.slice(-10); // Last 10 messages
    const userMessage = { role: "user", content: message };

    return [systemMessage, ...historyMessages, userMessage];
  }

  async learnFromInteraction(userId, message, response, context) {
    // Analyze interaction for learning
    const interaction = {
      userId,
      message,
      response,
      context,
      timestamp: new Date(),
      satisfaction: await this.estimateSatisfaction(message, response)
    };

    // Store in knowledge base
    await this.knowledgeBase.addInteraction(interaction);
    
    // Retrain model if needed
    if (interaction.satisfaction < 0.5) {
      await this.triggerRetraining();
    }
  }

  async estimateSatisfaction(message, response) {
    // Simple satisfaction estimation
    // In production, use more sophisticated NLP
    const positiveIndicators = ['thanks', 'helpful', 'great', 'solved'];
    const negativeIndicators = ['not working', 'useless', 'wrong', 'bad'];
    
    let score = 0.7; // Default neutral score
    
    positiveIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) score += 0.1;
    });
    
    negativeIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) score -= 0.1;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  getFallbackResponse() {
    return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact our support team for immediate assistance.";
  }
}

module.exports = BronwynChatbot;
