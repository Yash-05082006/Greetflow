import React, { useState } from 'react';
import { Eye, Plus, Sparkles, Star, TrendingUp, Wand2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDatabase } from '../hooks/useDatabase';
import TemplatePreview from './TemplatePreview';
import AITemplateGenerator from './AITemplateGenerator';
import CustomTemplateCreator from './CustomTemplateCreator';
import { useNavigate } from 'react-router-dom';
import { Template } from '../types';

const SelectTemplate: React.FC = () => {
  const { templates, loading, error, addTemplate, refreshData } = useDatabase();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);  
  const navigate = useNavigate();

  const categories = ['All', 'Birthday', 'Anniversary', 'Event Invitation', 'Greeting'];
  const ageGroups = ['All', 'Children (8-15)', 'Teens (15-18)', 'Adults (18+)'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesAgeGroup = selectedAgeGroup === 'All' || template.ageGroup === selectedAgeGroup;
    return matchesCategory && matchesAgeGroup;
  });

  const handleSelectTemplate = (template: Template) => {
    const selectionStateJSON = sessionStorage.getItem('templateSelectionState');
    if (selectionStateJSON) {
      const selectionState = JSON.parse(selectionStateJSON);
      selectionState.selectedTemplateId = template.id;
      selectionState.selectedTemplateName = template.name;
      sessionStorage.setItem('templateSelectionState', JSON.stringify(selectionState));
      navigate('/events');
    }
  };

  const getAgeGroupColor = (ageGroup: string) => {
    switch (ageGroup) {
      case 'Children (8-15)': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'Teens (15-18)': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'Adults (18+)': return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Birthday': return 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white';
      case 'Anniversary': return 'bg-gradient-to-r from-pink-400 to-rose-500 text-white';
      case 'Event Invitation': return 'bg-gradient-to-r from-indigo-400 to-purple-500 text-white';
      case 'Greeting': return 'bg-gradient-to-r from-orange-400 to-red-500 text-white';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
    }
  };

  const getPopularityIcon = (usageCount: number) => {
    if (usageCount > 150) return <Star className="h-4 w-4 text-yellow-500" />;
    if (usageCount > 100) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return null;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Templates</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
          >
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-3">Select a Template</h2>
              <p className="text-pink-100 text-xl">Choose a design for your event or occasion.</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowAIGenerator(true)}
                className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Wand2 className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-semibold">AI Generate</span>
              </button>
              <button 
                onClick={() => setShowCustomCreator(true)}
                className="group flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="font-semibold">New Template</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Mode Info Box */}
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg" role="alert">
        <p className="font-bold">Selection Mode</p>
        <p>Please select a template to use. You will be redirected back after making a selection.</p>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-50 focus:bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Age Group</label>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-50 focus:bg-white"
            >
              {ageGroups.map(ageGroup => (
                <option key={ageGroup} value={ageGroup}>{ageGroup}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{filteredTemplates.length}</p>
              <p className="text-sm text-indigo-600 font-medium">Templates Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Templates...</h3>
          <p className="text-gray-600">Fetching creative designs from database</p>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100">
              <div className="relative overflow-hidden">
                <div 
                  className="h-64 p-8 flex items-center justify-center relative cursor-pointer"
                  style={{ background: template.design.background }}
                  onClick={() => setPreviewTemplate(template)}
                >
                  <div className="text-center max-w-xs">
                    <div 
                      className="text-lg font-bold mb-2 opacity-90"
                      style={{ 
                        color: template.design.textColor,
                        fontFamily: template.design.fontFamily 
                      }}
                    >
                      {template.name}
                    </div>
                    <p 
                      className="text-sm opacity-75"
                      style={{ color: template.design.textColor }}
                    >
                      {template.description}
                    </p>
                  </div>

                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 flex flex-col gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-200 shadow-lg font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(template);
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg font-medium"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Select Template</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${getAgeGroupColor(template.ageGroup)}`}>
                    {template.ageGroup}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {getPopularityIcon(template.usageCount)}
                    <p className="text-sm text-gray-600 font-medium">
                      Used {template.usageCount} times
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectTemplate(template)}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all duration-300 font-medium"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Select</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filteredTemplates.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your filters or create a new template</p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => setShowAIGenerator(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Wand2 className="h-5 w-5" />
              <span>Generate with AI</span>
            </button>
            <button 
              onClick={() => setShowCustomCreator(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Create Custom</span>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {showAIGenerator && (
        <AITemplateGenerator
          onClose={() => setShowAIGenerator(false)}
          onGenerate={async (template) => {
            try {
              await addTemplate(template);
              setShowAIGenerator(false);
            } catch (error) {
              console.error('Failed to save AI template:', error);
              alert('Failed to save template. Please try again.');
            }
          }}
        />
      )}

      {showCustomCreator && (
        <CustomTemplateCreator
          onClose={() => setShowCustomCreator(false)}
          onSave={async (template) => {
            try {
              await addTemplate(template);
              setShowCustomCreator(false);
            } catch (error) {
              console.error('Failed to save custom template:', error);
              alert('Failed to save template. Please try again.');
            }
          }}
        />
      )}
    </div>
  );
};

export default SelectTemplate;
