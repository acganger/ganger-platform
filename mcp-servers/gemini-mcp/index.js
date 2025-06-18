#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Create the server
const server = new Server(
  {
    name: 'gemini-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_text',
        description: 'Generate text using Google Gemini AI',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt to send to Gemini',
            },
            model: {
              type: 'string',
              description: 'The Gemini model to use (default: gemini-1.5-flash)',
              default: 'gemini-1.5-flash',
            },
            temperature: {
              type: 'number',
              description: 'Temperature for generation (0-2)',
              minimum: 0,
              maximum: 2,
              default: 1,
            },
            maxTokens: {
              type: 'number',
              description: 'Maximum number of tokens to generate',
              default: 8192,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'analyze_image',
        description: 'Analyze an image using Gemini Vision',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The prompt/question about the image',
            },
            imageUrl: {
              type: 'string',
              description: 'URL of the image to analyze',
            },
            imageData: {
              type: 'string',
              description: 'Base64 encoded image data (alternative to imageUrl)',
            },
            model: {
              type: 'string',
              description: 'The Gemini model to use (default: gemini-1.5-flash)',
              default: 'gemini-1.5-flash',
            },
          },
          required: ['prompt'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'generate_text': {
        const { prompt, model = 'gemini-1.5-flash', temperature = 1, maxTokens = 8192 } = args;
        
        const geminiModel = genAI.getGenerativeModel({ 
          model,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        });
        
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        return {
          content: [
            {
              type: 'text',
              text: text,
            },
          ],
        };
      }

      case 'analyze_image': {
        const { prompt, imageUrl, imageData, model = 'gemini-1.5-flash' } = args;
        
        const geminiModel = genAI.getGenerativeModel({ model });
        
        let imagePart;
        if (imageData) {
          // Handle base64 image data
          imagePart = {
            inlineData: {
              data: imageData,
              mimeType: 'image/jpeg', // Assume JPEG, could be enhanced
            },
          };
        } else if (imageUrl) {
          // For URLs, we'd need to fetch and convert to base64
          // This is a simplified version
          throw new Error('Image URL support not yet implemented. Please use base64 imageData instead.');
        } else {
          throw new Error('Either imageUrl or imageData must be provided');
        }
        
        const result = await geminiModel.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
        return {
          content: [
            {
              type: 'text',
              text: text,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Error handling
process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gemini MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});