/**
 * OpenAI Integration Client for AI-powered content generation and analysis
 * Handles sentiment analysis, content adaptation, and response generation
 */

export interface SentimentAnalysisRequest {
  text: string;
  context?: string;
  extractTopics?: boolean;
}

export interface SentimentAnalysisResponse {
  sentiment: number; // -1 to 1
  topics: string[];
  confidence: number;
}

export interface ContentAdaptationRequest {
  originalCaption: string;
  originalHashtags?: string[];
  targetPlatforms: string[];
  businessContext: {
    name: string;
    specialty: string;
    locations: string[];
    tone: string;
  };
  adaptationRules?: any[];
}

export interface ContentAdaptationResponse {
  caption: string;
  hashtags: string[];
  callToAction: string;
  confidence: number;
  prompt: string;
}

export interface ReviewResponseRequest {
  reviewText: string;
  rating: number;
  businessName: string;
  location: string;
  template?: any;
  sentimentCategory: string;
  keyTopics: string[];
}

export interface ReviewResponseResponse {
  text: string;
  confidence: number;
  template_used?: string;
}

export interface ContentRelevanceRequest {
  text: string;
  hashtags?: string[];
  context: string;
  businessCategories: string[];
}

export interface ContentRelevanceResponse {
  score: number; // 0 to 1
  topics: string[];
  isRelevant: boolean;
}

export class OpenAIClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY!;
    this.baseUrl = 'https://api.openai.com/v1';

    if (!this.apiKey) {
      console.warn('OpenAI API key not configured, using mock responses');
    }
  }

  /**
   * Analyze sentiment of text content
   */
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResponse> {
    try {
      if (!this.apiKey || process.env.NODE_ENV === 'development') {
        return this.getMockSentimentAnalysis(request.text);
      }

      const prompt = this.buildSentimentPrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseSentimentResponse(response);

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return this.getMockSentimentAnalysis(request.text);
    }
  }

  /**
   * Adapt content for Ganger Dermatology social media
   */
  async adaptContent(request: ContentAdaptationRequest): Promise<ContentAdaptationResponse> {
    try {
      if (!this.apiKey || process.env.NODE_ENV === 'development') {
        return this.getMockContentAdaptation(request);
      }

      const prompt = this.buildContentAdaptationPrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseContentAdaptationResponse(response, prompt);

    } catch (error) {
      console.error('Error adapting content:', error);
      return this.getMockContentAdaptation(request);
    }
  }

  /**
   * Generate response to Google Business review
   */
  async generateReviewResponse(request: ReviewResponseRequest): Promise<ReviewResponseResponse> {
    try {
      if (!this.apiKey || process.env.NODE_ENV === 'development') {
        return this.getMockReviewResponse(request);
      }

      const prompt = this.buildReviewResponsePrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseReviewResponseResponse(response);

    } catch (error) {
      console.error('Error generating review response:', error);
      return this.getMockReviewResponse(request);
    }
  }

  /**
   * Analyze content relevance for dermatology business
   */
  async analyzeContentRelevance(request: ContentRelevanceRequest): Promise<ContentRelevanceResponse> {
    try {
      if (!this.apiKey || process.env.NODE_ENV === 'development') {
        return this.getMockContentRelevance(request);
      }

      const prompt = this.buildContentRelevancePrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseContentRelevanceResponse(response);

    } catch (error) {
      console.error('Error analyzing content relevance:', error);
      return this.getMockContentRelevance(request);
    }
  }

  /**
   * Call OpenAI API with prompt
   */
  private async callOpenAI(prompt: string, model: string = 'gpt-4'): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in healthcare content creation and customer service for dermatology practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Build sentiment analysis prompt
   */
  private buildSentimentPrompt(request: SentimentAnalysisRequest): string {
    return `
Analyze the sentiment of this ${request.context || 'text'} and extract key topics:

Text: "${request.text}"

Please respond with a JSON object containing:
- sentiment: number between -1 (very negative) and 1 (very positive)
- topics: array of relevant topic keywords
- confidence: confidence score between 0 and 1

Focus on medical/healthcare context and customer service aspects.
    `.trim();
  }

  /**
   * Build content adaptation prompt
   */
  private buildContentAdaptationPrompt(request: ContentAdaptationRequest): string {
    const { businessContext, targetPlatforms } = request;
    
    return `
Adapt this social media content for ${businessContext.name}, a ${businessContext.specialty} practice:

Original Caption: "${request.originalCaption}"
Original Hashtags: ${request.originalHashtags?.join(', ') || 'None'}

Business Context:
- Name: ${businessContext.name}
- Specialty: ${businessContext.specialty}
- Locations: ${businessContext.locations.join(', ')}
- Tone: ${businessContext.tone}

Target Platforms: ${targetPlatforms.join(', ')}

Create adapted content that:
1. Maintains medical accuracy and professionalism
2. Includes a clear call-to-action for appointment booking
3. Uses appropriate hashtags for dermatology/skincare
4. Follows platform best practices
5. Maintains engaging but professional tone

Respond with JSON containing:
- caption: adapted caption text
- hashtags: array of relevant hashtags
- callToAction: specific call-to-action text
- confidence: confidence score (0-1)
    `.trim();
  }

  /**
   * Build review response prompt
   */
  private buildReviewResponsePrompt(request: ReviewResponseRequest): string {
    return `
Generate a professional response to this Google Business review for ${request.businessName}:

Review: "${request.reviewText}"
Rating: ${request.rating}/5 stars
Location: ${request.location}
Sentiment: ${request.sentimentCategory}
Key Topics: ${request.keyTopics.join(', ')}

Guidelines:
1. Professional and empathetic tone
2. Address specific concerns mentioned
3. Thank the reviewer
4. Encourage future visits if appropriate
5. Keep response under 300 characters
6. Include location context if relevant
7. For negative reviews, acknowledge concerns and offer resolution

Respond with JSON containing:
- text: the response text
- confidence: confidence score (0-1)
    `.trim();
  }

  /**
   * Build content relevance prompt
   */
  private buildContentRelevancePrompt(request: ContentRelevanceRequest): string {
    return `
Analyze the relevance of this content for a ${request.context} business:

Content: "${request.text}"
Hashtags: ${request.hashtags?.join(', ') || 'None'}
Business Categories: ${request.businessCategories.join(', ')}

Determine:
1. How relevant is this content to the business categories?
2. What topics does it cover?
3. Would this content be suitable for adaptation?

Respond with JSON containing:
- score: relevance score (0-1, where 1 is highly relevant)
- topics: array of identified topics
- isRelevant: boolean indicating if content is worth adapting
    `.trim();
  }

  /**
   * Parse sentiment analysis response
   */
  private parseSentimentResponse(response: string): SentimentAnalysisResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        sentiment: parsed.sentiment || 0,
        topics: parsed.topics || [],
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Error parsing sentiment response:', error);
      return { sentiment: 0, topics: [], confidence: 0.5 };
    }
  }

  /**
   * Parse content adaptation response
   */
  private parseContentAdaptationResponse(response: string, prompt: string): ContentAdaptationResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        caption: parsed.caption || '',
        hashtags: parsed.hashtags || [],
        callToAction: parsed.callToAction || '',
        confidence: parsed.confidence || 0.5,
        prompt
      };
    } catch (error) {
      console.error('Error parsing content adaptation response:', error);
      return {
        caption: '',
        hashtags: [],
        callToAction: '',
        confidence: 0.5,
        prompt
      };
    }
  }

  /**
   * Parse review response
   */
  private parseReviewResponseResponse(response: string): ReviewResponseResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        text: parsed.text || '',
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Error parsing review response:', error);
      return { text: '', confidence: 0.5 };
    }
  }

  /**
   * Parse content relevance response
   */
  private parseContentRelevanceResponse(response: string): ContentRelevanceResponse {
    try {
      const parsed = JSON.parse(response);
      return {
        score: parsed.score || 0,
        topics: parsed.topics || [],
        isRelevant: parsed.isRelevant || false
      };
    } catch (error) {
      console.error('Error parsing content relevance response:', error);
      return { score: 0, topics: [], isRelevant: false };
    }
  }

  /**
   * Mock sentiment analysis for development
   */
  private getMockSentimentAnalysis(text: string): SentimentAnalysisResponse {
    const positiveWords = ['excellent', 'great', 'professional', 'satisfied', 'recommend', 'amazing', 'wonderful'];
    const negativeWords = ['bad', 'terrible', 'rude', 'disappointed', 'worst', 'awful', 'horrible'];

    let sentiment = 0;
    const lowerText = text.toLowerCase();

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) sentiment += 0.2;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) sentiment -= 0.2;
    });

    sentiment = Math.max(-1, Math.min(1, sentiment));

    const topics = [];
    if (lowerText.includes('staff') || lowerText.includes('service')) topics.push('customer_service');
    if (lowerText.includes('wait') || lowerText.includes('appointment')) topics.push('scheduling');
    if (lowerText.includes('doctor') || lowerText.includes('treatment')) topics.push('medical_care');
    if (lowerText.includes('clean') || lowerText.includes('facility')) topics.push('facility');

    return {
      sentiment,
      topics,
      confidence: 0.8
    };
  }

  /**
   * Mock content adaptation for development
   */
  private getMockContentAdaptation(request: ContentAdaptationRequest): ContentAdaptationResponse {
    const originalCaption = request.originalCaption;
    const businessName = request.businessContext.name;

    // Simple adaptation - add dermatology context
    const adaptedCaption = `✨ Inspired by this amazing skincare tip! At ${businessName}, we believe in the power of proper skincare. ${originalCaption.substring(0, 100)}... Let us help you achieve your best skin! 💫`;

    const hashtags = [
      '#GangerDermatology',
      '#SkincareTips',
      '#HealthySkin',
      '#Dermatology',
      '#SkincareRoutine',
      '#ProfessionalSkincare',
      '#SkinHealth'
    ];

    const callToAction = `Book your consultation today! Call us or visit our website to schedule.`;

    return {
      caption: adaptedCaption,
      hashtags,
      callToAction,
      confidence: 0.85,
      prompt: 'Mock adaptation for development'
    };
  }

  /**
   * Mock review response for development
   */
  private getMockReviewResponse(request: ReviewResponseRequest): ReviewResponseResponse {
    const { rating, businessName, reviewText } = request;

    let responseText = '';

    if (rating >= 4) {
      responseText = `Thank you so much for your wonderful review! We're thrilled that you had such a positive experience at ${businessName}. Our team works hard to provide excellent dermatological care, and your feedback means the world to us. We look forward to seeing you again! 🌟`;
    } else if (rating >= 3) {
      responseText = `Thank you for your feedback about your visit to ${businessName}. We appreciate you taking the time to share your experience. If there's anything specific we can improve, please don't hesitate to reach out to us directly. We value your input and hope to provide an even better experience next time.`;
    } else {
      responseText = `Thank you for bringing your concerns to our attention. We sincerely apologize that your experience at ${businessName} didn't meet your expectations. We take all feedback seriously and would appreciate the opportunity to discuss this further. Please contact our office directly so we can address your concerns and make things right. Your experience matters to us.`;
    }

    return {
      text: responseText,
      confidence: 0.8
    };
  }

  /**
   * Mock content relevance for development
   */
  private getMockContentRelevance(request: ContentRelevanceRequest): ContentRelevanceResponse {
    const text = request.text.toLowerCase();
    const hashtags = request.hashtags?.join(' ').toLowerCase() || '';
    
    // Check for dermatology/skincare keywords
    const relevantKeywords = ['skin', 'skincare', 'dermatology', 'acne', 'treatment', 'beauty', 'health', 'medical', 'cosmetic', 'wellness'];
    
    let score = 0;
    const foundTopics = [];

    relevantKeywords.forEach(keyword => {
      if (text.includes(keyword) || hashtags.includes(keyword)) {
        score += 0.15;
        foundTopics.push(keyword);
      }
    });

    score = Math.min(1, score);
    const isRelevant = score >= 0.3;

    return {
      score,
      topics: foundTopics,
      isRelevant
    };
  }
}

export default OpenAIClient;