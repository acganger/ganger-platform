import { useState } from 'react';
import { Button } from '@ganger/ui';
import { Card } from '@ganger/ui-catalyst';
import { Checkbox, Input } from '@ganger/ui-catalyst';

interface TemplateField {
  id: string;
  type: 'text' | 'select' | 'checkbox';
  label: string;
  required: boolean;
  default?: string;
  options?: string[];
}

interface TemplateSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'list' | 'conditional';
  fields?: TemplateField[];
}

interface Template {
  id?: string;
  name: string;
  category: string;
  description: string;
  sections: TemplateSection[];
  digitalDeliveryEnabled: boolean;
  requiresPhysicianReview: boolean;
}

interface TemplateEditorProps {
  template?: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

export function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [editingTemplate, setEditingTemplate] = useState<Template>(template || {
    name: '',
    category: 'education',
    description: '',
    sections: [],
    digitalDeliveryEnabled: true,
    requiresPhysicianReview: false
  });

  const [currentSection, setCurrentSection] = useState<TemplateSection | null>(null);

  const categories = [
    { value: 'education', label: 'Patient Education' },
    { value: 'treatment', label: 'Treatment Plans' },
    { value: 'medication', label: 'Medication Information' },
    { value: 'pre_procedure', label: 'Pre-Procedure' },
    { value: 'post_procedure', label: 'Post-Procedure' }
  ];

  const addSection = () => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      content: '',
      type: 'text',
      fields: []
    };
    
    setEditingTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    
    setCurrentSection(newSection);
  };

  const updateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    setEditingTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const removeSection = (sectionId: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    
    if (currentSection?.id === sectionId) {
      setCurrentSection(null);
    }
  };

  const addField = (sectionId: string) => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false
    };

    updateSection(sectionId, {
      fields: [...(currentSection?.fields || []), newField]
    });
  };

  const handleSave = () => {
    if (!editingTemplate.name || !editingTemplate.description) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(editingTemplate);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Template Metadata */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Template Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <Input
              value={editingTemplate.name}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={editingTemplate.category}
              onChange={(e) => setEditingTemplate(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={editingTemplate.description}
            onChange={(e) => setEditingTemplate(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what this template is used for"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
            rows={3}
          />
        </div>
        
        <div className="mt-4 flex gap-4">
          <Checkbox
            checked={editingTemplate.digitalDeliveryEnabled}
            onChange={(checked) => setEditingTemplate(prev => ({ ...prev, digitalDeliveryEnabled: checked }))}
            label="Enable digital delivery (email/SMS)"
          />
          
          <Checkbox
            checked={editingTemplate.requiresPhysicianReview}
            onChange={(checked) => setEditingTemplate(prev => ({ ...prev, requiresPhysicianReview: checked }))}
            label="Requires physician review before use"
          />
        </div>
      </Card>

      {/* Template Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections List */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Template Sections</h3>
            <Button onClick={addSection} variant="primary" size="sm">
              Add Section
            </Button>
          </div>
          
          <div className="space-y-3">
            {editingTemplate.sections.map((section, index) => (
              <div
                key={section.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  currentSection?.id === section.id
                    ? 'border-handouts-primary bg-handouts-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentSection(section)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {section.title || `Section ${index + 1}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {section.type} • {section.content.length > 50 
                        ? section.content.substring(0, 50) + '...' 
                        : section.content || 'No content'}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(section.id);
                    }}
                    variant="outline"
                    size="sm"
                    className="ml-2"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            
            {editingTemplate.sections.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sections added yet. Click "Add Section" to get started.
              </div>
            )}
          </div>
        </Card>

        {/* Section Editor */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {currentSection ? 'Edit Section' : 'Select a Section'}
          </h3>
          
          {currentSection ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Title
                </label>
                <Input
                  value={currentSection.title}
                  onChange={(e) => updateSection(currentSection.id, { title: e.target.value })}
                  placeholder="Enter section title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Type
                </label>
                <select
                  value={currentSection.type}
                  onChange={(e) => updateSection(currentSection.id, { type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
                >
                  <option value="text">Text Content</option>
                  <option value="list">Bulleted List</option>
                  <option value="conditional">Conditional Content</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={currentSection.content}
                  onChange={(e) => updateSection(currentSection.id, { content: e.target.value })}
                  placeholder="Enter section content. Use {{variable_name}} for dynamic fields."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
                  rows={8}
                />
              </div>
              
              {currentSection.type === 'conditional' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Dynamic Fields
                    </label>
                    <Button
                      onClick={() => addField(currentSection.id)}
                      variant="outline"
                      size="sm"
                    >
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {currentSection.fields?.map((field) => (
                      <div key={field.id} className="p-3 border border-gray-200 rounded-md">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={field.label}
                            onChange={() => {
                              // Update field logic would go here
                            }}
                            placeholder="Field label"
                          />
                          <select
                            value={field.type}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="text">Text</option>
                            <option value="select">Dropdown</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Select a section from the left to edit its content and settings.
            </div>
          )}
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="primary">
          Save Template
        </Button>
      </div>
    </div>
  );
}