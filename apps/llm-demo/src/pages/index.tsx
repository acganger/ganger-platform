import React, { useState } from 'react';
import type { AIModel } from '@/types/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Available models for testing with detailed information
const DEMO_MODELS: { 
  model: AIModel; 
  name: string; 
  description: string;
  details: {
    overview: string;
    costPerToken: number;
    costPer1000Chars: string;
    responseTime: string;
    contextWindow: string;
    bestUses: string[];
    limitations: string[];
    medicalRelevance?: string;
  };
}[] = [
  { 
    model: 'llama-4-scout-17b-16e-instruct', 
    name: 'Llama 4 Scout', 
    description: 'Medical-optimized, best for healthcare context',
    details: {
      overview: 'Specialized medical LLM trained on healthcare data, optimized for clinical accuracy and HIPAA-compliant responses.',
      costPerToken: 0.0001,
      costPer1000Chars: '$0.025',
      responseTime: '800-1200ms',
      contextWindow: '16K tokens',
      bestUses: [
        'Medical documentation and charting',
        'Clinical decision support',
        'Patient education materials',
        'Drug interaction checks',
        'ICD-10 coding assistance'
      ],
      limitations: [
        'Should not replace physician judgment',
        'Requires validation for critical decisions',
        'May be overly cautious with medical advice'
      ],
      medicalRelevance: 'Trained on medical literature, clinical guidelines, and anonymized healthcare data. Understands medical terminology and can provide evidence-based recommendations.'
    }
  },
  { 
    model: 'llama-3.3-70b-instruct-fp8-fast', 
    name: 'Llama 3.3 Fast', 
    description: 'Fast general-purpose chat',
    details: {
      overview: 'High-performance general model with FP8 quantization for faster inference without significant quality loss.',
      costPerToken: 0.00008,
      costPer1000Chars: '$0.020',
      responseTime: '600-900ms',
      contextWindow: '8K tokens',
      bestUses: [
        'General chat and Q&A',
        'Document summarization',
        'Email drafting',
        'Basic medical inquiries',
        'Staff communications'
      ],
      limitations: [
        'Not specialized for medical content',
        'May lack depth in clinical knowledge',
        'FP8 quantization slightly reduces accuracy'
      ]
    }
  },
  { 
    model: 'qwq-32b', 
    name: 'QwQ Reasoning', 
    description: 'Complex reasoning and analysis',
    details: {
      overview: 'Advanced reasoning model designed for complex analytical tasks, mathematical reasoning, and multi-step problem solving.',
      costPerToken: 0.00012,
      costPer1000Chars: '$0.030',
      responseTime: '1000-1500ms',
      contextWindow: '32K tokens',
      bestUses: [
        'Complex medical case analysis',
        'Research paper interpretation',
        'Statistical analysis of clinical data',
        'Treatment protocol comparisons',
        'Multi-factor decision making'
      ],
      limitations: [
        'Slower response time',
        'Higher cost per query',
        'May overthink simple questions',
        'Can be verbose in responses'
      ],
      medicalRelevance: 'Excellent for analyzing complex medical scenarios, differential diagnoses, and interpreting research studies.'
    }
  },
  { 
    model: 'llama-3.2-11b-vision-instruct', 
    name: 'Llama Vision', 
    description: 'Multimodal (text + images)',
    details: {
      overview: 'Multimodal model capable of understanding both text and images, useful for visual medical data.',
      costPerToken: 0.00015,
      costPer1000Chars: '$0.038',
      responseTime: '1200-1800ms',
      contextWindow: '4K tokens',
      bestUses: [
        'Analyzing medical images and charts',
        'Reading handwritten prescriptions',
        'Interpreting lab result images',
        'Visual wound assessment',
        'Dermatological image analysis'
      ],
      limitations: [
        'Not a replacement for radiologist review',
        'Limited medical image training',
        'Higher latency for image processing',
        'Smaller context window'
      ],
      medicalRelevance: 'Particularly useful in dermatology for preliminary skin condition assessment and documentation.'
    }
  },
  { 
    model: 'llama-3.2-3b-instruct', 
    name: 'Llama 3B', 
    description: 'Small, fast, cost-effective',
    details: {
      overview: 'Compact model balancing performance and cost, suitable for routine tasks and high-volume usage.',
      costPerToken: 0.00006,
      costPer1000Chars: '$0.015',
      responseTime: '200-400ms',
      contextWindow: '4K tokens',
      bestUses: [
        'Quick patient FAQs',
        'Appointment scheduling assistance',
        'Basic triage questions',
        'Medication reminders',
        'Simple data extraction'
      ],
      limitations: [
        'Limited medical knowledge depth',
        'Struggles with complex reasoning',
        'Smaller context window',
        'May miss nuanced medical details'
      ]
    }
  },
  { 
    model: 'llama-3.2-1b-instruct', 
    name: 'Llama 1B', 
    description: 'Micro model for simple tasks',
    details: {
      overview: 'Ultra-lightweight model for basic tasks where speed and cost are primary concerns.',
      costPerToken: 0.00005,
      costPer1000Chars: '$0.012',
      responseTime: '100-200ms',
      contextWindow: '2K tokens',
      bestUses: [
        'Simple yes/no medical questions',
        'Basic classification tasks',
        'Quick data validation',
        'Template completion',
        'Routing queries to appropriate department'
      ],
      limitations: [
        'Very limited medical knowledge',
        'Cannot handle complex queries',
        'Minimal context understanding',
        'Best for predetermined response patterns'
      ]
    }
  }
];

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  cost?: number;
  responseTime?: number;
}

export default function LLMDemo() {
  const [selectedModel, setSelectedModel] = useState<AIModel>('llama-4-scout-17b-16e-instruct');
  const [conversations, setConversations] = useState<Record<AIModel, ConversationMessage[]>>({
    'llama-4-scout-17b-16e-instruct': [],
    'llama-3.3-70b-instruct-fp8-fast': [],
    'qwq-32b': [],
    'llama-3.2-11b-vision-instruct': [],
    'llama-3.2-3b-instruct': [],
    'llama-3.2-1b-instruct': [],
    'llama-guard-3-8b': [],
    'whisper-large-v3-turbo': [],
    'melotts': [],
    'bge-m3': [],
    'bge-reranker-base': []
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [isComparing, setIsComparing] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    const userMessage = message;
    setMessage('');
    setLastPrompt(userMessage);

    // Add user message to conversation
    const userMsg: ConversationMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    
    setConversations(prev => ({
      ...prev,
      [selectedModel]: [...(prev[selectedModel] || []), userMsg]
    }));

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
          config: { model: selectedModel }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMsg: ConversationMessage = {
          role: 'assistant',
          content: data.data,
          timestamp: Date.now(),
          cost: data.meta?.cost || 0,
          responseTime: data.meta?.responseTime || 0
        };
        
        setConversations(prev => ({
          ...prev,
          [selectedModel]: [...prev[selectedModel], assistantMsg]
        }));
        
        setTotalCost(prev => prev + (data.meta?.cost || 0));
      } else {
        // Handle rate limit errors with a more friendly message
        if (data.error.code === 'RATE_LIMIT_EXCEEDED') {
          alert('⏱️ ' + data.error.message);
        } else {
          alert('Error: ' + data.error.message);
        }
      }
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const compareAcrossModels = async () => {
    if (!lastPrompt) {
      alert('Please send a message first before comparing across models');
      return;
    }

    setIsComparing(true);
    
    // Send the same prompt to all models
    for (const { model } of DEMO_MODELS) {
      if (model !== selectedModel) {
        try {
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: lastPrompt }],
              config: { model }
            })
          });

          const data = await response.json();
          
          if (data.success) {
            const userMsg: ConversationMessage = {
              role: 'user',
              content: lastPrompt,
              timestamp: Date.now()
            };
            
            const assistantMsg: ConversationMessage = {
              role: 'assistant',
              content: data.data,
              timestamp: Date.now(),
              cost: data.meta?.cost || 0,
              responseTime: data.meta?.responseTime || 0
            };
            
            setConversations(prev => ({
              ...prev,
              [model]: [...prev[model], userMsg, assistantMsg]
            }));
            
            setTotalCost(prev => prev + (data.meta?.cost || 0));
          }
        } catch (error) {
          console.error(`Failed to get response from ${model}`);
        }
      }
    }
    
    setIsComparing(false);
  };

  const clearAllConversations = () => {
    setConversations({
      'llama-4-scout-17b-16e-instruct': [],
      'llama-3.3-70b-instruct-fp8-fast': [],
      'qwq-32b': [],
      'llama-3.2-11b-vision-instruct': [],
      'llama-3.2-3b-instruct': [],
      'llama-3.2-1b-instruct': [],
      'llama-guard-3-8b': [],
      'whisper-large-v3-turbo': [],
      'melotts': [],
      'bge-m3': [],
      'bge-reranker-base': []
    });
    setLastPrompt('');
    setTotalCost(0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              LLM Comparison Demo - Ganger Platform
            </h1>
            <div className="flex items-center space-x-4">
              {/* Cost Display */}
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <div className="text-sm text-gray-600">Total Cost</div>
                <div className="text-lg font-semibold">${totalCost.toFixed(4)}</div>
              </div>
              <button
                onClick={clearAllConversations}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Model Selection Bar */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2 overflow-x-auto">
              {DEMO_MODELS.map(({ model, name, description }) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedModel === model
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  title={description}
                >
                  {name}
                  {conversations[model].length > 0 && (
                    <span className="ml-2 text-xs">
                      ({Math.floor(conversations[model].length / 2)})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={compareAcrossModels}
              disabled={!lastPrompt || isComparing}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isComparing ? 'Comparing...' : 'Compare Last Prompt'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Selected: <strong>{DEMO_MODELS.find(m => m.model === selectedModel)?.name}</strong> - 
            {' '}{DEMO_MODELS.find(m => m.model === selectedModel)?.description}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Current Model Chat */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              Chat with {DEMO_MODELS.find(m => m.model === selectedModel)?.name}
            </h2>
            
            <div className="h-96 overflow-y-auto border rounded p-4 mb-4 bg-gray-50">
              {conversations[selectedModel].map((msg, idx) => (
                <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                          // Custom styling for markdown elements
                          h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                          p: ({children}) => <p className="mb-2">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="ml-2">{children}</li>,
                          code: ({children, ...props}) => 
                            (props as any).inline ? (
                              <code className="bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-xs">{children}</code>
                            ) : (
                              <code className="block bg-gray-100 text-gray-800 p-2 rounded text-xs overflow-x-auto">{children}</code>
                            ),
                          pre: ({children}) => <pre className="mb-2">{children}</pre>,
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-gray-300 pl-3 italic my-2">{children}</blockquote>
                          ),
                          a: ({href, children}) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                              {children}
                            </a>
                          ),
                          table: ({children}) => (
                            <div className="overflow-x-auto mb-2">
                              <table className="min-w-full border-collapse border border-gray-300">{children}</table>
                            </div>
                          ),
                          th: ({children}) => <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-left text-xs">{children}</th>,
                          td: ({children}) => <td className="border border-gray-300 px-2 py-1 text-xs">{children}</td>,
                        }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.cost !== undefined && (
                      <div className="text-xs mt-1 text-gray-500">
                        Cost: ${msg.cost.toFixed(4)} | Time: {msg.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-center text-gray-500">
                  <div className="inline-block animate-pulse">AI is thinking...</div>
                  <div className="text-xs mt-1">If capacity is full, we'll retry automatically</div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask anything to test the model..."
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          </div>

          {/* Comparison View */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Model Comparison</h2>
            <div className="h-96 overflow-y-auto border rounded p-4 bg-gray-50">
              {lastPrompt ? (
                <div className="space-y-4">
                  <div className="bg-gray-100 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700">Last Prompt:</p>
                    <p className="text-sm text-gray-900 mt-1">{lastPrompt}</p>
                  </div>
                  
                  {DEMO_MODELS.map(({ model, name }) => {
                    const modelConversation = conversations[model];
                    const lastResponse = modelConversation[modelConversation.length - 1];
                    
                    if (!lastResponse || lastResponse.role !== 'assistant') return null;
                    
                    return (
                      <div key={model} className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-medium text-sm text-gray-700">
                          {name}
                          {lastResponse.cost !== undefined && (
                            <span className="text-xs text-gray-500 ml-2">
                              (${lastResponse.cost.toFixed(4)}, {lastResponse.responseTime}ms)
                            </span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-900 mt-1">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                              h1: ({children}) => <h1 className="text-base font-bold mb-1">{children}</h1>,
                              h2: ({children}) => <h2 className="text-sm font-semibold mb-1">{children}</h2>,
                              h3: ({children}) => <h3 className="text-xs font-semibold mb-1">{children}</h3>,
                              p: ({children}) => <p className="mb-1">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-1 space-y-0.5 text-xs">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-1 space-y-0.5 text-xs">{children}</ol>,
                              li: ({children}) => <li className="ml-2">{children}</li>,
                              code: ({children, ...props}) => 
                                (props as any).inline ? (
                                  <code className="bg-gray-100 text-gray-800 px-1 rounded text-xs">{children}</code>
                                ) : (
                                  <code className="block bg-gray-100 text-gray-800 p-1 rounded text-xs overflow-x-auto">{children}</code>
                                ),
                              pre: ({children}) => <pre className="mb-1">{children}</pre>,
                              blockquote: ({children}) => (
                                <blockquote className="border-l-2 border-gray-300 pl-2 italic my-1 text-xs">{children}</blockquote>
                              ),
                              a: ({href, children}) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {children}
                                </a>
                              ),
                            }}
                            >
                              {lastResponse.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-20">
                  <p>Send a message to start comparing models</p>
                  <p className="text-sm mt-2">
                    Use the "Compare Last Prompt" button to see how different models respond
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Tips for Testing:</h3>
          <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
            <li>Try medical questions with Llama 4 Scout (optimized for healthcare)</li>
            <li>Test complex reasoning with QwQ (best for analysis)</li>
            <li>Compare response times between 1B, 3B, and larger models</li>
            <li>Notice cost differences between model sizes</li>
            <li>Try the same prompt across all models to see different approaches</li>
            <li>Rate limit: 20 requests per minute per IP address</li>
          </ul>
        </div>

        {/* Dynamic Model Information */}
        {(() => {
          const currentModel = DEMO_MODELS.find(m => m.model === selectedModel);
          if (!currentModel) return null;
          
          return (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                📊 {currentModel.name} - Model Details
              </h3>
              
              <p className="text-sm text-gray-700 mb-3">{currentModel.details.overview}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Specifications:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li><strong>Cost:</strong> {currentModel.details.costPer1000Chars} per 1000 chars</li>
                    <li><strong>Response Time:</strong> {currentModel.details.responseTime}</li>
                    <li><strong>Context Window:</strong> {currentModel.details.contextWindow}</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-blue-800 mb-2">Best Uses:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                    {currentModel.details.bestUses.slice(0, 3).map((use, idx) => (
                      <li key={idx}>{use}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {currentModel.details.medicalRelevance && (
                <div className="mb-3">
                  <h4 className="font-medium text-sm text-blue-800 mb-1">Medical Relevance:</h4>
                  <p className="text-sm text-gray-700">{currentModel.details.medicalRelevance}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-sm text-red-800 mb-1">Limitations:</h4>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-0.5">
                  {currentModel.details.limitations.map((limitation, idx) => (
                    <li key={idx}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })()}

        {/* Cost Warning */}
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Cost Considerations</h3>
          <p className="text-sm text-red-800 mb-2">
            Current pricing can reach $0.03+ per question. For production with 100 employees:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            <li>100 employees × 50 queries/day × $0.03 = $150/day ($4,500/month)</li>
            <li>Consider local LLM deployment (Ollama, LM Studio) for better ROI</li>
            <li>Use smaller models (1B, 3B) for simple tasks to reduce costs</li>
            <li>Implement caching to avoid repeated queries</li>
            <li>Set up usage quotas per user/department</li>
          </ul>
        </div>
      </div>
    </div>
  );
}