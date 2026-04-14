import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Eye, Trash2, Sparkles, Wand2, Upload, AlertCircle,
  X, Download, Send, ImageIcon, Loader2, CheckCircle
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import AITemplateGenerator from './AITemplateGenerator';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface UploadedTemplateRecord {
  id: string;
  display_name: string;
  storage_path: string;
  image_url: string;
  template_type: 'uploaded' | 'ai_generated';
  created_at: string;
}

type ActiveSection = 'ai_generated' | 'uploaded';

// ────────────────────────────────────────────────────────────
// ImagePreviewModal — fullscreen preview for any image template
// ────────────────────────────────────────────────────────────
const ImagePreviewModal: React.FC<{
  template: UploadedTemplateRecord;
  onClose: () => void;
  onDelete: () => void;
}> = ({ template, onClose, onDelete }) => {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = template.image_url;
    a.download = `${template.display_name.replace(/\s+/g, '_')}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 truncate max-w-lg">{template.display_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                template.template_type === 'ai_generated'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {template.template_type === 'ai_generated' ? <><Sparkles className="h-3 w-3" /> AI Generated</> : 'Uploaded'}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(template.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Image */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6 flex items-center justify-center">
          <img
            src={template.image_url}
            alt={template.display_name}
            className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
          />
        </div>

        {/* Action bar */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-400 rounded-xl transition-all font-medium text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-medium text-sm"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all shadow-md font-medium text-sm"
            >
              <Send className="h-4 w-4" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// TemplateCard — unified card for both AI and uploaded
// ────────────────────────────────────────────────────────────
const TemplateCard: React.FC<{
  template: UploadedTemplateRecord;
  onPreview: () => void;
  onDelete: () => void;
}> = ({ template, onPreview, onDelete }) => {
  const isAI = template.template_type === 'ai_generated';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = template.image_url;
    a.download = `${template.display_name.replace(/\s+/g, '_')}.png`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div
      onClick={onPreview}
      className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-400 border border-gray-100 cursor-pointer transform hover:-translate-y-2"
    >
      {/* Image area */}
      <div className="relative overflow-hidden h-60 bg-gray-100">
        <img
          src={template.image_url}
          alt={template.display_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 flex flex-col gap-2 w-40">
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-gray-900 rounded-xl shadow-lg text-sm font-semibold hover:bg-gray-50 transition-all"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              <Send className="h-4 w-4" />
              Use
            </button>
            {isAI && (
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            )}
          </div>
        </div>

        {/* Delete button — top right */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 hover:text-red-700 hover:bg-white rounded-lg shadow opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* AI badge — top left */}
        {isAI && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-purple-600/90 backdrop-blur-sm text-white rounded-full text-xs font-bold shadow">
            <Sparkles className="h-3 w-3" />
            AI
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 truncate flex-1 mr-3" title={template.display_name}>
          {template.display_name}
        </p>
        <span className={`flex-shrink-0 px-2.5 py-1 text-xs font-bold rounded-full ${
          isAI ? 'bg-purple-50 text-purple-700' : 'bg-indigo-50 text-indigo-700'
        }`}>
          {isAI ? '✨ AI' : 'Uploaded'}
        </span>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main — TemplateManager
// ────────────────────────────────────────────────────────────
const TemplateManager: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('ai_generated');
  const [aiTemplates, setAiTemplates] = useState<UploadedTemplateRecord[]>([]);
  const [uploadedTemplates, setUploadedTemplates] = useState<UploadedTemplateRecord[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingUploaded, setLoadingUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previewTemplate, setPreviewTemplate] = useState<UploadedTemplateRecord | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Load AI Generated templates ──────────────────────────
  const loadAITemplates = useCallback(async () => {
    try {
      setLoadingAI(true);
      setError(null);
      const response = await apiClient.get<UploadedTemplateRecord[]>(
        '/api/uploaded-templates',
        { template_type: 'ai_generated' }
      );
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load AI templates');
      }
      setAiTemplates(response.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingAI(false);
    }
  }, []);

  // ── Load Uploaded templates ───────────────────────────────
  const loadUploadedTemplates = useCallback(async () => {
    try {
      setLoadingUploaded(true);
      const response = await apiClient.get<UploadedTemplateRecord[]>(
        '/api/uploaded-templates',
        { template_type: 'uploaded' }
      );
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to load uploaded templates');
      }
      setUploadedTemplates(response.data);
    } catch (err: any) {
      console.error('Failed to load uploaded templates:', err.message);
    } finally {
      setLoadingUploaded(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAITemplates();
    loadUploadedTemplates();
  }, [loadAITemplates, loadUploadedTemplates]);

  // ── AI Generator callback ─────────────────────────────────
  const handleGenerated = (record: UploadedTemplateRecord) => {
    setAiTemplates(prev => [record, ...prev]);
    setShowAIGenerator(false);
    setActiveSection('ai_generated');
  };

  // ── Manual file upload ────────────────────────────────────
  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      alert('Please upload a PNG or JPG image.');
      input.value = '';
      return;
    }

    const displayName = file.name.replace(/\.[^/.]+$/, '');

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', displayName);
      formData.append('template_type', 'uploaded');

      const response = await apiClient.postFormData<UploadedTemplateRecord>(
        '/api/uploaded-templates/upload',
        formData
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Upload failed');
      }

      setUploadedTemplates(prev => [response.data!, ...prev]);
      setActiveSection('uploaded');
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert('Failed to upload template. Please try again.');
    } finally {
      setIsUploading(false);
      input.value = '';
    }
  };

  // ── Delete (works for both types) ─────────────────────────
  const handleDelete = async (template: UploadedTemplateRecord) => {
    const confirmed = window.confirm(`Delete "${template.display_name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await apiClient.delete(`/api/uploaded-templates/${template.id}`);
      if (!response.success) throw new Error(response.error?.message || 'Delete failed');

      if (template.template_type === 'ai_generated') {
        setAiTemplates(prev => prev.filter(t => t.id !== template.id));
      } else {
        setUploadedTemplates(prev => prev.filter(t => t.id !== template.id));
      }

      if (previewTemplate?.id === template.id) setPreviewTemplate(null);
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const currentTemplates = activeSection === 'ai_generated' ? aiTemplates : uploadedTemplates;
  const currentLoading = activeSection === 'ai_generated' ? loadingAI : loadingUploaded;

  return (
    <div className="space-y-8">

      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-pink-700 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black/10" />
        {/* decorative circles */}
        <div className="absolute -top-6 -right-6 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/5 rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-4xl font-bold mb-2">Template Gallery</h2>
            <p className="text-purple-100 text-lg">AI-generated & custom greeting card templates</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAIGenerator(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 rounded-xl transition-all duration-300 shadow-lg font-semibold"
            >
              <Wand2 className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              AI Generate
            </button>
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="group flex items-center gap-2 px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-300 shadow-lg font-semibold disabled:opacity-60"
            >
              <Upload className="h-5 w-5" />
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* ── Section Tabs ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-2 flex gap-2">
        <button
          onClick={() => setActiveSection('ai_generated')}
          className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            activeSection === 'ai_generated'
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          AI Generated Templates
          {aiTemplates.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeSection === 'ai_generated' ? 'bg-white/20' : 'bg-purple-100 text-purple-700'
            }`}>
              {aiTemplates.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('uploaded')}
          className={`flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
            activeSection === 'uploaded'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Uploaded Templates
          {uploadedTemplates.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeSection === 'uploaded' ? 'bg-white/20' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {uploadedTemplates.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Failed to load templates</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={activeSection === 'ai_generated' ? loadAITemplates : loadUploadedTemplates}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading state ─────────────────────────────────────── */}
      {currentLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Loading {activeSection === 'ai_generated' ? 'AI Generated' : 'Uploaded'} Templates
          </h3>
          <p className="text-gray-500 text-sm">Fetching from database...</p>
        </div>
      )}

      {/* ── AI Generated: empty state ─────────────────────────── */}
      {!currentLoading && activeSection === 'ai_generated' && aiTemplates.length === 0 && (
        <div className="text-center py-20">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-purple-200">
            <Wand2 className="h-12 w-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No AI Templates Yet</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Generate your first AI-powered greeting card. Describe your vision and Gemini will create a professional, branded template in seconds.
          </p>
          <button
            onClick={() => setShowAIGenerator(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-2xl hover:from-violet-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            <Sparkles className="h-6 w-6" />
            Generate First Template
          </button>
        </div>
      )}

      {/* ── Uploaded: Canva CTA + empty state ────────────────── */}
      {!currentLoading && activeSection === 'uploaded' && (
        <>
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-indigo-900">Design your own template</h3>
              <p className="text-sm text-indigo-600 mt-0.5">Create in Canva or Figma, export as PNG/JPG, and upload here.</p>
            </div>
            <button
              onClick={() => window.open('https://www.canva.com/', '_blank', 'noopener,noreferrer')}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Open Canva
            </button>
          </div>

          {uploadedTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mb-5 shadow-xl">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Uploaded Templates Yet</h3>
              <p className="text-gray-500 mb-6">Upload your own designs to use them in campaigns.</p>
              <button
                onClick={handleUploadClick}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg font-semibold"
              >
                <Upload className="h-5 w-5" />
                Upload Template
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Templates Grid ────────────────────────────────────── */}
      {!currentLoading && currentTemplates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onDelete={() => handleDelete(template)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {previewTemplate && (
        <ImagePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onDelete={() => {
            handleDelete(previewTemplate);
          }}
        />
      )}

      {showAIGenerator && (
        <AITemplateGenerator
          onClose={() => setShowAIGenerator(false)}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  );
};

export default TemplateManager;