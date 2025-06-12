import { useState, useEffect } from 'react';
import { Button, Card, Checkbox, Input } from '@ganger/ui';
import { useHandoutContext } from '@/lib/handout-context';

interface TemplateSelectorProps {
  onSelectionChange: (templateIds: string[]) => void;
  selectedTemplates: string[];
}

const categoryColors = {
  education: 'handouts-education',
  treatment: 'handouts-treatment', 
  medication: 'handouts-medication',
  pre_procedure: 'handouts-procedure',
  post_procedure: 'handouts-procedure'
};

const categoryLabels = {
  education: 'Patient Education',
  treatment: 'Treatment Plans',
  medication: 'Medication Information',
  pre_procedure: 'Pre-Procedure',
  post_procedure: 'Post-Procedure'
};

export function TemplateSelector({ onSelectionChange, selectedTemplates }: TemplateSelectorProps) {
  const { state, loadTemplates } = useHandoutContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = state.templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(state.templates.map(t => t.category)));

  const handleTemplateToggle = (templateId: string) => {
    const newSelection = selectedTemplates.includes(templateId)
      ? selectedTemplates.filter(id => id !== templateId)
      : [...selectedTemplates, templateId];
    
    onSelectionChange(newSelection);
  };

  const getComplexityBadge = (complexity: string) => {
    const colors = {
      simple: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      complex: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[complexity as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {complexity}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Select Handout Templates</h3>
        
        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-handouts-primary focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </option>
            ))}
          </select>
        </div>

        {/* Selected Templates Count */}
        {selectedTemplates.length > 0 && (
          <div className="mb-4 p-3 bg-handouts-primary/10 border border-handouts-primary/20 rounded-md">
            <p className="text-sm text-handouts-primary font-medium">
              {selectedTemplates.length} template{selectedTemplates.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}

        {/* Template Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedTemplates.includes(template.id)
                  ? 'ring-2 ring-handouts-primary border-handouts-primary'
                  : 'border-gray-200'
              }`}
              onClick={() => handleTemplateToggle(template.id)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedTemplates.includes(template.id)}
                  onChange={() => handleTemplateToggle(template.id)}
                  className="mt-1"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900 truncate">
                      {template.name}
                    </h4>
                    {getComplexityBadge(template.complexity)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full bg-${categoryColors[template.category as keyof typeof categoryColors]}/10 text-${categoryColors[template.category as keyof typeof categoryColors]}`}>
                      {categoryLabels[template.category as keyof typeof categoryLabels] || template.category}
                    </span>
                    
                    <span>
                      ~{template.estimatedTime} min
                    </span>
                  </div>
                  
                  {template.digitalDeliveryEnabled && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Digital delivery available
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm || selectedCategory !== 'all' ? 
              'No templates found matching your criteria.' :
              'No templates available.'
            }
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="text-sm text-gray-600">
          {selectedTemplates.length > 0 && (
            <span>
              Estimated generation time: {
                state.templates
                  .filter(t => selectedTemplates.includes(t.id))
                  .reduce((total, t) => total + t.estimatedTime, 0)
              } minutes
            </span>
          )}
        </div>
        
        <div className="space-x-2">
          {selectedTemplates.length > 0 && (
            <Button
              onClick={() => onSelectionChange([])}
              variant="outline"
              size="sm"
            >
              Clear Selection
            </Button>
          )}
          
          <Button
            onClick={() => onSelectionChange(selectedTemplates)}
            disabled={selectedTemplates.length === 0}
            variant="primary"
          >
            Continue with {selectedTemplates.length} Template{selectedTemplates.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}