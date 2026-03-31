import React, { useState } from 'react';
import { Mail, Clock, Bell, Shield, Save } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    gmailIntegration: true,
    automaticSending: true,
    sendTime: '09:00',
    notifications: true,
    weekendSending: false,
    retryFailedEmails: true,
    maxDailyEmails: 100,
  });

  const handleSave = () => {
    // Here you would save settings to your backend
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600">Configure your automation preferences</p>
      </div>

      {/* Gmail Integration */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Gmail Integration</h3>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Gmail Integration</label>
              <p className="text-sm text-gray-600">Connect with Gmail to send automated messages</p>
            </div>
            <input
              type="checkbox"
              checked={settings.gmailIntegration}
              onChange={(e) => setSettings({ ...settings, gmailIntegration: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          {settings.gmailIntegration && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                ✓ Gmail account connected: business@company.com
              </p>
              <button className="mt-2 text-sm text-green-600 hover:text-green-800 underline">
                Change Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Automation Settings */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Automation Settings</h3>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Automatic Sending</label>
              <p className="text-sm text-gray-600">Automatically send birthday and anniversary messages</p>
            </div>
            <input
              type="checkbox"
              checked={settings.automaticSending}
              onChange={(e) => setSettings({ ...settings, automaticSending: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Send Time
              </label>
              <input
                type="time"
                value={settings.sendTime}
                onChange={(e) => setSettings({ ...settings, sendTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Emails
              </label>
              <input
                type="number"
                value={settings.maxDailyEmails}
                onChange={(e) => setSettings({ ...settings, maxDailyEmails: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="1000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Send on Weekends</label>
              <p className="text-sm text-gray-600">Allow sending messages on Saturday and Sunday</p>
            </div>
            <input
              type="checkbox"
              checked={settings.weekendSending}
              onChange={(e) => setSettings({ ...settings, weekendSending: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Retry Failed Emails</label>
              <p className="text-sm text-gray-600">Automatically retry failed email deliveries</p>
            </div>
            <input
              type="checkbox"
              checked={settings.retryFailedEmails}
              onChange={(e) => setSettings({ ...settings, retryFailedEmails: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Bell className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Notifications</label>
              <p className="text-sm text-gray-600">Receive notifications about system activity</p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Shield className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Security & Privacy</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Data Protection:</strong> All user data is encrypted and stored securely. 
              Email communications are sent through secure channels.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;