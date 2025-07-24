'use client'

import React, { useState, useEffect } from 'react';
import { 
  Button, 
  LoadingSpinner,
  Badge,
  Card
} from '@ganger/ui';
import { Select, Modal } from '@ganger/ui-catalyst';
import { 
  Alert,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Checkbox,
  Input,
  TextArea
} from '@/components/ui/placeholders';
import { 
  Wand2, 
  Eye,
  CheckCircle,
  Image as ImageIcon,
  Calendar,
  Save
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { SocialMediaPost, AdaptedContent, SocialPlatform } from '@/types';

interface ContentAdaptationModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: SocialMediaPost | null;
  onSubmitAdaptation: (adaptedContent: Partial<AdaptedContent>) => void;
  className?: string;
}

export default function ContentAdaptationModal({
  isOpen,
  onClose,
  post,
  onSubmitAdaptation,
  className = ''
}: ContentAdaptationModalProps) {
  const [activeTab, setActiveTab] = useState<'adapt' | 'preview' | 'schedule'>('adapt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adaptedContent, setAdaptedContent] = useState('');
  const [adaptedHashtags, setAdaptedHashtags] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<SocialPlatform>('instagram');
  const [preserveElements, setPreserveElements] = useState<('hashtags' | 'mentions' | 'links')[]>(['hashtags']);
  const [scheduledDate, setScheduledDate] = useState('');
  const [complianceChecked, setComplianceChecked] = useState(false);
  const [brandVoiceScore, setBrandVoiceScore] = useState(85);

  // Reset state when modal opens/closes or post changes
  useEffect(() => {
    if (isOpen && post) {
      setActiveTab('adapt');
      setAdaptedContent('');
      setAdaptedHashtags([]);
      setCustomInstructions('');
      setTargetPlatform('instagram');
      setPreserveElements(['hashtags']);
      setScheduledDate('');
      setComplianceChecked(false);
      setBrandVoiceScore(85);
    }
  }, [isOpen, post]);

  const handleGenerateAdaptation = async () => {
    if (!post) return;

    setIsGenerating(true);
    
    // Simulate AI content adaptation
    setTimeout(() => {
      // Generate adapted content based on original post
      let adapted = '';
      
      if (post.caption.toLowerCase().includes('acne')) {
        adapted = `✨ Say goodbye to acne with Ganger Dermatology! ✨

Our expert dermatologists use the latest treatments and proven methods to help you achieve the clear, healthy skin you deserve. Every patient's journey is unique, and we're here to create a personalized treatment plan just for you.

Ready to transform your skin confidence? 📞 Book your consultation today!

#GangerDermatology #ClearSkin #AcneTreatment #DermatologyExperts #HealthySkin #SkinConfidence #AnnArbor #Plymouth #Wixom`;
      } else if (post.caption.toLowerCase().includes('skincare')) {
        adapted = `🌟 Your skin deserves the best care! 🌟

At Ganger Dermatology, we believe in personalized skincare that works. Our board-certified dermatologists help you develop the perfect routine for your unique skin type and concerns.

From medical treatments to cosmetic procedures, we're your partners in achieving healthy, radiant skin that makes you feel confident every day.

Book your skin consultation today! 💙

#GangerDermatology #SkincareExperts #HealthySkin #PersonalizedCare #DermatologyLife #Michigan #SkinHealth`;
      } else if (post.caption.toLowerCase().includes('sun protection')) {
        adapted = `☀️ Sun protection is skin protection! ☀️

Dr. Ganger and our team can't stress enough: Daily SPF is your skin's best friend! Whether it's sunny or cloudy, UVA and UVB rays can cause premature aging and increase skin cancer risk.

Our top sun protection tips:
✅ Broad-spectrum SPF 30+ daily
✅ Reapply every 2 hours
✅ Seek shade during peak hours
✅ Annual skin checks with your dermatologist

Protect your skin today for beautiful skin tomorrow! 

#SunProtection #SkinCancer Prevention #SPF #GangerDermatology #SkinHealth #DermatologyAdvice`;
      } else {
        adapted = `🏥 Exceptional dermatological care at Ganger Dermatology! 🏥

Our experienced team is dedicated to providing personalized, comprehensive skin care for the whole family. From routine check-ups to advanced treatments, we're here to help you achieve your healthiest skin.

Experience the difference that expert dermatological care makes. Your skin health is our priority!

Schedule your appointment today and discover why patients trust Ganger Dermatology for all their skin care needs.

#GangerDermatology #ExpertCare #SkinHealth #Dermatology #Michigan #QualityCare`;
      }

      setAdaptedContent(adapted);
      
      // Generate Ganger-appropriate hashtags
      const gangerHashtags = [
        '#GangerDermatology',
        '#SkinHealth',
        '#DermatologyExperts',
        '#AnnArbor',
        '#Plymouth', 
        '#Wixom',
        '#Michigan',
        '#HealthySkin'
      ];
      
      // Add content-specific hashtags
      if (post.content_topics.includes('acne_treatment')) {
        gangerHashtags.push('#AcneTreatment', '#ClearSkin', '#SkinConfidence');
      }
      if (post.content_topics.includes('sun_protection')) {
        gangerHashtags.push('#SunProtection', '#SPF', '#SkinCancerPrevention');
      }
      if (post.content_topics.includes('skincare')) {
        gangerHashtags.push('#SkincareRoutine', '#PersonalizedCare', '#SkincareTips');
      }
      
      setAdaptedHashtags(gangerHashtags);
      setBrandVoiceScore(Math.floor(Math.random() * 15) + 85); // 85-100
      setIsGenerating(false);
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!post || !adaptedContent.trim()) return;

    setIsSubmitting(true);
    
    const adaptationData: Partial<AdaptedContent> = {
      original_post_id: post.id,
      original_content: post.caption,
      adapted_content: adaptedContent,
      adaptation_method: 'ai_rewrite',
      adaptation_status: 'pending',
      target_platform: targetPlatform,
      scheduled_publish_date: scheduledDate || undefined,
      ganger_brand_voice_score: brandVoiceScore,
      content_compliance_check: complianceChecked,
      adapted_hashtags: adaptedHashtags,
      adaptation_notes: customInstructions,
    };
    
    // Simulate API call
    setTimeout(() => {
      onSubmitAdaptation(adaptationData);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  const getPlatformColor = (platform: SocialPlatform) => {
    switch (platform) {
      case 'facebook':
        return 'primary';
      case 'instagram':
        return 'secondary';
      case 'twitter':
        return 'primary';
      case 'linkedin':
        return 'primary';
      case 'tiktok':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const platformOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
  ];

  if (!post) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      className={className}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">GD It! - Adapt Content for Ganger Dermatology</h2>
        {/* Original Post Display */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">
                {post.account_name} (@{post.account_handle})
              </h4>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Badge variant={getPlatformColor(post.platform)} size="sm">
                  {post.platform}
                </Badge>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.post_date), { addSuffix: true })}</span>
                <span>•</span>
                <span>{(post.engagement_rate * 100).toFixed(1)}% engagement</span>
              </div>
            </div>
            <Badge variant="success" size="sm">
              High Performance
            </Badge>
          </div>

          <p className="text-gray-700 leading-relaxed mb-3 text-sm">
            {post.caption}
          </p>

          {post.media_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {post.media_urls.slice(0, 3).map((url, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden bg-gray-200 aspect-square">
                  <Image
                    src={url}
                    alt={`Original post media ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.hashtags.slice(0, 8).map((hashtag, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {hashtag}
                </Badge>
              ))}
              {post.hashtags.length > 8 && (
                <Badge variant="secondary" size="sm">
                  +{post.hashtags.length - 8} more
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Adaptation Tabs */}
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'adapt' | 'preview' | 'schedule')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="adapt" className="flex items-center space-x-2">
              <Wand2 className="h-4 w-4" />
              <span>Adapt</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adapt" className="space-y-4">
            {/* Adaptation Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Platform
                </label>
                <Select
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value as SocialPlatform)}
                >
                  {platformOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preserve Elements
                </label>
                <div className="space-y-2">
                  {(['hashtags', 'mentions', 'links'] as const).map((element) => (
                    <Checkbox
                      key={element}
                      label={element.charAt(0).toUpperCase() + element.slice(1)}
                      checked={preserveElements.includes(element)}
                      onChange={(checked: boolean) => {
                        if (checked) {
                          setPreserveElements(prev => [...prev, element]);
                        } else {
                          setPreserveElements(prev => prev.filter(e => e !== element));
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Instructions (Optional)
              </label>
              <TextArea
                value={customInstructions}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomInstructions(e.target.value)}
                rows={2}
                placeholder="Add any specific instructions for the adaptation..."
                className="w-full"
              />
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <Button
                onClick={handleGenerateAdaptation}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    <span>GD-ing It...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    <span>GD It!</span>
                  </>
                )}
              </Button>
            </div>

            {/* Adapted Content Editor */}
            {adaptedContent && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adapted Content
                  </label>
                  <TextArea
                    value={adaptedContent}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdaptedContent(e.target.value)}
                    rows={6}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                    <span>{adaptedContent.length} characters</span>
                    <div className="flex items-center space-x-4">
                      <span>Brand Voice Score: {brandVoiceScore}/100</span>
                      <Badge variant={brandVoiceScore >= 90 ? 'success' : brandVoiceScore >= 80 ? 'warning' : 'destructive'} size="sm">
                        {brandVoiceScore >= 90 ? 'Excellent' : brandVoiceScore >= 80 ? 'Good' : 'Needs Work'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adapted Hashtags
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {adaptedHashtags.map((hashtag, index) => (
                      <Badge
                        key={index}
                        variant="primary"
                        size="sm"
                        className="cursor-pointer"
                        onClick={() => {
                          setAdaptedHashtags(prev => prev.filter((_, i) => i !== index));
                        }}
                      >
                        {hashtag}
                        <span className="ml-1 text-xs">×</span>
                      </Badge>
                    ))}
                    <Input
                      placeholder="Add hashtag..."
                      className="w-32 h-6 text-xs"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !adaptedHashtags.includes(value)) {
                            setAdaptedHashtags(prev => [...prev, value.startsWith('#') ? value : `#${value}`]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {adaptedContent ? (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Ganger Dermatology Post Preview</span>
                </h4>
                
                <Card className="p-4 border-2 border-primary-200 bg-primary-50">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                      GD
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Ganger Dermatology</h5>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant={getPlatformColor(targetPlatform)} size="sm">
                          {targetPlatform}
                        </Badge>
                        <span>•</span>
                        <span>Just now</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-3">
                    {adaptedContent}
                  </p>

                  {adaptedHashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {adaptedHashtags.map((hashtag, index) => (
                        <span key={index} className="text-primary-600 text-sm">
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-600 pt-3 border-t">
                    <span>❤️ 0</span>
                    <span>💬 0</span>
                    <span>📤 0</span>
                  </div>
                </Card>

                {/* Compliance Check */}
                <div className="mt-4">
                  <Checkbox
                    label="Content has been reviewed for medical accuracy and HIPAA compliance"
                    checked={complianceChecked}
                    onChange={setComplianceChecked}
                  />
                </div>

                {/* Quality Scores */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Card className="p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Brand Voice Score</div>
                    <div className="text-2xl font-bold text-primary-600">{brandVoiceScore}/100</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">Compliance Status</div>
                    <div className={`text-2xl font-bold ${complianceChecked ? 'text-green-600' : 'text-yellow-600'}`}>
                      {complianceChecked ? 'Verified' : 'Pending'}
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Generate adapted content to see the preview
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Publish Date (Optional)
              </label>
              <Input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to save as draft for manual publishing
              </p>
            </div>

            {scheduledDate && (
              <Alert variant="blue">
                <Calendar className="h-4 w-4" />
                <div>
                  <h5 className="font-medium">Scheduled for Publishing</h5>
                  <p className="text-sm mt-1">
                    This content will be automatically published on {new Date(scheduledDate).toLocaleString()}
                  </p>
                </div>
              </Alert>
            )}
          </TabsContent>
        </Tabs>

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
              disabled={!adaptedContent.trim() || isSubmitting}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Draft</span>
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!adaptedContent.trim() || !complianceChecked || isSubmitting}
              className="flex items-center space-x-2"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span>
                {scheduledDate ? 'Schedule Content' : 'Save to Library'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}