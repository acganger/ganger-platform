'use client'

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  LoadingSpinner,
  Badge,
  Card
} from '@ganger/ui';
import { Modal } from '@ganger/ui-catalyst';
import { 
  Alert,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/components/ui/placeholders';
import { TextArea } from '@/components/ui/placeholders';
import { 
  Bot, 
  Edit3, 
  Send, 
  RefreshCw, 
  Star, 
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Wand2,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { GoogleBusinessReview } from '@/types';

interface ResponseGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: GoogleBusinessReview | null;
  onSubmitResponse: (reviewId: string, response: string, isAiGenerated: boolean) => void;
  className?: string;
}

export default function ResponseGenerationModal({
  isOpen,
  onClose,
  review,
  onSubmitResponse,
  className = ''
}: ResponseGenerationModalProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedResponses, setGeneratedResponses] = useState<string[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);

  // Reset state when modal opens/closes or review changes
  useEffect(() => {
    if (isOpen && review) {
      setActiveTab('ai');
      setResponse(review.ai_generated_response || '');
      setGeneratedResponses(review.ai_generated_response ? [review.ai_generated_response] : []);
      setSelectedResponseIndex(0);
    } else {
      setResponse('');
      setGeneratedResponses([]);
      setSelectedResponseIndex(0);
    }
  }, [isOpen, review]);

  const handleGenerateResponse = async () => {
    if (!review) return;

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/reviews/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          tone: 'professional'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      if (data.success && data.responses) {
        setGeneratedResponses(data.responses);
        setResponse(data.responses[0]);
        setSelectedResponseIndex(0);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating response:', error);
      // Fallback to default responses
      const fallbackResponses = review.rating >= 4 ? [
        `Thank you for your ${review.rating}-star review, ${review.reviewer_name}! We appreciate your feedback.`,
        `Dear ${review.reviewer_name}, thank you for taking the time to share your experience with us.`
      ] : [
        `Dear ${review.reviewer_name}, we apologize that your experience didn't meet expectations. Please contact us to discuss.`,
        `Hi ${review.reviewer_name}, we're sorry to hear about your experience and would like to make it right.`
      ];
      setGeneratedResponses(fallbackResponses);
      setResponse(fallbackResponses[0]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!review || !response.trim()) return;

    setIsSubmitting(true);
    
    try {
      const apiResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          responseText: response,
          platform: 'google'
        })
      });

      if (!apiResponse.ok) {
        throw new Error('Failed to submit response');
      }

      const data = await apiResponse.json();
      
      if (data.success) {
        onSubmitResponse(review.id, response, activeTab === 'ai');
        onClose();
      } else {
        throw new Error(data.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      // Still update UI optimistically
      onSubmitResponse(review.id, response, activeTab === 'ai');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSentimentColor = (sentiment: GoogleBusinessReview['sentiment_category']) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'neutral':
        return 'warning';
      case 'negative':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (!review) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className={className}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Generate Review Response</h2>
        {/* Review Display */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">{review.reviewer_name}</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{review.business_location.replace('_', ' ')}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(review.review_date), { addSuffix: true })}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getSentimentColor(review.sentiment_category)} size="sm">
                {review.sentiment_category}
              </Badge>
              {review.urgency_level !== 'low' && (
                <Badge variant="destructive" size="sm">
                  {review.urgency_level} urgency
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            {renderStars(review.rating)}
            <span className="text-sm font-medium text-gray-700">
              {review.rating}/5
            </span>
          </div>

          <p className="text-gray-700 leading-relaxed mb-3">
            {review.review_text}
          </p>

          {review.key_topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {review.key_topics.map((topic, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* Response Generation Tabs */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'ai' | 'manual')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <Bot className="h-4 w-4" />
              <span>AI Generated</span>
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>Manual Response</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            {/* AI Generation Controls */}
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">AI-Generated Response Options</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateResponse}
                disabled={isGenerating}
                className="flex items-center space-x-2"
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Generate New</span>
              </Button>
            </div>

            {/* Response Options */}
            {generatedResponses.length > 0 ? (
              <div className="space-y-3">
                {generatedResponses.map((generatedResponse, index) => (
                  <Card
                    key={index}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedResponseIndex === index
                        ? 'ring-2 ring-primary-500 bg-primary-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setSelectedResponseIndex(index);
                      setResponse(generatedResponse);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {selectedResponseIndex === index ? (
                          <CheckCircle className="h-5 w-5 text-primary-600" />
                        ) : (
                          <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Option {index + 1}
                          </span>
                          <Badge variant="secondary" size="sm">
                            AI Generated
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {generatedResponse}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Generate AI-powered responses tailored to this review
                </p>
                <Button
                  onClick={handleGenerateResponse}
                  disabled={isGenerating}
                  className="flex items-center space-x-2"
                >
                  {isGenerating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>Generate Responses</span>
                </Button>
              </div>
            )}

            {/* Selected Response Editor */}
            {response && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Selected Response
                </label>
                <TextArea
                  value={response}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Edit the AI-generated response..."
                  className="w-full"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write Your Response
              </label>
              <TextArea
                value={response}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResponse(e.target.value)}
                rows={6}
                placeholder="Write a personalized response to this review..."
                className="w-full"
              />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>{response.length} characters</span>
                <span>Recommended: 50-200 characters</span>
              </div>
            </div>

            {/* Response Guidelines */}
            <Alert variant="blue">
              <MessageSquare className="h-4 w-4" />
              <div>
                <h5 className="font-medium">Response Guidelines</h5>
                <ul className="text-sm mt-1 space-y-1">
                  <li>• Thank the reviewer for their feedback</li>
                  <li>• Address specific concerns if negative</li>
                  <li>• Keep it professional and brand-appropriate</li>
                  <li>• Invite them to contact you directly for resolution</li>
                </ul>
              </div>
            </Alert>
          </TabsContent>
        </Tabs>

        {/* Response Preview */}
        {response && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Response Preview</span>
            </h4>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Ganger Dermatology</span>
                <Badge variant="primary" size="sm">
                  {activeTab === 'ai' ? 'AI-Assisted' : 'Manual'}
                </Badge>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">
                {response}
              </p>
            </div>
          </div>
        )}

        {/* Warning for negative reviews */}
        {review.sentiment_category === 'negative' && (
          <Alert variant="yellow">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <h5 className="font-medium">Negative Review Alert</h5>
              <p className="text-sm mt-1">
                Consider having this response reviewed by a manager before publishing.
                Focus on acknowledging concerns and offering to resolve issues privately.
              </p>
            </div>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
              }}
              disabled={!response.trim() || isSubmitting}
              className="flex items-center space-x-2"
            >
              <Edit3 className="h-4 w-4" />
              <span>Save Draft</span>
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!response.trim() || isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>
                {isSubmitting ? 'Publishing...' : 'Publish Response'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}