import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Send, Eye, Users, Mail, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import { Template } from '../types';
import { emailApi } from '../services/emailApi';
import TemplatePreview from './TemplatePreview';
import { supabase } from '../lib/supabase';

interface BulkSendModalProps {
  selectedUserIds: string[];
  eventFilter: 'All' | 'Birthday' | 'Anniversary';
  onClose: () => void;
  onSend: () => void;
}

type TemplateSelectionType = 'default' | 'uploaded';

type UploadedTemplate = {
  id: string;
  displayName: string;
  imageUrl: string;
  path: string;
};

const BulkSendModal: React.FC<BulkSendModalProps> = ({ selectedUserIds, eventFilter, onClose, onSend }) => {
  const { users, templates, updateTemplateUsage } = useDatabaseApi();
  const [templateSelectionType, setTemplateSelectionType] = useState<TemplateSelectionType>('default');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedUploadedTemplate, setSelectedUploadedTemplate] = useState<UploadedTemplate | null>(null);
  const [uploadedTemplates, setUploadedTemplates] = useState<UploadedTemplate[]>([]);
  const [isLoadingUploaded, setIsLoadingUploaded] = useState(false);
  const [previewingUploadedTemplate, setPreviewingUploadedTemplate] = useState<UploadedTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [sendNow, setSendNow] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<{
    successful: number;
    failed: number;
    total: number;
  } | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  const UPLOADED_TEMPLATES_BUCKET = 'Templates';
  const UPLOADED_TEMPLATES_MANIFEST = 'manifest.json';

  const filteredTemplates = useMemo(() => {
    if (eventFilter === 'Birthday') {
      return templates.filter(t => t.category === 'Birthday');
    }
    if (eventFilter === 'Anniversary') {
      return templates.filter(t => t.category === 'Anniversary');
    }
    // Default to 'All' which shows Event Invitation and Greeting
    return templates.filter(t => t.category === 'Event Invitation' || t.category === 'Greeting');
  }, [templates, eventFilter]);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

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

  const loadUploadedTemplates = useCallback(async () => {
    try {
      setIsLoadingUploaded(true);

      const { data: tableData, error: tableError } = await supabase
        .from('uploaded_templates')
        .select('*');

      if (!tableError && Array.isArray(tableData) && tableData.length > 0) {
        const mappedFromTable: UploadedTemplate[] = (tableData as Record<string, unknown>[]) 
          .map((row) => {
            const id = String(
              row.id ?? row.path ?? row.storage_path ?? row.storageFileName ?? row.file_name ?? ''
            );
            const displayName = String(
              row.display_name ?? row.displayName ?? row.name ?? row.original_name ?? 'Uploaded Template'
            );
            const imageUrl = String(row.image_url ?? row.imageUrl ?? row.public_url ?? row.url ?? '');
            const path = String(row.path ?? row.storage_path ?? row.file_name ?? row.storageFileName ?? id);

            return {
              id,
              displayName,
              imageUrl,
              path,
            };
          })
          .filter(t => Boolean(t.id) && Boolean(t.imageUrl));

        setUploadedTemplates(mappedFromTable);
        return;
      }

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
            displayName,
            imageUrl: publicData.publicUrl,
            path: item.name,
          };
        });

      setUploadedTemplates(files);
    } catch (err) {
      console.error('Failed to load uploaded templates for bulk send:', err);
    } finally {
      setIsLoadingUploaded(false);
    }
  }, [readUploadedTemplatesManifest, UPLOADED_TEMPLATES_BUCKET, UPLOADED_TEMPLATES_MANIFEST]);

  useEffect(() => {
    if (templateSelectionType === 'uploaded') {
      loadUploadedTemplates();
    }
  }, [templateSelectionType, loadUploadedTemplates]);

  const processTemplate = (template: Template, userName: string, message: string, preferences?: string[]) => {
    let html = template.content;
    html = html.replace(/\[Name\]/g, userName);
    html = html.replace(/\[Message\]/g, message || '');
    
    // Add preference-based personalization if available
    if (preferences && preferences.length > 0) {
      const randomPreference = preferences[Math.floor(Math.random() * preferences.length)];
      html = html.replace(/\[Preference\]/g, randomPreference);
    }
    
    return html;
  };

  const generateSubject = (category: string, userName: string) => {
    const subjects: Record<string, string[]> = {
      'Birthday': [`🎉 Happy Birthday ${userName}!`, `🎂 Birthday Wishes for ${userName}`],
      'Anniversary': [`💕 Happy Anniversary ${userName}!`, `🌹 Anniversary Wishes`],
      'Event Invitation': [`🎊 You're Invited, ${userName}!`, `✨ Special Invitation`],
      'Greeting': [`👋 Hello ${userName}!`, `🌟 Thinking of You`]
    };
    
    const categorySubjects = subjects[category] || [`Hello ${userName}!`];
    return categorySubjects[Math.floor(Math.random() * categorySubjects.length)];
  };

  const handleSend = async () => {
    if (templateSelectionType === 'default') {
      if (!selectedTemplate || !selectedTemplateData) {
        alert('Please select a template.');
        return;
      }
    } else {
      if (!selectedUploadedTemplate) {
        alert('Please select a template.');
        return;
      }
    }

    setIsSending(true);
    setSendProgress(0);
    setSendResults(null);

    try {
      const emailPromises = selectedUsers.map(async (user, index) => {
        let subject = '';
        let html = '';

        if (templateSelectionType === 'default') {
          subject = generateSubject(selectedTemplateData!.category, user.name);
          html = processTemplate(
            selectedTemplateData!,
            user.name,
            customMessage,
            user.preferences
          );
        } else {
          const category = eventFilter === 'Birthday'
            ? 'Birthday'
            : eventFilter === 'Anniversary'
              ? 'Anniversary'
              : 'Greeting';

          subject = generateSubject(category, user.name);

          const messageBlock = customMessage
            ? `<p style="margin: 12px 0; font-size: 16px; color: #111827;">${escapeHtml(customMessage)}</p>`
            : '';

          html = `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%; border-collapse:collapse; background:#ffffff;">
              <tr>
                <td align="center" style="padding:16px;">
                  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px; max-width:600px; border-collapse:collapse;">
                    <tr>
                      <td style="font-family: Arial, sans-serif;">
                        <p style="margin: 0 0 12px 0; font-size: 16px; color: #111827;">Hi ${escapeHtml(user.name)},</p>
                        ${messageBlock}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;">
                        <img
                          src="${selectedUploadedTemplate!.imageUrl}"
                          alt="${escapeHtml(selectedUploadedTemplate!.displayName)}"
                          width="600"
                          style="display:block; width:100%; max-width:600px; height:auto; border-radius:12px;"
                        />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          `;
        }

        try {
          await emailApi.sendEmail({
            to: user.email,
            name: user.name,
            subject,
            htmlTemplate: html
          });
          setSendProgress(Math.round(((index + 1) / selectedUsers.length) * 100));
          return { success: true };
        } catch (error) {
          console.error('Failed to send email to', user.email, error);
          return { success: false };
        }
      });

      const results = await Promise.all(emailPromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0 && templateSelectionType === 'default') {
        await updateTemplateUsage(selectedTemplateData!.id);
      }

      setSendResults({
        successful,
        failed,
        total: selectedUsers.length
      });

      // Auto close after showing results
      setTimeout(() => {
        onSend();
      }, 3000);

    } catch (error) {
      console.error('Bulk send failed:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Show results screen
  if (sendResults) {
    const selectedTemplateLabel = templateSelectionType === 'default'
      ? selectedTemplateData?.name
      : selectedUploadedTemplate?.displayName;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            sendResults.failed === 0 
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          }`}>
            {sendResults.failed === 0 ? (
              <CheckCircle className="h-10 w-10 text-white" />
            ) : (
              <AlertCircle className="h-10 w-10 text-white" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            {sendResults.failed === 0 ? 'All Messages Sent!' : 'Bulk Send Complete'}
          </h3>
          <div className="space-y-2 mb-6">
            <p className="text-emerald-600 font-semibold">
              ✅ {sendResults.successful} messages sent successfully
            </p>
            {sendResults.failed > 0 && (
              <p className="text-red-600 font-semibold">
                ❌ {sendResults.failed} messages failed
              </p>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-800 font-medium">
              Template: "{selectedTemplateLabel}"
            </p>
            <p className="text-gray-600 text-sm">
              Recipients will receive their personalized messages shortly
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show sending progress
  if (isSending) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader className="h-10 w-10 text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Sending Messages...</h3>
          <p className="text-gray-600 mb-6">
            Sending personalized messages to {selectedUsers.length} recipients
          </p>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${sendProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">{sendProgress}% Complete</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Bulk Send Messages</h3>
                <p className="text-indigo-100">Send personalized messages to multiple recipients</p>
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

        <div className="p-8 space-y-8">
          {/* Recipients Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-blue-900">
                  {selectedUsers.length} Recipients Selected
                </h4>
                <p className="text-blue-700">
                  {selectedUsers.slice(0, 3).map(user => user.name).join(', ')}
                  {selectedUsers.length > 3 && ` +${selectedUsers.length - 3} more`}
                </p>
              </div>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Select Template
            </label>

            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-4">
              <button
                type="button"
                onClick={() => setTemplateSelectionType('default')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  templateSelectionType === 'default'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Default Templates
              </button>
              <button
                type="button"
                onClick={() => setTemplateSelectionType('uploaded')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  templateSelectionType === 'uploaded'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Uploaded Templates
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templateSelectionType === 'default' ? (
                filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setSelectedUploadedTemplate(null);
                    }}
                    className={`group p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{template.name}</h4>
                        <p className="text-sm text-gray-600">{template.ageGroup}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingTemplate(template);
                        }}
                        className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-100 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                      Used {template.usageCount} times
                    </div>
                  </div>
                ))
              ) : isLoadingUploaded ? (
                <div className="col-span-full text-center py-8 text-gray-600">
                  Loading uploaded templates...
                </div>
              ) : uploadedTemplates.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-600">
                  No uploaded templates available.
                </div>
              ) : (
                uploadedTemplates.map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedUploadedTemplate(tpl);
                      setSelectedTemplate('');
                    }}
                    className={`group border-2 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                      selectedUploadedTemplate?.id === tpl.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className="relative h-40 w-full bg-gray-100">
                      <img
                        src={tpl.imageUrl}
                        alt={tpl.displayName}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewingUploadedTemplate(tpl);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 text-gray-700 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                        aria-label="Preview uploaded template"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-gray-900 truncate" title={tpl.displayName}>
                        {tpl.displayName}
                      </p>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-2">
                        Uploaded
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-lg font-bold text-gray-900 mb-3">
              Custom Message
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
              placeholder="Add a personalized message that will be included in each template..."
            />
            <p className="mt-2 text-sm text-gray-500">
              This message will replace the [Message] placeholder in your selected template
            </p>
          </div>

          {/* Scheduling Options */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Delivery Options</h4>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                <input
                  type="radio"
                  checked={sendNow}
                  onChange={() => setSendNow(true)}
                  className="text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                />
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Send className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Send immediately</span>
                    <p className="text-sm text-gray-600">Messages will be sent right away</p>
                  </div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 rounded-xl hover:bg-white transition-colors cursor-pointer">
                <input
                  type="radio"
                  checked={!sendNow}
                  onChange={() => setSendNow(false)}
                  className="text-indigo-600 focus:ring-indigo-500 w-5 h-5"
                />
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Schedule for later</span>
                    <p className="text-sm text-gray-600">Choose a specific date and time</p>
                  </div>
                </div>
              </label>
            </div>

            {!sendNow && (
              <div className="mt-4 ml-8">
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          {templateSelectionType === 'default' && selectedTemplateData && (
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Template Preview</h4>
              <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300">
                <div 
                  className="rounded-lg overflow-hidden"
                  style={{ 
                    background: selectedTemplateData.design.background,
                    minHeight: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div 
                    className="max-w-md"
                    dangerouslySetInnerHTML={{ 
                      __html: processTemplate(
                        selectedTemplateData,
                        '[Recipient Name]',
                        customMessage || '[Your Custom Message]'
                      )
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {templateSelectionType === 'uploaded' && selectedUploadedTemplate && (
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Template Preview</h4>
              <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300">
                <div className="rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center" style={{ minHeight: '200px' }}>
                  <img
                    src={selectedUploadedTemplate.imageUrl}
                    alt={selectedUploadedTemplate.displayName}
                    className="w-full max-h-[50vh] object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={(templateSelectionType === 'default' ? !selectedTemplate : !selectedUploadedTemplate) || isSending}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl transition-all duration-300 font-medium ${
                ((templateSelectionType === 'default' ? selectedTemplate : selectedUploadedTemplate) && !isSending)
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Mail className="h-5 w-5" />
              <span>{sendNow ? 'Send Now' : 'Schedule Send'}</span>
            </button>
          </div>
        </div>
      </div>
      {previewingTemplate && (
        <TemplatePreview
          template={previewingTemplate}
          onClose={() => setPreviewingTemplate(null)}
          onSelect={() => {
            setSelectedTemplate(previewingTemplate.id);
            setSelectedUploadedTemplate(null);
            setPreviewingTemplate(null);
          }}
        />
      )}

      {previewingUploadedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{previewingUploadedTemplate.displayName}</h3>
                <p className="text-sm text-gray-500">Uploaded Template Preview</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingUploadedTemplate(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <img
                  src={previewingUploadedTemplate.imageUrl}
                  alt={previewingUploadedTemplate.displayName}
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUploadedTemplate(previewingUploadedTemplate);
                    setSelectedTemplate('');
                    setPreviewingUploadedTemplate(null);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Use this template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkSendModal;