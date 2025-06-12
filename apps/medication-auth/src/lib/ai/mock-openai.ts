/**
 * Mock OpenAI Implementation
 * Provides the same interface as the OpenAI SDK for development without requiring the external dependency
 */

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionChoice {
  message: {
    content: string;
  };
}

interface ChatCompletion {
  choices: ChatCompletionChoice[];
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

class MockChatCompletions {
  async create(request: ChatCompletionRequest): Promise<ChatCompletion> {
    // Simulate AI analysis with realistic mock responses
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // 1-3 second delay

    const mockResponse = this.generateMockResponse(request);
    
    return {
      choices: [{
        message: {
          content: JSON.stringify(mockResponse)
        }
      }]
    };
  }

  private generateMockResponse(request: ChatCompletionRequest) {
    const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
    
    // Parse request type from user message
    if (userMessage.includes('analyze authorization')) {
      return {
        recommendation_type: 'approve',
        confidence_score: 0.85,
        reasoning: 'Patient meets clinical criteria for medication. Prior therapy history supports authorization.',
        suggested_alternatives: [],
        required_documentation: ['Medical records', 'Previous medication trials'],
        missing_information: [],
        approval_probability: 0.88,
        risk_factors: ['Monitor for side effects', 'Regular follow-up required']
      };
    }
    
    if (userMessage.includes('form completion')) {
      return {
        suggestions: {
          'diagnosis_code': 'M79.3',
          'previous_medications': 'Ibuprofen 600mg, ineffective after 6 weeks',
          'clinical_justification': 'Patient has not responded to first-line therapy and requires step-up treatment'
        },
        confidence: 0.82,
        completeness: 0.75
      };
    }

    if (userMessage.includes('probability analysis')) {
      return {
        approvalProbability: 0.78,
        factors: {
          positive: ['Clear medical necessity', 'Appropriate diagnosis', 'Prior therapy documented'],
          negative: ['High-cost medication', 'Requires specialist oversight'],
          neutral: ['Standard age range', 'No contraindications noted']
        },
        recommendations: ['Ensure all documentation is complete', 'Consider peer-to-peer review option']
      };
    }

    // Default response
    return {
      status: 'processed',
      confidence: 0.75,
      recommendation: 'Review required - insufficient data for automated decision'
    };
  }
}

class MockChat {
  completions = new MockChatCompletions();
}

export default class MockOpenAI {
  chat = new MockChat();

  constructor(config?: { apiKey?: string }) {
    // Mock constructor - doesn't actually use API key
    console.log('Using mock OpenAI implementation for development');
  }
}

// Export types for compatibility
export type { ChatCompletionMessage, ChatCompletion, ChatCompletionRequest };