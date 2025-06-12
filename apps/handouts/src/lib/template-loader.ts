import { supabase } from './supabase';
import { HandoutTemplate, TemplateContent, ConditionalRule } from '@/types/handouts';

// Template storage interface for legacy JSON templates
interface LegacyTemplate {
  id: string;
  name: string;
  category: string;
  description?: string;
  version?: string;
  digital_delivery_enabled?: boolean;
  template?: TemplateContent;
  content?: any[];
  fill_in_fields?: any[];
  fields?: any[];
  conditionalLogic?: ConditionalRule[];
  outputConfig?: any;
}

export class TemplateLoader {
  private static templateCache: Map<string, HandoutTemplate> = new Map();
  private static legacyTemplates: LegacyTemplate[] = [];

  /**
   * Load all legacy templates from the migration assets
   */
  static async loadLegacyTemplates(): Promise<LegacyTemplate[]> {
    if (this.legacyTemplates.length > 0) {
      return this.legacyTemplates;
    }

    try {
      // In a real implementation, these would be loaded from the migration assets
      // For now, we'll use the templates we know exist from the PRD
      const templateIds = [
        'acne-handout-kf',
        'acne-treatment-regimen', 
        'eczema-treatment-regimen',
        'isotretinoin-female-handout',
        'patch-testing',
        'rosacea-handout',
        'sun-protection-recommendations',
        'vinegar-soak-nails',
        'static-wound-care',
        'static-psoriasis'
      ];

      const templates: LegacyTemplate[] = [];

      for (const templateId of templateIds) {
        try {
          // Mock template data based on what we know from the migration
          const mockTemplate = this.createMockTemplate(templateId);
          templates.push(mockTemplate);
        } catch (error) {
        }
      }

      this.legacyTemplates = templates;
      return templates;
    } catch (error) {
      return [];
    }
  }

  /**
   * Load a specific template by ID
   */
  static async loadTemplate(templateId: string): Promise<HandoutTemplate | null> {
    // Check cache first
    if (this.templateCache.has(templateId)) {
      return this.templateCache.get(templateId)!;
    }

    try {
      // Try to load from database first
      const { data: dbTemplate, error } = await supabase
        .from('handout_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (dbTemplate && !error) {
        this.templateCache.set(templateId, dbTemplate);
        return dbTemplate;
      }

      // Fall back to legacy templates
      const legacyTemplates = await this.loadLegacyTemplates();
      const legacyTemplate = legacyTemplates.find(t => t.id === templateId);
      
      if (legacyTemplate) {
        const converted = this.convertLegacyTemplate(legacyTemplate);
        this.templateCache.set(templateId, converted);
        return converted;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load all available templates
   */
  static async loadAllTemplates(): Promise<HandoutTemplate[]> {
    try {
      // Load from database
      const { data: dbTemplates, error } = await supabase
        .from('handout_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      const templates: HandoutTemplate[] = dbTemplates || [];

      // Also include legacy templates that haven't been migrated
      const legacyTemplates = await this.loadLegacyTemplates();
      
      for (const legacyTemplate of legacyTemplates) {
        // Only include if not already in database
        const existsInDb = templates.some(t => t.legacy_template_id === legacyTemplate.id);
        if (!existsInDb) {
          const converted = this.convertLegacyTemplate(legacyTemplate);
          templates.push(converted);
        }
      }

      // Cache all templates
      templates.forEach(template => {
        this.templateCache.set(template.id, template);
      });

      return templates;
    } catch (error) {
      return [];
    }
  }

  /**
   * Convert legacy template format to modern format
   */
  private static convertLegacyTemplate(legacy: LegacyTemplate): HandoutTemplate {
    const now = new Date().toISOString();
    
    return {
      id: `legacy_${legacy.id}`,
      template_name: legacy.name,
      category: this.mapLegacyCategory(legacy.category),
      subcategory: undefined,
      description: legacy.description || `Legacy template: ${legacy.name}`,
      template_type: this.inferTemplateType(legacy),
      template_content: this.convertLegacyContent(legacy),
      fill_in_fields: legacy.fill_in_fields || legacy.fields || [],
      conditional_logic: legacy.conditionalLogic || [],
      validation_rules: [],
      complexity_level: this.inferComplexity(legacy),
      estimated_completion_time: this.estimateCompletionTime(legacy),
      provider_specific: false,
      location_specific: undefined,
      specialty_tags: [legacy.category],
      digital_delivery_enabled: legacy.digital_delivery_enabled !== false,
      requires_physician_review: false,
      medical_specialty: 'dermatology',
      language_code: 'en-US',
      is_active: true,
      version_number: 1,
      parent_template_id: undefined,
      approval_status: 'approved',
      approved_by: undefined,
      approved_at: undefined,
      source_file: `${legacy.id}.json`,
      legacy_template_id: legacy.id,
      migration_notes: 'Converted from legacy JSON template',
      created_by: 'system',
      last_modified_by: 'system',
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Create mock template data for known templates
   */
  private static createMockTemplate(templateId: string): LegacyTemplate {
    const templates: Record<string, LegacyTemplate> = {
      'acne-handout-kf': {
        id: 'acne-handout-kf',
        name: 'Acne Treatment Plan (Complex)',
        category: 'treatment',
        description: 'Comprehensive acne treatment with 14 conditional medication options',
        digital_delivery_enabled: true,
        content: [
          {
            type: 'section',
            title: 'Treatment Overview',
            content: 'This personalized treatment plan has been created for {{patient_first_name}} {{patient_last_name}}.'
          },
          {
            type: 'conditional_checklist',
            items: [
              {
                id: 'benzoyl_peroxide_wash',
                content: 'Wash affected areas with {{benzoyl_peroxide_percent}}% benzoyl peroxide cleanser {{wash_frequency}} daily',
                fields: [
                  { id: 'benzoyl_peroxide_percent', type: 'select', label: 'Benzoyl Peroxide %', required: true, options: ['2.5', '5', '10'] },
                  { id: 'wash_frequency', type: 'select', label: 'Frequency', required: true, options: ['once', 'twice'] }
                ]
              }
            ]
          }
        ],
        fill_in_fields: [
          { id: 'benzoyl_peroxide_percent', type: 'select', label: 'Benzoyl Peroxide Percentage', required: true },
          { id: 'wash_frequency', type: 'select', label: 'Wash Frequency', required: true }
        ]
      },
      'sun-protection-recommendations': {
        id: 'sun-protection-recommendations',
        name: 'Sun Protection Guidelines',
        category: 'education',
        description: 'UV protection and skin cancer prevention guidelines',
        digital_delivery_enabled: true,
        content: [
          {
            type: 'section',
            title: 'UV Protection Basics',
            content: [
              'Use SPF 30 or higher sunscreen daily',
              'Reapply every 2 hours when outdoors', 
              'Wear protective clothing and wide-brimmed hats',
              'Seek shade during peak hours (10 AM - 4 PM)'
            ]
          }
        ],
        fill_in_fields: []
      },
      'patch-testing': {
        id: 'patch-testing',
        name: 'Patch Testing Instructions',
        category: 'pre_procedure',
        description: 'Pre-procedure preparation for allergy testing',
        digital_delivery_enabled: true,
        content: [
          {
            type: 'section',
            title: 'Before Your Appointment',
            content: 'Please follow these instructions before your patch testing appointment.'
          }
        ],
        fill_in_fields: []
      },
      'vinegar-soak-nails': {
        id: 'vinegar-soak-nails',
        name: 'Vinegar Soaks for Nails',
        category: 'treatment',
        description: 'Simple nail treatment instructions using vinegar soaks',
        digital_delivery_enabled: true,
        content: [
          {
            type: 'section',
            title: 'Vinegar Soak Recipe',
            content: [
              '1 part white vinegar',
              '3 parts water',
              'Submerge nails for 10-15 minutes'
            ]
          }
        ],
        fill_in_fields: []
      }
    };

    return templates[templateId] || {
      id: templateId,
      name: templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: 'education',
      description: `Template for ${templateId}`,
      digital_delivery_enabled: true,
      content: [],
      fill_in_fields: []
    };
  }

  private static mapLegacyCategory(category: string): 'education' | 'treatment' | 'medication' | 'pre_procedure' | 'post_procedure' {
    const mapping: Record<string, any> = {
      'education': 'education',
      'treatment': 'treatment',
      'medication': 'medication',
      'pre_procedure': 'pre_procedure',
      'post_procedure': 'post_procedure'
    };
    return mapping[category] || 'education';
  }

  private static inferTemplateType(legacy: LegacyTemplate): 'static' | 'dynamic' | 'conditional' {
    const hasFields = (legacy.fill_in_fields?.length || 0) > 0 || (legacy.fields?.length || 0) > 0;
    const hasConditional = (legacy.conditionalLogic?.length || 0) > 0 || 
                          legacy.content?.some((c: any) => c.type === 'conditional_checklist');
    
    if (hasConditional) return 'conditional';
    if (hasFields) return 'dynamic';
    return 'static';
  }

  private static inferComplexity(legacy: LegacyTemplate): 1 | 2 | 3 {
    const fieldCount = (legacy.fill_in_fields?.length || 0) + (legacy.fields?.length || 0);
    const hasConditional = (legacy.conditionalLogic?.length || 0) > 0;
    
    if (hasConditional || fieldCount > 8) return 3; // Complex
    if (fieldCount > 3) return 2; // Moderate
    return 1; // Simple
  }

  private static estimateCompletionTime(legacy: LegacyTemplate): number {
    const complexity = this.inferComplexity(legacy);
    const baseTime = complexity === 3 ? 5 : complexity === 2 ? 3 : 1;
    return baseTime;
  }

  private static convertLegacyContent(legacy: LegacyTemplate): TemplateContent {
    return {
      sections: legacy.content?.map((section: any, index: number) => ({
        id: `section_${index}`,
        type: section.type || 'static_text',
        title: section.title,
        content: Array.isArray(section.content) ? section.content.join('\n') : section.content,
        items: section.items,
        fields: section.fields
      })) || []
    };
  }

  /**
   * Clear template cache
   */
  static clearCache(): void {
    this.templateCache.clear();
    this.legacyTemplates = [];
  }
}