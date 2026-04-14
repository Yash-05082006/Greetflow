import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Send, Eye, Users, Mail, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import { emailApi } from '../services/emailApi';
import { apiClient } from '../services/apiClient';

interface BulkSendModalProps {
  selectedUserIds: string[];
  eventFilter: 'All' | 'Birthday' | 'Anniversary';
  onClose: () => void;
  onSend: () => void;
}

type TemplateSelectionType = 'ai_generated' | 'uploaded';

type UploadedTemplate = {
  id: string;
  displayName: string;
  imageUrl: string;
  templateType: 'ai_generated' | 'uploaded';
};

const BulkSendModal: React.FC<BulkSendModalProps> = ({ selectedUserIds, eventFilter, onClose, onSend }) => {
  const { users } = useDatabaseApi();
  const [templateSelectionType, setTemplateSelectionType] = useState<TemplateSelectionType>('ai_generated');
  const [selectedUploadedTemplate, setSelectedUploadedTemplate] = useState<UploadedTemplate | null>(null);
  const [aiTemplates, setAiTemplates] = useState<UploadedTemplate[]>([]);
  const [uploadedTemplates, setUploadedTemplates] = useState<UploadedTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<UploadedTemplate | null>(null);
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

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  // Load templates from backend API by type
  const loadTemplatesByType = useCallback(async (type: TemplateSelectionType) => {
    try {
      setIsLoadingTemplates(true);
      const response = await apiClient.get<any[]>('/api/uploaded-templates', { template_type: type });
      const rows: any[] = response.data || [];
      const mapped: UploadedTemplate[] = rows
        .filter(r => r.image_url)
        .map(r => ({
          id: String(r.id),
          displayName: String(r.display_name || r.displayName || 'Template'),
          imageUrl: String(r.image_url),
          templateType: r.template_type as 'ai_generated' | 'uploaded',
        }));
      if (type === 'ai_generated') setAiTemplates(mapped);
      else setUploadedTemplates(mapped);
    } catch (err) {
      console.error(`Failed to load ${type} templates:`, err);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadTemplatesByType(templateSelectionType);
  }, [templateSelectionType, loadTemplatesByType]);

  // Active template list for current tab
  const activeTemplates = templateSelectionType === 'ai_generated' ? aiTemplates : uploadedTemplates;

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
    if (!selectedUploadedTemplate) {
      alert('Please select a template.');
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendResults(null);

    try {
      const emailPromises = selectedUsers.map(async (user, index) => {
        const category = eventFilter === 'Birthday'
          ? 'Birthday'
          : eventFilter === 'Anniversary'
            ? 'Anniversary'
            : 'Greeting';

        const subject = generateSubject(category, user.name);

        const messageBlock = customMessage
          ? `<p style="margin: 12px 0; font-size: 16px; color: #111827;">${escapeHtml(customMessage)}</p>`
          : '';

        const html = `
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
                        src="${selectedUploadedTemplate.imageUrl}"
                        alt="${escapeHtml(selectedUploadedTemplate.displayName)}"
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

        try {
          await emailApi.sendEmail({ to: user.email, name: user.name, subject, htmlTemplate: html });
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

      // Track template usage — fire once per batch, non-blocking
      if (successful > 0 && selectedUploadedTemplate) {
        apiClient.post(`/api/uploaded-templates/${selectedUploadedTemplate.id}/use`)
          .catch(err => console.warn('[usage] Failed to increment usage_count:', err.message));
      }

      setSendResults({ successful, failed, total: selectedUsers.length });
      setTimeout(() => { onSend(); }, 3000);

    } catch (error) {
      console.error('Bulk send failed:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Show results screen
  if (sendResults) {
    const selectedTemplateLabel = selectedUploadedTemplate?.displayName;

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

            {/* Template Selection Tabs */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-4">
                Select Template
              </label>

              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 mb-4">
                <button
                  type="button"
                  onClick={() => { setTemplateSelectionType('ai_generated'); setSelectedUploadedTemplate(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    templateSelectionType === 'ai_generated'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  AI Generated
                </button>
                <button
                  type="button"
                  onClick={() => { setTemplateSelectionType('uploaded'); setSelectedUploadedTemplate(null); }}
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
                {isLoadingTemplates ? (
                  <div className="col-span-full text-center py-8 text-gray-600">
                    Loading templates...
                  </div>
                ) : activeTemplates.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    {templateSelectionType === 'ai_generated'
                      ? 'No AI templates generated yet'
                      : 'No uploaded templates available'}
                  </div>
                ) : (
                  activeTemplates.map(tpl => (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedUploadedTemplate(tpl)}
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
                          onClick={(e) => { e.stopPropagation(); setPreviewingTemplate(tpl); }}
                          className="absolute top-3 right-3 p-2 bg-white/90 text-gray-700 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-200"
                          aria-label="Preview template"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-gray-900 truncate" title={tpl.displayName}>
                          {tpl.displayName}
                        </p>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-2">
                          {tpl.templateType === 'ai_generated' ? 'AI Generated' : 'Uploaded'}
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

          {/* Preview for selected image template */}
          {selectedUploadedTemplate && (
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
              disabled={!selectedUploadedTemplate || isSending}
              className={`flex items-center space-x-2 px-8 py-3 rounded-xl transition-all duration-300 font-medium ${
                (selectedUploadedTemplate && !isSending)
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

      {/* Full-screen preview modal */}
      {previewingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{previewingTemplate.displayName}</h3>
                <p className="text-sm text-gray-500">
                  {previewingTemplate.templateType === 'ai_generated' ? 'AI Generated Template' : 'Uploaded Template'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingTemplate(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-50 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 bg-gray-50">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <img
                  src={previewingTemplate.imageUrl}
                  alt={previewingTemplate.displayName}
                  className="w-full max-h-[70vh] object-contain"
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUploadedTemplate(previewingTemplate);
                    setPreviewingTemplate(null);
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