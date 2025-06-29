# LLM Comparison Demo

A demonstration app for the Ganger Platform AI Workers that allows users to compare responses from different Large Language Models (LLMs) side-by-side.

## Features

- **Model Selection**: Click buttons to switch between 6 different LLMs
- **Side-by-Side Comparison**: See how different models respond to the same prompt
- **Cost Tracking**: Monitor usage costs in real-time
- **Response History**: Track conversations with each model
- **One-Click Compare**: Send the same prompt to all models instantly

## Available Models

1. **Llama 4 Scout** - Medical-optimized for healthcare contexts
2. **Llama 3.3 Fast** - General-purpose fast chat
3. **QwQ Reasoning** - Complex reasoning and analysis
4. **Llama Vision** - Multimodal (text + images)
5. **Llama 3B** - Small, fast, cost-effective
6. **Llama 1B** - Micro model for simple tasks

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3020
```

## Usage Tips

- Try medical questions with Llama 4 Scout to see healthcare optimization
- Test complex reasoning with QwQ for analytical tasks
- Compare response times between 1B, 3B, and larger models
- Notice cost differences between model sizes
- Use "Compare Last Prompt" to see all models' responses at once

## Implementation Time

This demo was created in approximately 15 minutes using the pre-built AI Workers infrastructure from the `@ganger/ai` package.

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **AI Integration**: Uses `@ganger/ai` package components
- **API**: Simple Next.js API route proxies to Cloudflare Workers AI
- **State Management**: React hooks for conversation tracking
- **UI Components**: Reusable components from the AI package

## Future Enhancements

- Save and share comparison results
- Export conversation history
- Add more advanced prompt templates
- Performance benchmarking graphs
- Token usage visualization