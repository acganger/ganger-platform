#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Cloudflare from 'cloudflare';

interface CloudflareConfig {
  apiToken: string;
  accountId: string;
  zoneId?: string;
}

class CloudflareLocalMCP {
  private server: Server;
  private cf: Cloudflare;
  private config: CloudflareConfig;

  constructor() {
    this.config = {
      apiToken: process.env.CLOUDFLARE_API_TOKEN!,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
      zoneId: process.env.CLOUDFLARE_ZONE_ID,
    };

    this.cf = new Cloudflare({
      apiToken: this.config.apiToken,
    });

    this.server = new Server(
      {
        name: 'cloudflare-local',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List all available tools with short names
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Workers Management (Edit permissions)
          {
            name: 'list_workers',
            description: 'List all Workers scripts',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_worker',
            description: 'Get Worker script details',
            inputSchema: {
              type: 'object',
              properties: {
                scriptName: { type: 'string', description: 'Worker script name' },
              },
              required: ['scriptName'],
            },
          },
          {
            name: 'deploy_worker',
            description: 'Initialize Worker deployment (use CLI for full deployment)',
            inputSchema: {
              type: 'object',
              properties: {
                scriptName: { type: 'string', description: 'Worker script name' },
                content: { type: 'string', description: 'Worker script content (informational)' },
              },
              required: ['scriptName'],
            },
          },
          {
            name: 'delete_worker',
            description: 'Delete Worker script',
            inputSchema: {
              type: 'object',
              properties: {
                scriptName: { type: 'string', description: 'Worker script name' },
              },
              required: ['scriptName'],
            },
          },

          // KV Storage (Edit permissions)
          {
            name: 'list_kv_ns',
            description: 'List KV namespaces',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_kv_keys',
            description: 'List keys in KV namespace',
            inputSchema: {
              type: 'object',
              properties: {
                namespaceId: { type: 'string', description: 'KV namespace ID' },
                prefix: { type: 'string', description: 'Key prefix filter' },
              },
              required: ['namespaceId'],
            },
          },
          {
            name: 'get_kv_value',
            description: 'Get KV value by key',
            inputSchema: {
              type: 'object',
              properties: {
                namespaceId: { type: 'string', description: 'KV namespace ID' },
                key: { type: 'string', description: 'Key name' },
              },
              required: ['namespaceId', 'key'],
            },
          },
          {
            name: 'set_kv_value',
            description: 'Set KV value',
            inputSchema: {
              type: 'object',
              properties: {
                namespaceId: { type: 'string', description: 'KV namespace ID' },
                key: { type: 'string', description: 'Key name' },
                value: { type: 'string', description: 'Value to store' },
                ttl: { type: 'number', description: 'TTL in seconds (optional)' },
              },
              required: ['namespaceId', 'key', 'value'],
            },
          },

          // R2 Storage (Edit permissions)
          {
            name: 'list_r2_buckets',
            description: 'List R2 buckets',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'create_r2_bucket',
            description: 'Create R2 bucket',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Bucket name' },
              },
              required: ['name'],
            },
          },

          // DNS Management (Edit permissions)
          {
            name: 'list_dns',
            description: 'List DNS records',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Record type filter (A, CNAME, etc.)' },
                name: { type: 'string', description: 'Name filter' },
              },
            },
          },
          {
            name: 'create_dns',
            description: 'Create DNS record',
            inputSchema: {
              type: 'object',
              properties: {
                type: { type: 'string', description: 'Record type (A, CNAME, MX, etc.)' },
                name: { type: 'string', description: 'Record name' },
                content: { type: 'string', description: 'Record content' },
                ttl: { type: 'number', description: 'TTL (optional, default 1)' },
              },
              required: ['type', 'name', 'content'],
            },
          },
          {
            name: 'update_dns',
            description: 'Update DNS record',
            inputSchema: {
              type: 'object',
              properties: {
                recordId: { type: 'string', description: 'DNS record ID' },
                type: { type: 'string', description: 'Record type' },
                name: { type: 'string', description: 'Record name' },
                content: { type: 'string', description: 'Record content' },
                ttl: { type: 'number', description: 'TTL (optional)' },
              },
              required: ['recordId', 'type', 'name', 'content'],
            },
          },
          {
            name: 'delete_dns',
            description: 'Delete DNS record',
            inputSchema: {
              type: 'object',
              properties: {
                recordId: { type: 'string', description: 'DNS record ID' },
              },
              required: ['recordId'],
            },
          },

          // Pages (Edit permissions)
          {
            name: 'list_pages',
            description: 'List Pages projects',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_page_deploy',
            description: 'Get Pages deployment details',
            inputSchema: {
              type: 'object',
              properties: {
                projectName: { type: 'string', description: 'Pages project name' },
              },
              required: ['projectName'],
            },
          },

          // Zone Management
          {
            name: 'list_zones',
            description: 'List zones',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_zone_info',
            description: 'Get zone details',
            inputSchema: {
              type: 'object',
              properties: {
                zoneId: { type: 'string', description: 'Zone ID (optional, uses default)' },
              },
            },
          },
          {
            name: 'purge_cache',
            description: 'Purge zone cache',
            inputSchema: {
              type: 'object',
              properties: {
                urls: { type: 'array', items: { type: 'string' }, description: 'URLs to purge (optional, purges all if empty)' },
              },
            },
          },

          // Security & Rules (Read permissions)
          {
            name: 'get_firewall',
            description: 'Get firewall rules',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_workers':
            return this.listWorkers();
          case 'get_worker':
            return this.getWorker(args?.scriptName as string);
          case 'deploy_worker':
            return this.deployWorker(args?.scriptName as string, args?.content as string);
          case 'delete_worker':
            return this.deleteWorker(args?.scriptName as string);
          case 'list_kv_ns':
            return this.listKVNamespaces();
          case 'get_kv_keys':
            return this.getKVKeys(args?.namespaceId as string, args?.prefix as string);
          case 'get_kv_value':
            return this.getKVValue(args?.namespaceId as string, args?.key as string);
          case 'set_kv_value':
            return this.setKVValue(args?.namespaceId as string, args?.key as string, args?.value as string, args?.ttl as number);
          case 'list_r2_buckets':
            return this.listR2Buckets();
          case 'create_r2_bucket':
            return this.createR2Bucket(args?.name as string);
          case 'list_dns':
            return this.listDNSRecords(args?.type as string, args?.name as string);
          case 'create_dns':
            return this.createDNSRecord(args?.type as string, args?.name as string, args?.content as string, args?.ttl as number);
          case 'update_dns':
            return this.updateDNSRecord(args?.recordId as string, args?.type as string, args?.name as string, args?.content as string, args?.ttl as number);
          case 'delete_dns':
            return this.deleteDNSRecord(args?.recordId as string);
          case 'list_pages':
            return this.listPages();
          case 'get_page_deploy':
            return this.getPageDeployment(args?.projectName as string);
          case 'list_zones':
            return this.listZones();
          case 'get_zone_info':
            return this.getZoneInfo(args?.zoneId as string);
          case 'purge_cache':
            return this.purgeCache(args?.urls as string[]);
          case 'get_firewall':
            return this.getFirewallRules();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  // Workers Methods
  private async listWorkers() {
    const workers = await this.cf.workers.scripts.list({
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(workers, null, 2),
        },
      ],
    };
  }

  private async getWorker(scriptName: string) {
    const worker = await this.cf.workers.scripts.get(scriptName, {
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(worker, null, 2),
        },
      ],
    };
  }

  private async deployWorker(scriptName: string, content: string) {
    // For now, we'll use a simpler approach that works with the SDK
    // The user can deploy workers via CLI or dashboard for complex deployments
    const result = await this.cf.workers.scripts.update(scriptName, {
      account_id: this.config.accountId,
    } as any);
    
    return {
      content: [
        {
          type: 'text',
          text: `Worker deployment initiated for ${scriptName}. Note: Use Cloudflare CLI or dashboard for full script deployment with content.`,
        },
      ],
    };
  }

  private async deleteWorker(scriptName: string) {
    await this.cf.workers.scripts.delete(scriptName, {
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Worker ${scriptName} deleted successfully`,
        },
      ],
    };
  }

  // KV Methods
  private async listKVNamespaces() {
    const namespaces = await this.cf.kv.namespaces.list({
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(namespaces, null, 2),
        },
      ],
    };
  }

  private async getKVKeys(namespaceId: string, prefix?: string) {
    const keys = await this.cf.kv.namespaces.keys.list(namespaceId, {
      account_id: this.config.accountId,
      prefix,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(keys, null, 2),
        },
      ],
    };
  }

  private async getKVValue(namespaceId: string, key: string) {
    const value = await this.cf.kv.namespaces.values.get(namespaceId, key, {
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: String(value),
        },
      ],
    };
  }

  private async setKVValue(namespaceId: string, key: string, value: string, ttl?: number) {
    const params: any = {
      account_id: this.config.accountId,
      body: value,
    };
    
    if (ttl) {
      params.metadata = JSON.stringify({ ttl });
    }
    
    await this.cf.kv.namespaces.values.update(namespaceId, key, params);
    return {
      content: [
        {
          type: 'text',
          text: `KV value set: ${key} = ${value}`,
        },
      ],
    };
  }

  // R2 Methods
  private async listR2Buckets() {
    const buckets = await this.cf.r2.buckets.list({
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(buckets, null, 2),
        },
      ],
    };
  }

  private async createR2Bucket(name: string) {
    const bucket = await this.cf.r2.buckets.create({
      account_id: this.config.accountId,
      name,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(bucket, null, 2),
        },
      ],
    };
  }

  // DNS Methods
  private async listDNSRecords(type?: string, name?: string) {
    if (!this.config.zoneId) {
      throw new Error('Zone ID required for DNS operations');
    }
    const records = await this.cf.dns.records.list({
      zone_id: this.config.zoneId,
      type: type as any,
      name,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(records, null, 2),
        },
      ],
    };
  }

  private async createDNSRecord(type: string, name: string, content: string, ttl?: number) {
    if (!this.config.zoneId) {
      throw new Error('Zone ID required for DNS operations');
    }
    const record = await this.cf.dns.records.create({
      zone_id: this.config.zoneId,
      type: type as any,
      name,
      content,
      ttl: ttl || 1,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(record, null, 2),
        },
      ],
    };
  }

  private async updateDNSRecord(recordId: string, type: string, name: string, content: string, ttl?: number) {
    if (!this.config.zoneId) {
      throw new Error('Zone ID required for DNS operations');
    }
    const record = await this.cf.dns.records.update(recordId, {
      zone_id: this.config.zoneId,
      type: type as any,
      name,
      content,
      ttl,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(record, null, 2),
        },
      ],
    };
  }

  private async deleteDNSRecord(recordId: string) {
    if (!this.config.zoneId) {
      throw new Error('Zone ID required for DNS operations');
    }
    await this.cf.dns.records.delete(recordId, {
      zone_id: this.config.zoneId,
    });
    return {
      content: [
        {
          type: 'text',
          text: `DNS record ${recordId} deleted successfully`,
        },
      ],
    };
  }

  // Pages Methods
  private async listPages() {
    const projects = await this.cf.pages.projects.list({
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(projects, null, 2),
        },
      ],
    };
  }

  private async getPageDeployment(projectName: string) {
    const deployments = await this.cf.pages.projects.deployments.list(projectName, {
      account_id: this.config.accountId,
    });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(deployments, null, 2),
        },
      ],
    };
  }

  // Zone Methods
  private async listZones() {
    const zones = await this.cf.zones.list();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(zones, null, 2),
        },
      ],
    };
  }

  private async getZoneInfo(zoneId?: string) {
    const targetZoneId = zoneId || this.config.zoneId;
    if (!targetZoneId) {
      throw new Error('Zone ID required');
    }
    const zone = await this.cf.zones.get({ zone_id: targetZoneId });
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(zone, null, 2),
        },
      ],
    };
  }

  private async purgeCache(urls?: string[]) {
    if (!this.config.zoneId) {
      throw new Error('Zone ID required for cache purge');
    }
    
    let purgeParams: any = { zone_id: this.config.zoneId };
    
    if (urls && urls.length > 0) {
      purgeParams.files = urls;
    } else {
      purgeParams.purge_everything = true;
    }

    const result = await this.cf.cache.purge(purgeParams);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // Security Methods
  private async getFirewallRules() {
    if (!this.config.zoneId) {
      throw new Error('Zone ID required for firewall rules');
    }
    const rules = await this.cf.firewall.rules.list(this.config.zoneId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(rules, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cloudflare Local MCP server running on stdio');
  }
}

const server = new CloudflareLocalMCP();
server.run().catch(console.error);