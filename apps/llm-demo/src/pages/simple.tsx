import React, { useState } from 'react';

const MODELS = [
  { id: 'llama-3.2-1b-instruct', name: 'Llama 1B', description: 'Fastest, cheapest' },
  { id: 'llama-3.2-3b-instruct', name: 'Llama 3B', description: 'Fast, balanced' },
  { id: 'llama-4-scout-17b-16e-instruct', name: 'Llama Scout', description: 'Medical optimized' },
  { id: 'qwq-32b', name: 'QwQ', description: 'Complex reasoning' },
];

export default function SimpleLLMDemo() {
  const [selectedModel, setSelectedModel] = useState('llama-3.2-1b-instruct');
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Record<string, Array<{role: string, content: string}>>>({});
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    const userMessage = message;
    setMessage('');

    // Add user message to conversation
    setConversations(prev => ({
      ...prev,
      [selectedModel]: [...(prev[selectedModel] || []), { role: 'user', content: userMessage }]
    }));

    try {
      const response = await fetch('/api/ai/chat-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setConversations(prev => ({
          ...prev,
          [selectedModel]: [...prev[selectedModel], { role: 'assistant', content: data.data }]
        }));
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

  const compareAll = async () => {
    const lastUserMessage = conversations[selectedModel]?.filter(m => m.role === 'user').pop()?.content;
    if (!lastUserMessage) {
      alert('Send a message first!');
      return;
    }

    for (const model of MODELS) {
      if (model.id === selectedModel) continue;
      
      try {
        const response = await fetch('/api/ai/chat-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model.id,
            messages: [{ role: 'user', content: lastUserMessage }]
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setConversations(prev => ({
            ...prev,
            [model.id]: [
              ...(prev[model.id] || []),
              { role: 'user', content: lastUserMessage },
              { role: 'assistant', content: data.data }
            ]
          }));
        }
      } catch (error) {
        console.error(`Failed to get response from ${model.name}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-4">Simple LLM Comparison Demo</h1>
      
      {/* Model Selection */}
      <div className="flex gap-2 mb-4">
        {MODELS.map(model => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className={`px-4 py-2 rounded ${
              selectedModel === model.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            {model.name}
            <div className="text-xs opacity-75">{model.description}</div>
          </button>
        ))}
        <button
          onClick={compareAll}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-auto"
        >
          Compare All
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Chat with {MODELS.find(m => m.id === selectedModel)?.name}</h2>
          
          <div className="h-96 overflow-y-auto border rounded p-2 mb-2">
            {(conversations[selectedModel] || []).map((msg, idx) => (
              <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded ${
                  msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-center text-gray-500">AI is thinking...</div>}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
        </div>

        {/* Comparison View */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-2">Model Comparison</h2>
          <div className="h-96 overflow-y-auto space-y-2">
            {MODELS.map(model => {
              const lastResponse = conversations[model.id]?.filter(m => m.role === 'assistant').pop();
              if (!lastResponse) return null;
              
              return (
                <div key={model.id} className="border-l-4 border-blue-500 pl-2">
                  <div className="font-medium text-sm">{model.name}</div>
                  <div className="text-sm text-gray-700">{lastResponse.content}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}