'use client'

import React from 'react'
import { type Metadata } from 'next'
import { SocialsStudioLayout } from '@/components/studio/SocialsStudioLayout'
import { Container } from '@/components/studio/Container'
import { FadeIn, FadeInStagger } from '@/components/studio/FadeIn'
import { SectionIntro } from '@/components/studio/SectionIntro'
import { Star, MessageSquare, TrendingUp, BarChart3, Users, Calendar } from 'lucide-react'

// Mock data for social media performance
const socialPlatforms = [
  {
    name: 'Instagram',
    handle: '@gangerdermatology',
    followers: '2.4K',
    engagement: '4.7%',
    recent_posts: 12,
    status: 'active'
  },
  {
    name: 'Facebook',
    handle: 'Ganger Dermatology',
    followers: '1.8K',
    engagement: '3.2%',
    recent_posts: 8,
    status: 'active'
  },
  {
    name: 'LinkedIn',
    handle: 'Ganger Dermatology',
    followers: '892',
    engagement: '5.1%',
    recent_posts: 5,
    status: 'active'
  },
  {
    name: 'TikTok',
    handle: '@gangerdermatology',
    followers: '967',
    engagement: '6.8%',
    recent_posts: 15,
    status: 'monitoring'
  }
]

const recentReviews = [
  {
    platform: 'Google Business',
    rating: 5,
    author: 'Sarah M.',
    content: 'Exceptional care from Dr. Ganger and his team. Professional, knowledgeable, and caring.',
    date: '2024-01-15',
    responded: true
  },
  {
    platform: 'Google Business',
    rating: 5,
    author: 'Michael R.',
    content: 'Great experience! The staff was friendly and the office is very clean and modern.',
    date: '2024-01-14',
    responded: false
  },
  {
    platform: 'Google Business', 
    rating: 4,
    author: 'Jessica L.',
    content: 'Good service overall. Wait time was a bit long but the treatment was effective.',
    date: '2024-01-13',
    responded: true
  }
]

function PlatformCard({ platform }: { platform: typeof socialPlatforms[0] }) {
  return (
    <FadeIn>
      <div className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-neutral-950">
            {platform.name}
          </h3>
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            platform.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              platform.status === 'active' ? 'bg-green-500' : 'bg-blue-500'
            }`} />
            <span className="capitalize">{platform.status}</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-600">{platform.handle}</p>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-neutral-950">{platform.followers}</div>
            <div className="text-xs text-neutral-600">Followers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-950">{platform.engagement}</div>
            <div className="text-xs text-neutral-600">Engagement</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-neutral-950">{platform.recent_posts}</div>
            <div className="text-xs text-neutral-600">Posts (30d)</div>
          </div>
        </div>
      </div>
    </FadeIn>
  )
}

function ReviewCard({ review }: { review: typeof recentReviews[0] }) {
  return (
    <FadeIn>
      <div className="relative flex w-full flex-col rounded-3xl p-6 ring-1 ring-neutral-950/5 transition hover:bg-neutral-50 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-4 w-4 ${
                    i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'
                  }`} 
                />
              ))}
            </div>
            <span className="text-sm font-medium text-neutral-950">{review.author}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            review.responded ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {review.responded ? 'Responded' : 'Pending'}
          </div>
        </div>
        
        <p className="text-neutral-600 text-sm mb-4">"{review.content}"</p>
        
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>{review.platform}</span>
          <span>{new Date(review.date).toLocaleDateString()}</span>
        </div>
      </div>
    </FadeIn>
  )
}

function StatsSection() {
  return (
    <div className="mt-24 rounded-4xl bg-neutral-950 py-20 sm:mt-32 sm:py-32 lg:mt-56">
      <Container>
        <FadeIn className="flex items-center gap-x-8">
          <h2 className="text-center font-display text-sm font-semibold tracking-wider text-white sm:text-left">
            Real-time performance metrics
          </h2>
          <div className="h-px flex-auto bg-neutral-800" />
        </FadeIn>
        <FadeInStagger faster>
          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">4.8</div>
              <div className="text-sm text-neutral-300">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">156</div>
              <div className="text-sm text-neutral-300">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">92%</div>
              <div className="text-sm text-neutral-300">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">5.2K</div>
              <div className="text-sm text-neutral-300">Social Reach</div>
            </div>
          </div>
        </FadeInStagger>
      </Container>
    </div>
  )
}

export default function SocialsStudioHome() {
  return (
    <SocialsStudioLayout>
      <Container className="mt-24 sm:mt-32 md:mt-56">
        <FadeIn className="max-w-3xl">
          <h1 className="font-display text-5xl font-medium tracking-tight text-balance text-neutral-950 sm:text-7xl">
            Social media monitoring and reputation management.
          </h1>
          <p className="mt-6 text-xl text-neutral-600">
            Monitor your Google Business reviews and social media performance 
            in real-time. Respond quickly, adapt high-performing content, and 
            maintain your professional reputation.
          </p>
        </FadeIn>
      </Container>

      <StatsSection />

      <SectionIntro
        title="Platform Performance Overview"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Track engagement across all your social media platforms and monitor 
          how your content performs with detailed analytics and insights.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {socialPlatforms.map((platform) => (
            <PlatformCard key={platform.name} platform={platform} />
          ))}
        </FadeInStagger>
      </Container>

      <SectionIntro
        title="Recent Reviews & Feedback"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Stay on top of patient feedback with real-time review monitoring 
          and automated response tracking across all review platforms.
        </p>
      </SectionIntro>
      <Container className="mt-16">
        <FadeInStagger className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {recentReviews.map((review, index) => (
            <ReviewCard key={index} review={review} />
          ))}
        </FadeInStagger>
      </Container>

      <SectionIntro
        title="Ready to enhance your online presence?"
        className="mt-24 sm:mt-32 lg:mt-40"
      >
        <p>
          Start monitoring your reputation and optimizing your social media 
          strategy with our comprehensive analytics dashboard.
        </p>
      </SectionIntro>
    </SocialsStudioLayout>
  )
}