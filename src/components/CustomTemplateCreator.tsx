import React, { useState } from 'react';
import { X, Save, Eye, Palette } from 'lucide-react';
import { Template } from '../types';

interface CustomTemplateCreatorProps {
  onClose: () => void;
  onSave: (template: Omit<Template, 'id' | 'usageCount'>) => void;
}

const CustomTemplateCreator: React.FC<CustomTemplateCreatorProps> = ({ onClose, onSave }) => {
  const [templateData, setTemplateData] = useState({
    name: '',
    category: 'Birthday' as 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting',
    ageGroup: 'Adults (18+)' as 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)',
    description: '',
    content: '',
    design: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }
  });

  const [showPreview, setShowPreview] = useState(false);

  const backgroundOptions = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  ];

  const fontOptions = [
    'Arial, sans-serif',
    'Georgia, serif',
    'Helvetica Neue, Arial, sans-serif',
    'Times New Roman, serif',
    'Verdana, sans-serif',
    'Playfair Display, Georgia, serif',
    'Montserrat, Arial, sans-serif',
    'Inter, -apple-system, sans-serif'
  ];

  const generateDefaultContent = () => {
    const defaultContent = `
      <div style="background: ${templateData.design.background}; padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: '${templateData.design.fontFamily}';">
        <div style="background: rgba(255,255,255,0.95); padding: 35px; border-radius: 15px; color: #2c3e50;">
          <div style="width: 80px; height: 80px; background: ${templateData.design.background}; border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🎉</div>
          <h1 style="font-size: 36px; margin-bottom: 20px; font-weight: 600; color: #2c3e50;">${templateData.category === 'Birthday' ? 'Happy Birthday' : templateData.category === 'Anniversary' ? 'Happy Anniversary' : templateData.category === 'Greeting' ? 'Hello' : 'You\'re Invited'}</h1>
          <h2 style="font-size: 42px; margin-bottom: 25px; font-weight: 800; background: ${templateData.design.background}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <div style="width: 60px; height: 2px; background: ${templateData.design.background}; margin: 25px auto;"></div>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 400;">
            ${templateData.category === 'Birthday' ? 'Wishing you a day filled with happiness and joy!' : 
              templateData.category === 'Anniversary' ? 'Celebrating another beautiful year together!' :
              templateData.category === 'Greeting' ? 'Sending you warm wishes and positive thoughts!' :
              'Join us for a special celebration!'}
          </p>
          <div style="background: linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #667eea;">✨ 🌟 🎊</div>
        </div>
      </div>
    `;
    setTemplateData({ ...templateData, content: defaultContent.trim() });
  };

  const handleSave = () => {
    if (!templateData.name.trim() || !templateData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      name: templateData.name,
      category: templateData.category,
      ageGroup: templateData.ageGroup,
      content: templateData.content,
      description: templateData.description,
      design: templateData.design
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Palette className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Custom Template Creator</h3>
                <p className="text-indigo-100">Design your own unique template</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Template Configuration */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Template Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter template name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                    <select
                      value={templateData.category}
                      onChange={(e) => setTemplateData({ ...templateData, category: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    >
                      <option value="Birthday">Birthday</option>
                      <option value="Anniversary">Anniversary</option>
                      <option value="Event Invitation">Event Invitation</option>
                      <option value="Greeting">Greeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Age Group *</label>
                    <select
                      value={templateData.ageGroup}
                      onChange={(e) => setTemplateData({ ...templateData, ageGroup: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    >
                      <option value="Children (8-15)">Children (8-15)</option>
                      <option value="Teens (15-18)">Teens (15-18)</option>
                      <option value="Adults (18+)">Adults (18+)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={templateData.description}
                    onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Describe your template..."
                  />
                </div>
              </div>
            </div>

            {/* Design Options */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Design Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Background</label>
                  <div className="grid grid-cols-4 gap-2">
                    {backgroundOptions.map((bg, index) => (
                      <button
                        key={index}
                        onClick={() => setTemplateData({ 
                          ...templateData, 
                          design: { ...templateData.design, background: bg }
                        })}
                        className={`w-full h-12 rounded-lg border-2 transition-all duration-200 ${
                          templateData.design.background === bg ? 'border-indigo-500 scale-110' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ background: bg }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Font Family</label>
                  <select
                    value={templateData.design.fontFamily}
                    onChange={(e) => setTemplateData({ 
                      ...templateData, 
                      design: { ...templateData.design, fontFamily: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                  >
                    {fontOptions.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Quick Start</h4>
              <button
                onClick={generateDefaultContent}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium"
              >
                <Palette className="h-5 w-5" />
                <span>Generate Default Template</span>
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Creates a basic template structure that you can customize
              </p>
            </div>
          </div>

          {/* Template Editor */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">HTML Content</h4>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300"
                >
                  <Eye className="h-4 w-4" />
                  <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
                </button>
              </div>
              <textarea
                value={templateData.content}
                onChange={(e) => setTemplateData({ ...templateData, content: e.target.value })}
                rows={showPreview ? 8 : 16}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 font-mono text-sm"
                placeholder="Enter your HTML template content here..."
              />
              <div className="mt-2 text-xs text-gray-500">
                <p>💡 Use placeholders: [Name] for recipient name, [Message] for custom message</p>
              </div>
            </div>

            {/* Live Preview */}
            {showPreview && templateData.content && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Live Preview</h4>
                <div className="bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-300">
                  <div 
                    className="rounded-xl overflow-hidden shadow-lg"
                    style={{ 
                      minHeight: '300px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div 
                      className="w-full max-w-md"
                      dangerouslySetInnerHTML={{ 
                        __html: templateData.content
                          .replace(/\[Name\]/g, 'John Doe')
                          .replace(/\[Message\]/g, 'This is a sample personalized message!')
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 p-8 pt-0">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!templateData.name.trim() || !templateData.content.trim()}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl transition-all duration-300 font-medium ${
              templateData.name.trim() && templateData.content.trim()
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="h-5 w-5" />
            <span>Save Template</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomTemplateCreator;