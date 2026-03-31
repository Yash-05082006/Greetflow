import React, { useState } from 'react';
import { X, Send, Copy, Download, Heart, Eye, CheckCircle } from 'lucide-react';
import { Template } from '../types';
import { templateService } from '../services/templateService';

interface TemplatePreviewProps {
  template: Template;
  onClose: () => void;
  onSelect?: () => void;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ template, onClose, onSelect }) => {
  const [previewData, setPreviewData] = useState({
    name: 'John Doe',
    customMessage: 'Hope you have a wonderful day filled with joy and celebration!'
  });

  const [isFavorite, setIsFavorite] = useState(false);

  const renderTemplate = () => {
    return templateService.processTemplate(
      template,
      previewData.name,
      previewData.customMessage
    );
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(renderTemplate());
    alert('Template copied to clipboard!');
  };

  const handleSendTest = () => {
    alert(`Test email would be sent with "${template.name}" template to your email address!`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">{template.name}</h3>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-indigo-100">{template.category}</span>
                  <span className="text-indigo-200">•</span>
                  <span className="text-indigo-100">{template.ageGroup}</span>
                  <span className="text-indigo-200">•</span>
                  <span className="text-indigo-100">Used {template.usageCount} times</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isFavorite ? 'bg-red-500 text-white' : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-indigo-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Preview Customization */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Customize Preview</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={previewData.name}
                    onChange={(e) => setPreviewData({ ...previewData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter recipient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Personal Message
                  </label>
                  <textarea
                    value={previewData.customMessage}
                    onChange={(e) => setPreviewData({ ...previewData, customMessage: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    placeholder="Enter your personalized message..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {onSelect && (
                <button
                  onClick={onSelect}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>Use This Template</span>
                </button>
              )}
              <button 
                onClick={handleSendTest}
                className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
              >
                <Send className="h-5 w-5" />
                <span>Send Test Email</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleCopyTemplate}
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
                <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Template Stats */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h5 className="font-bold text-gray-900 mb-4">Template Statistics</h5>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Usage Count</span>
                  <span className="font-semibold text-gray-900">{template.usageCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-emerald-600">96.8%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Response</span>
                  <span className="font-semibold text-blue-600">4.7/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Template Preview */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-6">Live Preview</h4>
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
                    dangerouslySetInnerHTML={{ __html: renderTemplate() }}
                  />
                </div>
              </div>
            </div>

            {/* Template Details */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h5 className="font-bold text-gray-900 mb-4">Template Details</h5>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Font Family:</span>
                  <p className="text-gray-900 font-medium">{template.design.fontFamily}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Color Scheme:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ background: template.design.background }}
                    ></div>
                    <span className="text-sm text-gray-700">Gradient Background</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-gray-900">{template.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview;