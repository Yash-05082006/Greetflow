import React, { useState } from 'react';
import { X, Wand2, Sparkles, Loader, CheckCircle } from 'lucide-react';
import { Template } from '../types';

interface AITemplateGeneratorProps {
  onClose: () => void;
  onGenerate: (template: Omit<Template, 'id' | 'usageCount'>) => void;
}

const AITemplateGenerator: React.FC<AITemplateGeneratorProps> = ({ onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting'>('Birthday');
  const [ageGroup, setAgeGroup] = useState<'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)'>('Adults (18+)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<Template | null>(null);

  const promptSuggestions = {
    'Birthday': [
      'Create a birthday template for a music lover',
      'Design a birthday card for a sports enthusiast',
      'Make a birthday template for a travel blogger',
      'Create a birthday design for a tech professional'
    ],
    'Anniversary': [
      'Design an anniversary card for a couple who loves cooking',
      'Create an anniversary template for outdoor enthusiasts',
      'Make an anniversary card for art lovers',
      'Design an anniversary template for a business couple'
    ],
    'Event Invitation': [
      'Create an invitation for a corporate networking event',
      'Design an invitation for a creative workshop',
      'Make an invitation for a charity fundraiser',
      'Create an invitation for a product launch'
    ],
    'Greeting': [
      'Design a warm greeting for a new client',
      'Create a thank you message for loyal customers',
      'Make a seasonal greeting for business partners',
      'Design a motivational message for team members'
    ]
  };

  const generateMockTemplate = (promptText: string, cat: string, age: string): Template => {
    // Simple mock template generation - in production this would call an AI API
    const designs = [
      { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff', fontFamily: 'Arial, sans-serif' },
      { background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', textColor: '#ffffff', fontFamily: 'Georgia, serif' },
      { background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', textColor: '#ffffff', fontFamily: 'Verdana, sans-serif' }
    ];
    
    return {
      id: `ai-${Date.now()}`,
      name: `AI Generated ${cat} Template`,
      category: cat as any,
      ageGroup: age as any,
      content: `<div style="padding: 20px; text-align: center;"><h2>Dear [Name],</h2><p>${promptText}</p><p>[Message]</p><p>Best wishes!</p></div>`,
      description: `AI-generated template based on: ${promptText}`,
      design: designs[Math.floor(Math.random() * designs.length)],
      usageCount: 0
    };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const template = generateMockTemplate(prompt.trim(), category, ageGroup);
      setGeneratedTemplate(template);
    } catch (error) {
      console.error('Failed to generate template:', error);
      alert('Failed to generate template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedTemplate) {
      onGenerate({
        name: generatedTemplate.name,
        category: generatedTemplate.category,
        ageGroup: generatedTemplate.ageGroup,
        content: generatedTemplate.content,
        description: generatedTemplate.description,
        design: generatedTemplate.design
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">AI Template Generator</h3>
                <p className="text-purple-100">Create unique templates with artificial intelligence</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {!generatedTemplate ? (
            <div className="space-y-8">
              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Template Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  >
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Event Invitation">Event Invitation</option>
                    <option value="Greeting">Greeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">Target Age Group</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  >
                    <option value="Children (8-15)">Children (8-15)</option>
                    <option value="Teens (15-18)">Teens (15-18)</option>
                    <option value="Adults (18+)">Adults (18+)</option>
                  </select>
                </div>
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Describe Your Template
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                  placeholder="Describe the template you want to create. Be specific about the theme, style, or target audience..."
                />
                <p className="mt-2 text-sm text-gray-500">
                  💡 Be specific! Example: "Create a birthday template for a finance student with modern, professional styling"
                </p>
              </div>

              {/* Prompt Suggestions */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Suggested Prompts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {promptSuggestions[category].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(suggestion)}
                      className="text-left p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-300 border border-purple-200 hover:border-purple-300"
                    >
                      <p className="text-sm text-purple-800 font-medium">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className={`flex items-center space-x-2 px-8 py-3 rounded-xl transition-all duration-300 font-medium ${
                    prompt.trim() && !isGenerating
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Generated Template Preview */
            <div className="space-y-8">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Template Generated Successfully!</h3>
                <p className="text-gray-600">Your AI-generated template is ready to use</p>
              </div>

              {/* Template Preview */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Preview</h4>
                <div className="bg-white rounded-xl p-4 shadow-inner border-2 border-dashed border-gray-300">
                  <div 
                    className="rounded-xl overflow-hidden shadow-lg"
                    style={{ 
                      minHeight: '400px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div 
                      className="w-full max-w-md"
                      dangerouslySetInnerHTML={{ 
                        __html: generatedTemplate.content
                          .replace(/\[Name\]/g, 'John Doe')
                          .replace(/\[Message\]/g, 'This is a sample personalized message that will be customized for each recipient!')
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Template Details */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Template Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Name</p>
                    <p className="text-gray-900 font-semibold">{generatedTemplate.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Category</p>
                    <p className="text-gray-900 font-semibold">{generatedTemplate.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Age Group</p>
                    <p className="text-gray-900 font-semibold">{generatedTemplate.ageGroup}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Font Family</p>
                    <p className="text-gray-900 font-semibold">{generatedTemplate.design.fontFamily}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900">{generatedTemplate.description}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setGeneratedTemplate(null)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITemplateGenerator;