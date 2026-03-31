import React, { useState } from 'react';
import { Calendar, Users, Mail, Settings, Home, Bell, Sparkles, BarChart3 } from 'lucide-react';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import TemplateManager from './components/TemplateManager';
import EventManager from './components/EventManager';
import SettingsPanel from './components/SettingsPanel';
import Analytics from './components/Analytics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: Home, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'users', name: 'Users', icon: Users, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'templates', name: 'Templates', icon: Mail, gradient: 'from-purple-500 to-pink-500' },
    { id: 'events', name: 'Events', icon: Calendar, gradient: 'from-orange-500 to-red-500' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, gradient: 'from-indigo-500 to-purple-500' },
    { id: 'settings', name: 'Settings', icon: Settings, gradient: 'from-gray-500 to-gray-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'templates':
        return <TemplateManager />;
      case 'events':
        return <EventManager />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header */}
      <header className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                <Bell className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  GreetFlow
                </h1>
                <p className="text-sm text-gray-600">Business Automation Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm font-medium text-gray-700">System Active</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300 shadow-lg"></div>
                <span className="text-sm font-medium text-gray-700">Auto-Send On</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Sidebar Navigation */}
          <div className="lg:w-80 flex-shrink-0">
            <nav className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-32">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Navigation</h3>
                <p className="text-sm text-gray-600">Manage your business relationships</p>
              </div>
              <ul className="space-y-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`group w-full flex items-center px-4 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg transform scale-105`
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 hover:shadow-md'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mr-4 transition-all duration-300 ${
                          isActive 
                            ? 'bg-white bg-opacity-20' 
                            : 'bg-gray-100 group-hover:bg-gray-200'
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'
                          }`} />
                        </div>
                        <span className="flex-1 text-left">{item.name}</span>
                        {isActive && (
                          <Sparkles className="h-4 w-4 text-white opacity-75" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              
              {/* Navigation Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-indigo-700 mb-1">Pro Tip</p>
                  <p className="text-xs text-indigo-600">Use bulk send to reach multiple clients efficiently!</p>
                </div>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 min-h-[600px]">
              <div className="p-8">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;