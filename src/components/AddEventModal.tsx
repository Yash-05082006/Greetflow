import React, { useState, useEffect } from 'react';
import { X, Send, Users, Calendar, Info, Building, Type, Loader, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import { emailApi } from '../services/emailApi';
import TemplatePreview from './TemplatePreview';
import { Template } from '../types';

interface AddEventModalProps {
  selectedUserIds: string[];
  onClose: () => void;
  onSend: () => void;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ selectedUserIds, onClose, onSend }) => {
  const { users, templates, updateTemplateUsage } = useDatabaseApi();
  const [eventDetails, setEventDetails] = useState({
    name: '',
    organizer: 'Beamwelly',
    venue: '',
    description: '',
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendResults, setSendResults] = useState<{ successful: number; failed: number } | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [previewingTemplate, setPreviewingTemplate] = useState<Template | null>(null);


  useEffect(() => {
    // This effect will run when the component mounts, checking for state from sessionStorage
    const selectionStateJSON = sessionStorage.getItem('templateSelectionState');
    if (selectionStateJSON) {
      const selectionState = JSON.parse(selectionStateJSON);
      if (selectionState.type === 'event' && selectionState.selectedTemplateId) {
        setEventDetails(selectionState.eventDetails);
        setSelectedTemplateId(selectionState.selectedTemplateId);
        // Clear the state from session storage after restoring it
        sessionStorage.removeItem('templateSelectionState'); // This was correct
      }
    }
  }, []);

  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));
  const eventTemplates = templates.filter(t => t.category === 'Event Invitation' || t.category === 'Greeting');
  const selectedTemplateData = templates.find(t => t.id === selectedTemplateId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
  };

  const processTemplate = (template: Template, userName: string, message: string, eventData: any) => {
    let html = template.content;
    html = html.replace(/\[Name\]/g, userName);
    html = html.replace(/\[Message\]/g, message);
    html = html.replace(/\[Event Name\]/g, eventData.event_name || '');
    html = html.replace(/\[Organizer\]/g, eventData.event_organizer || '');
    html = html.replace(/\[Venue\]/g, eventData.venue || '');
    return html;
  };

  const handleSend = async () => {
    if (!selectedTemplateId || !selectedTemplateData || !eventDetails.name) {
      alert('Please fill in the event name and select a template.');
      return;
    }

    setIsSending(true);
    setSendProgress(0);

    const emailPromises = selectedUsers.map(async (user, index) => {
      const subject = `Invitation: ${eventDetails.name}`;
      const html = processTemplate(
        selectedTemplateData,
        user.name,
        eventDetails.description,
        {
          event_name: eventDetails.name,
          event_organizer: eventDetails.organizer,
          venue: eventDetails.venue,
        }
      );
      
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

    if (successful > 0) {
      await updateTemplateUsage(selectedTemplateData.id);
    }

    setSendResults({ successful, failed });
    setIsSending(false);

    setTimeout(() => {
      onSend();
    }, 3000);
  };

  const handleChooseTemplate = () => {
    setShowTemplateDropdown(!showTemplateDropdown);
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setShowTemplateDropdown(false);
    if (previewingTemplate) {
      setPreviewingTemplate(null);
    }
  };

  if (sendResults) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${sendResults.failed === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
                    {sendResults.failed === 0 ? <CheckCircle className="h-10 w-10 text-white" /> : <AlertCircle className="h-10 w-10 text-white" />}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Invitations Sent!</h3>
                <p className="text-emerald-600 font-semibold">✅ {sendResults.successful} sent successfully</p>
                {sendResults.failed > 0 && <p className="text-red-600 font-semibold">❌ {sendResults.failed} failed</p>}
            </div>
        </div>
    );
  }

  if (isSending) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
                <Loader className="h-10 w-10 text-indigo-600 animate-spin mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Sending Invitations...</h3>
                <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-indigo-600 h-4 rounded-full" style={{ width: `${sendProgress}%` }}></div></div>
                <p className="text-sm text-gray-500 mt-2">{sendProgress}% Complete</p>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6" />
            <h3 className="text-2xl font-bold">Add New Event</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Event Name</label>
            <div className="flex items-center border border-gray-300 rounded-xl p-3">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <input type="text" name="name" value={eventDetails.name} onChange={handleInputChange} placeholder="e.g., Annual Tech Conference" className="w-full outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Event Organizer</label>
              <div className="flex items-center border border-gray-300 rounded-xl p-3">
                <Users className="h-5 w-5 text-gray-400 mr-3" />
                <input type="text" name="organizer" value={eventDetails.organizer} onChange={handleInputChange} className="w-full outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Venue</label>
              <div className="flex items-center border border-gray-300 rounded-xl p-3">
                <Building className="h-5 w-5 text-gray-400 mr-3" />
                <input type="text" name="venue" value={eventDetails.venue} onChange={handleInputChange} placeholder="e.g., Grand Convention Hall" className="w-full outline-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description (Invitation Message)</label>
            <div className="flex items-start border border-gray-300 rounded-xl p-3">
              <Info className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <textarea name="description" value={eventDetails.description} onChange={handleInputChange} rows={4} placeholder="Include details about the event..." className="w-full outline-none resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Select Template</label>
            <div className="relative">
              <div className="flex items-center border border-gray-300 rounded-xl p-3">
                  <Type className="h-5 w-5 text-gray-400 mr-3" />
                  <div className="flex-grow text-gray-700">{selectedTemplateData?.name || 'No template selected'}</div>
                  <button
                      onClick={handleChooseTemplate}
                      className="ml-4 px-4 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200"
                  >
                      Choose Template
                  </button>
              </div>
              {showTemplateDropdown && (
                <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border max-h-60 overflow-y-auto">
                  <ul className="py-1">
                    {eventTemplates.map(template => (
                      <li key={template.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100">
                        <span className="text-gray-800 font-medium cursor-pointer flex-grow" onClick={() => handleSelectTemplate(template)}>
                          {template.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewingTemplate(template);
                          }}
                          className="p-1 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-indigo-100"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p>Sending invitations to <span className="font-bold text-indigo-600">{selectedUserIds.length}</span> selected users.</p>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button onClick={onClose} className="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
            <button onClick={handleSend} disabled={!selectedTemplateId || !eventDetails.name || selectedUserIds.length === 0} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Send Invitations</span>
            </button>
          </div>
        </div>
      </div>
      {previewingTemplate && (
        <TemplatePreview
          template={previewingTemplate}
          onClose={() => setPreviewingTemplate(null)}
          onSelect={() => {
            handleSelectTemplate(previewingTemplate);
          }}
        />
      )}
    </>
  );
};

export default AddEventModal;