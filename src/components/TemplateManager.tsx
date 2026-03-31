import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Edit, Trash2, Plus, Sparkles, Star, TrendingUp, Wand2, Upload, AlertCircle, X } from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import TemplatePreview from './TemplatePreview'; // Assuming this component exists and is correct
import AITemplateGenerator from './AITemplateGenerator';
import CustomTemplateCreator from './CustomTemplateCreator';
import { supabase } from '../lib/supabase';
import { Template } from '../types';

const TemplateManager: React.FC = () => {
  const { templates, loading, error, addTemplate, refreshData } = useDatabaseApi();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All');
  const [templateType, setTemplateType] = useState<'default' | 'uploaded'>('default');
  const [uploadedTemplates, setUploadedTemplates] = useState<{ id: string; name: string; displayName: string; imageUrl: string; path: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingUploaded, setIsLoadingUploaded] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<{ name: string; imageUrl: string } | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showCustomCreator, setShowCustomCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const UPLOADED_TEMPLATES_BUCKET = 'Templates';
  const UPLOADED_TEMPLATES_MANIFEST = 'manifest.json';

  const categories = ['All', 'Birthday', 'Anniversary', 'Event Invitation', 'Greeting'];
  const ageGroups = ['All', 'Children (8-15)', 'Teens (15-18)', 'Adults (18+)'];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesAgeGroup = selectedAgeGroup === 'All' || template.ageGroup === selectedAgeGroup;
    return matchesCategory && matchesAgeGroup;
  });

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

  const readUploadedTemplatesManifest = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const { data, error } = await supabase.storage
        .from(UPLOADED_TEMPLATES_BUCKET)
        .download(UPLOADED_TEMPLATES_MANIFEST);

      if (error || !data) {
        return {};
      }

      const text = await data.text();
      const parsed = JSON.parse(text);

      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }

      return {};
    } catch {
      return {};
    }
  }, [UPLOADED_TEMPLATES_BUCKET, UPLOADED_TEMPLATES_MANIFEST]);

  const writeUploadedTemplatesManifest = useCallback(async (manifest: Record<string, string>) => {
    const payload = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const bucket = supabase.storage.from(UPLOADED_TEMPLATES_BUCKET);

    const { error } = await bucket.upload(UPLOADED_TEMPLATES_MANIFEST, payload, {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '3600',
    });

    if (!error) return;

    const { error: removeError } = await bucket.remove([UPLOADED_TEMPLATES_MANIFEST]);
    if (removeError) {
      throw error;
    }

    const { error: retryError } = await bucket.upload(UPLOADED_TEMPLATES_MANIFEST, payload, {
      upsert: false,
      contentType: 'application/json',
      cacheControl: '3600',
    });

    if (retryError) {
      throw retryError;
    }
  }, [UPLOADED_TEMPLATES_BUCKET, UPLOADED_TEMPLATES_MANIFEST]);

  const loadUploadedTemplates = useCallback(async () => {
    try {
      setIsLoadingUploaded(true);

      const manifest = await readUploadedTemplatesManifest();
      const { data, error } = await supabase.storage
        .from(UPLOADED_TEMPLATES_BUCKET)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      const files = (data || [])
        .filter(item => item.name !== UPLOADED_TEMPLATES_MANIFEST)
        .filter(item => /\.(png|jpe?g)$/i.test(item.name))
        .map(item => {
          const { data: publicData } = supabase.storage
            .from(UPLOADED_TEMPLATES_BUCKET)
            .getPublicUrl(item.name);

          const fallbackName = item.name.replace(/\.[^/.]+$/, '');
          const displayName = manifest[item.name] || fallbackName;

          return {
            id: item.name,
            name: displayName,
            displayName,
            imageUrl: publicData.publicUrl,
            path: item.name,
          };
        });

      setUploadedTemplates(files);
    } catch (err) {
      console.error('Failed to load uploaded templates:', err);
    } finally {
      setIsLoadingUploaded(false);
    }
  }, [readUploadedTemplatesManifest, UPLOADED_TEMPLATES_BUCKET, UPLOADED_TEMPLATES_MANIFEST]);

  useEffect(() => {
    if (templateType === 'uploaded') {
      loadUploadedTemplates();
    }
  }, [templateType, loadUploadedTemplates]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      alert('Please upload a PNG or JPG image.');
      input.value = '';
      return;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const displayName = baseName;
    const extension = (file.name.split('.').pop() || 'png').toLowerCase();
    const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const storageFileName = `${Date.now()}-${uniqueId}.${extension}`;

    try {
      setIsUploading(true);
      const { error: uploadError } = await supabase.storage
        .from(UPLOADED_TEMPLATES_BUCKET)
        .upload(storageFileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicData } = supabase.storage
        .from(UPLOADED_TEMPLATES_BUCKET)
        .getPublicUrl(storageFileName);

      try {
        const manifest = await readUploadedTemplatesManifest();
        manifest[storageFileName] = displayName;
        await writeUploadedTemplatesManifest(manifest);
      } catch (manifestErr) {
        try {
          await supabase.storage
            .from(UPLOADED_TEMPLATES_BUCKET)
            .remove([storageFileName]);
        } catch (rollbackErr) {
          console.error('Failed to rollback uploaded file after manifest write error:', rollbackErr);
        }
        throw manifestErr;
      }

      setUploadedTemplates(prev => [
        {
          id: storageFileName,
          name: displayName,
          displayName,
          imageUrl: publicData.publicUrl,
          path: storageFileName,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error('Failed to upload template:', err);
      alert('Failed to upload template. Please try again.');
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  };

  const handleDeleteUploadedTemplate = async (template: { id: string; name: string; displayName: string; imageUrl: string; path: string }) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this template? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const { error: removeError } = await supabase.storage
        .from(UPLOADED_TEMPLATES_BUCKET)
        .remove([template.path]);

      if (removeError) {
        throw removeError;
      }

      try {
        const manifest = await readUploadedTemplatesManifest();
        if (manifest[template.path]) {
          delete manifest[template.path];
          await writeUploadedTemplatesManifest(manifest);
        }
      } catch (err) {
        console.error('Failed to update uploaded templates manifest after delete:', err);
      }

      setUploadedTemplates(prev => prev.filter(t => t.path !== template.path));

      if (uploadedPreview?.imageUrl === template.imageUrl) {
        setUploadedPreview(null);
      }
    } catch (err) {
      console.error('Failed to delete uploaded template:', err);
      alert('Failed to delete template. Please try again.');
    }
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
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-3">Template Gallery</h2>
              <p className="text-pink-100 text-xl">Create stunning, personalized messages for every occasion</p>
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
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Template Type</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as 'default' | 'uploaded')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-50 focus:bg-white"
            >
              <option value="default">Default Templates</option>
              <option value="uploaded">Uploaded Templates</option>
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Templates...</h3>
          <p className="text-gray-600">Fetching creative designs from database</p>
        </div>
      )}

      {/* Enhanced Templates Grid */}
      {!loading && templateType === 'default' && (
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
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
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
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State for default templates when filters return no results */}
      {!loading && templateType === 'default' && filteredTemplates.length === 0 && (
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

      {/* Uploaded Templates - client-side only */}
      {!loading && templateType === 'uploaded' && (
        <div>
          {/* CTA: Create your own template */}
          <div className="mb-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-indigo-900 mb-1">Create your own template</h3>
                <p className="text-sm text-indigo-700">
                  Design your template in Canva, download it, and upload it here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.open('https://www.canva.com/', '_blank', 'noopener,noreferrer')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors duration-200"
              >
                <Sparkles className="h-4 w-4" />
                <span>Open Canva</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="group inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Upload className="h-5 w-5 group-hover:translate-y-[-1px] transition-transform duration-200" />
              <span className="font-semibold">{isUploading ? 'Uploading...' : 'Upload Template'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {isLoadingUploaded ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Uploaded Templates...</h3>
              <p className="text-gray-600">Fetching templates from storage</p>
            </div>
          ) : uploadedTemplates.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No uploaded templates yet</h3>
              <p className="text-gray-600">Upload your own designs to use them in campaigns</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {uploadedTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setUploadedPreview({ name: template.displayName, imageUrl: template.imageUrl })}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUploadedTemplate(template);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 text-red-600 hover:text-red-800 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                      aria-label="Delete uploaded template"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="h-64 w-full bg-gray-100 flex items-center justify-center">
                      <img
                        src={template.imageUrl}
                        alt={template.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate" title={template.displayName}>
                        {template.displayName}
                      </p>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-600">
                        Uploaded
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Uploaded Template Preview Modal */}
      {uploadedPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{uploadedPreview.name}</h3>
                <p className="text-sm text-gray-500">Uploaded Template Preview</p>
              </div>
              <button
                type="button"
                onClick={() => setUploadedPreview(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <img
                  src={uploadedPreview.imageUrl}
                  alt={uploadedPreview.name}
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>
            </div>
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

export default TemplateManager;