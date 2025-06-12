# Socials & Reviews Management

A comprehensive dashboard for managing Google Business Reviews and social media monitoring for Ganger Dermatology locations.

## Features

- **Review Management**: Monitor and respond to Google Business Reviews across all locations
- **Social Media Monitoring**: Track high-performing posts from competitor dermatology practices  
- **AI Content Adaptation**: "GD It" button to adapt competitor content for Ganger brand
- **Real-time Updates**: Live notifications for new reviews and social posts
- **Response Generation**: AI-powered response drafting with practice voice/tone
- **Content Library**: Manage adapted social media content

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run tests
npm run test
```

## Architecture

Built with:
- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: @ganger/ui (mandatory component library)
- **Authentication**: @ganger/auth
- **Real-time**: Supabase WebSocket subscriptions
- **Performance**: Virtualized lists, skeleton loading states
- **Accessibility**: WCAG 2.1 AA compliance

## Locations Monitored

- **Ann Arbor**: Primary location reviews and social monitoring
- **Plymouth**: Secondary location coverage
- **Wixom**: Tertiary location tracking