// Mock AI Engine for Demonstration
// Simulates AWS Bedrock Claude 3.5 Sonnet responses with realistic medical conversation handling

import { AIEngineResponse, ConversationTurn, MockAIConfig } from '@/types';

export class MockAIEngine {
  private config: MockAIConfig = {
    intent_recognition_delay: 300,
    response_generation_delay: 1200,
    base_confidence_score: 0.85,
    escalation_triggers: [
      'emergency',
      'chest pain',
      'difficulty breathing',
      'severe pain',
      'bleeding',
      'allergic reaction',
      'medical emergency',
      'urgent care',
      'need doctor now',
      'prescription refill',
      'medical advice',
      'symptoms',
      'rash',
      'infection'
    ],
    supported_intents: [
      'appointment_scheduling',
      'appointment_rescheduling', 
      'appointment_cancellation',
      'billing_inquiry',
      'payment_processing',
      'insurance_verification',
      'general_information',
      'prescription_refill',
      'medical_question',
      'emergency'
    ],
    conversation_templates: {
      greeting: [
        "Thank you for calling Ganger Dermatology. I'm your AI assistant. How can I help you today?",
        "Hello! Welcome to Ganger Dermatology. I'm here to assist you. What can I do for you?",
        "Good {timeOfDay}! This is Ganger Dermatology's AI assistant. How may I help you today?"
      ],
      appointment_scheduling: [
        "I'd be happy to help you schedule an appointment. Can you please provide your name and date of birth?",
        "Let me help you find an available appointment. What type of appointment are you looking for?",
        "I can check our availability for you. Which location would you prefer - Ann Arbor, Wixom, or Plymouth?"
      ],
      billing_inquiry: [
        "I can help you with billing questions. Let me look up your account. Can you provide your name and date of birth?",
        "I'll be happy to check your account balance. For security, can you verify your phone number?",
        "Let me access your billing information. What specific question do you have about your account?"
      ],
      medical_escalation: [
        "I understand you have a medical question. Let me connect you with one of our clinical staff who can better assist you.",
        "For medical concerns, I need to transfer you to our medical team. Please hold while I connect you.",
        "This sounds like something our clinical staff should address. I'm transferring you now for immediate assistance."
      ],
      emergency: [
        "This sounds like a medical emergency. I'm immediately connecting you to our clinical team.",
        "For urgent medical situations, I'm transferring you right away to our medical staff.",
        "I'm prioritizing your call and connecting you to our emergency protocol team now."
      ]
    }
  };

  constructor(customConfig?: Partial<MockAIConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  /**
   * Process a conversation turn and generate AI response
   */
  async processConversationTurn(
    userInput: string,
    conversationHistory: ConversationTurn[],
    patientContext?: any
  ): Promise<AIEngineResponse> {
    const startTime = Date.now();

    // Simulate intent recognition delay
    await this.delay(this.config.intent_recognition_delay);

    // Analyze intent
    const intent = this.detectIntent(userInput);
    const confidence = this.calculateConfidence(userInput, intent);
    const sentiment = this.analyzeSentiment(userInput);
    const emotion = this.detectEmotion(userInput, sentiment);
    
    // Check for escalation needs
    const escalationRequired = this.shouldEscalate(userInput, intent, conversationHistory);
    
    // Simulate response generation delay
    await this.delay(this.config.response_generation_delay);

    // Generate appropriate response
    const responseText = escalationRequired 
      ? this.generateEscalationResponse(intent, userInput)
      : this.generateResponse(intent, userInput, conversationHistory, patientContext);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      response_text: responseText,
      intent_detected: intent,
      confidence_score: confidence,
      sentiment_score: sentiment,
      emotion_detected: emotion,
      escalation_required: escalationRequired,
      escalation_reason: escalationRequired ? this.getEscalationReason(userInput, intent) : undefined,
      suggested_actions: this.getSuggestedActions(intent, escalationRequired),
      processing_time_ms: processingTime,
      context_updates: this.getContextUpdates(intent, userInput, patientContext)
    };
  }

  /**
   * Detect user intent from input
   */
  private detectIntent(userInput: string): string {
    const input = userInput.toLowerCase();

    // Medical emergency keywords (highest priority)
    if (this.containsAny(input, ['emergency', 'urgent', 'chest pain', 'can\'t breathe', 'severe pain', 'bleeding'])) {
      return 'emergency';
    }

    // Medical questions
    if (this.containsAny(input, ['prescription', 'medication', 'refill', 'symptoms', 'rash', 'treatment', 'medical advice'])) {
      return 'medical_question';
    }

    // Appointment-related
    if (this.containsAny(input, ['appointment', 'schedule', 'book', 'available'])) {
      return 'appointment_scheduling';
    }

    if (this.containsAny(input, ['reschedule', 'change', 'move', 'different time'])) {
      return 'appointment_rescheduling';
    }

    if (this.containsAny(input, ['cancel', 'cancel appointment', 'don\'t need'])) {
      return 'appointment_cancellation';
    }

    // Billing-related
    if (this.containsAny(input, ['bill', 'billing', 'payment', 'balance', 'insurance', 'cost', 'charge'])) {
      return 'billing_inquiry';
    }

    if (this.containsAny(input, ['pay', 'make payment', 'credit card', 'payment plan'])) {
      return 'payment_processing';
    }

    // General information
    if (this.containsAny(input, ['hours', 'location', 'address', 'directions', 'information'])) {
      return 'general_information';
    }

    // Default to general information
    return 'general_information';
  }

  /**
   * Calculate confidence score based on keyword matches and context
   */
  private calculateConfidence(userInput: string, intent: string): number {
    let confidence = this.config.base_confidence_score;

    const input = userInput.toLowerCase();
    
    // Boost confidence for clear keyword matches
    if (intent === 'appointment_scheduling' && this.containsAny(input, ['schedule', 'book', 'appointment'])) {
      confidence += 0.1;
    }
    
    if (intent === 'billing_inquiry' && this.containsAny(input, ['bill', 'billing', 'balance'])) {
      confidence += 0.1;
    }

    if (intent === 'emergency' && this.containsAny(input, ['emergency', 'urgent', 'pain'])) {
      confidence += 0.15;
    }

    // Reduce confidence for vague inputs
    if (input.length < 10) {
      confidence -= 0.15;
    }

    if (this.containsAny(input, ['um', 'uh', 'maybe', 'not sure', 'i think'])) {
      confidence -= 0.1;
    }

    // Ensure confidence stays within bounds
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Analyze sentiment (-1 to 1)
   */
  private analyzeSentiment(userInput: string): number {
    const input = userInput.toLowerCase();
    
    // Positive indicators
    if (this.containsAny(input, ['thank', 'please', 'appreciate', 'helpful', 'great', 'wonderful'])) {
      return 0.7;
    }

    // Negative indicators
    if (this.containsAny(input, ['frustrated', 'angry', 'upset', 'terrible', 'awful', 'hate', 'horrible'])) {
      return -0.8;
    }

    // Urgent/concerned
    if (this.containsAny(input, ['worried', 'concerned', 'urgent', 'emergency', 'help', 'pain'])) {
      return -0.3;
    }

    // Neutral/informational
    return 0.1;
  }

  /**
   * Detect emotional state
   */
  private detectEmotion(userInput: string, sentiment: number): string {
    const input = userInput.toLowerCase();

    if (this.containsAny(input, ['emergency', 'urgent', 'help', 'pain', 'bleeding'])) {
      return 'distressed';
    }

    if (this.containsAny(input, ['angry', 'frustrated', 'upset'])) {
      return 'frustrated';
    }

    if (this.containsAny(input, ['worried', 'concerned', 'nervous'])) {
      return 'anxious';
    }

    if (sentiment > 0.5) {
      return 'positive';
    }

    if (sentiment < -0.5) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Determine if escalation to human is required
   */
  private shouldEscalate(userInput: string, intent: string, history: ConversationTurn[]): boolean {
    const input = userInput.toLowerCase();

    // Always escalate medical emergencies
    if (intent === 'emergency') {
      return true;
    }

    // Escalate medical questions
    if (intent === 'medical_question') {
      return true;
    }

    // Escalate if escalation keywords are present
    if (this.config.escalation_triggers.some(trigger => input.includes(trigger.toLowerCase()))) {
      return true;
    }

    // Escalate if user explicitly asks for human
    if (this.containsAny(input, ['speak to person', 'human', 'doctor', 'nurse', 'representative', 'agent'])) {
      return true;
    }

    // Escalate if conversation is getting long without resolution
    if (history.length > 6) {
      return true;
    }

    // Escalate if user seems frustrated
    if (this.containsAny(input, ['frustrated', 'can\'t help', 'not understanding', 'not working'])) {
      return true;
    }

    return false;
  }

  /**
   * Generate appropriate AI response
   */
  private generateResponse(
    intent: string, 
    userInput: string, 
    history: ConversationTurn[], 
    patientContext?: any
  ): string {
    const timeOfDay = this.getTimeOfDay();
    
    // First interaction - greeting
    if (history.length === 0) {
      return this.getRandomTemplate('greeting').replace('{timeOfDay}', timeOfDay);
    }

    switch (intent) {
      case 'appointment_scheduling':
        return this.generateAppointmentResponse(userInput, history, patientContext);
      
      case 'appointment_rescheduling':
        return "I can help you reschedule your appointment. Let me look up your existing appointment. Can you provide your name and date of birth?";
      
      case 'appointment_cancellation':
        return "I can help you cancel your appointment. To locate your appointment, please provide your name and the date of your scheduled appointment.";
      
      case 'billing_inquiry':
        return this.generateBillingResponse(userInput, history, patientContext);
      
      case 'payment_processing':
        return "I can help you make a payment. For security, I'll need to verify your identity first. Can you provide your name and date of birth?";
      
      case 'general_information':
        return this.generateInfoResponse(userInput);
      
      default:
        return "I understand. Let me help you with that. Can you provide a bit more detail about what you need?";
    }
  }

  /**
   * Generate escalation response
   */
  private generateEscalationResponse(intent: string, _userInput: string): string {
    if (intent === 'emergency') {
      return this.getRandomTemplate('emergency');
    }

    if (intent === 'medical_question') {
      return this.getRandomTemplate('medical_escalation');
    }

    return "I understand this is important to you. Let me connect you with one of our team members who can provide the specialized assistance you need. Please hold for just a moment.";
  }

  /**
   * Generate appointment-specific responses
   */
  private generateAppointmentResponse(userInput: string, _history: ConversationTurn[], _patientContext?: any): string {
    const input = userInput.toLowerCase();

    if (this.containsAny(input, ['new patient', 'first time', 'never been'])) {
      return "Welcome to Ganger Dermatology! I'd be happy to schedule your new patient appointment. New patient visits are typically 45 minutes. Which location would work best for you - Ann Arbor, Wixom, or Plymouth?";
    }

    if (this.containsAny(input, ['follow up', 'followup', 'return visit'])) {
      return "I can schedule your follow-up appointment. Which provider were you seeing, and do you have a preferred timeframe?";
    }

    if (this.containsAny(input, ['urgent', 'soon', 'asap', 'immediately'])) {
      return "I understand you need to be seen soon. Let me check our urgent care availability. This may require connecting you with our clinical team to assess the urgency. Can you briefly describe your concern?";
    }

    // Check if they've provided location preference
    if (this.containsAny(input, ['ann arbor', 'wixom', 'plymouth'])) {
      const location = input.includes('ann arbor') ? 'Ann Arbor' : input.includes('wixom') ? 'Wixom' : 'Plymouth';
      return `Great choice! Our ${location} location has availability. What type of appointment do you need - a routine check-up, consultation for a specific concern, or follow-up visit?`;
    }

    return this.getRandomTemplate('appointment_scheduling');
  }

  /**
   * Generate billing-specific responses
   */
  private generateBillingResponse(userInput: string, _history: ConversationTurn[], _patientContext?: any): string {
    const input = userInput.toLowerCase();

    if (this.containsAny(input, ['balance', 'owe', 'amount due'])) {
      return "I can check your account balance for you. For security purposes, I'll need to verify your identity. Can you provide your name and date of birth?";
    }

    if (this.containsAny(input, ['insurance', 'coverage', 'copay'])) {
      return "I can help with insurance questions. What specific information do you need about your insurance coverage or copay?";
    }

    if (this.containsAny(input, ['payment plan', 'installments', 'monthly payments'])) {
      return "We do offer payment plan options. Let me connect you with our billing specialist who can discuss the available payment arrangements that might work for your situation.";
    }

    return this.getRandomTemplate('billing_inquiry');
  }

  /**
   * Generate information responses
   */
  private generateInfoResponse(userInput: string): string {
    const input = userInput.toLowerCase();

    if (this.containsAny(input, ['hours', 'open', 'close'])) {
      return "Our office hours are Monday through Friday 8:00 AM to 5:00 PM, and Saturday 9:00 AM to 1:00 PM. We're closed on Sundays. Is there a specific location you're asking about?";
    }

    if (this.containsAny(input, ['location', 'address', 'directions'])) {
      return "We have three convenient locations: Ann Arbor at 123 Medical Drive, Wixom at 456 Health Plaza, and Plymouth at 789 Care Center Blvd. Which location interests you?";
    }

    if (this.containsAny(input, ['parking', 'where to park'])) {
      return "All of our locations offer free parking. There's convenient parking directly in front of each office with accessible spaces available.";
    }

    return "I'd be happy to provide that information. Can you be more specific about what you'd like to know?";
  }

  /**
   * Get escalation reason
   */
  private getEscalationReason(userInput: string, intent: string): string {
    if (intent === 'emergency') {
      return 'Medical emergency - immediate clinical attention required';
    }

    if (intent === 'medical_question') {
      return 'Medical question requiring clinical expertise';
    }

    if (userInput.toLowerCase().includes('frustrated')) {
      return 'Customer frustration - human interaction needed';
    }

    return 'Escalation to specialized staff for optimal customer service';
  }

  /**
   * Get suggested actions for staff
   */
  private getSuggestedActions(intent: string, escalationRequired: boolean): string[] {
    if (!escalationRequired) {
      return [];
    }

    const baseActions = ['Review conversation context', 'Verify patient identity'];

    switch (intent) {
      case 'emergency':
        return [...baseActions, 'Immediate clinical assessment', 'Activate emergency protocol'];
      
      case 'medical_question':
        return [...baseActions, 'Clinical review required', 'Assess urgency level'];
      
      case 'appointment_scheduling':
        return [...baseActions, 'Check complex scheduling needs', 'Verify insurance if needed'];
      
      case 'billing_inquiry':
        return [...baseActions, 'Access billing system', 'Review payment history'];
      
      default:
        return [...baseActions, 'Provide personalized assistance'];
    }
  }

  /**
   * Get context updates for the conversation
   */
  private getContextUpdates(intent: string, userInput: string, _patientContext?: any): Record<string, any> {
    const updates: Record<string, any> = {
      last_intent: intent,
      last_input_length: userInput.length,
      timestamp: new Date().toISOString()
    };

    // Extract location preference
    const input = userInput.toLowerCase();
    if (this.containsAny(input, ['ann arbor', 'wixom', 'plymouth'])) {
      updates.preferred_location = input.includes('ann arbor') ? 'Ann Arbor' : 
                                  input.includes('wixom') ? 'Wixom' : 'Plymouth';
    }

    // Extract appointment type preference
    if (this.containsAny(input, ['routine', 'check up', 'follow up', 'new patient', 'urgent'])) {
      updates.appointment_type = input.includes('routine') ? 'routine' :
                                input.includes('check up') ? 'checkup' :
                                input.includes('follow up') ? 'followup' :
                                input.includes('new patient') ? 'new_patient' : 'urgent';
    }

    return updates;
  }

  // Utility methods
  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private getRandomTemplate(category: string): string {
    const templates = this.config.conversation_templates[category] || ['I understand. How can I help you?'];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get mock patient data for demo scenarios
   */
  getMockPatientData(patientId: string): any {
    // Mock patient data for demo
    const patients: Record<string, any> = {
      'patient_001': {
        id: 'patient_001',
        name: 'Sarah Johnson',
        dob: '1985-03-15',
        phone: '+15551234567',
        location_preference: 'Ann Arbor',
        last_visit: '2024-11-15',
        upcoming_appointments: [],
        account_balance: 125.50,
        insurance: 'Blue Cross Blue Shield'
      },
      'patient_002': {
        id: 'patient_002', 
        name: 'Michael Chen',
        dob: '1978-09-22',
        phone: '+15552345678',
        location_preference: 'Wixom',
        last_visit: '2024-12-01',
        upcoming_appointments: ['2025-01-15 10:00 AM'],
        account_balance: 0.00,
        insurance: 'Aetna'
      }
    };

    return patients[patientId] || null;
  }
}