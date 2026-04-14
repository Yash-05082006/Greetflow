import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  Calendar, 
  Target, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
  LineChart,
  RefreshCw
} from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import { apiClient } from '../services/apiClient';
import { formatDate } from '../utils/dateUtils';

type PopularTemplate = {
  id: string;
  name: string;
  template_type: 'uploaded' | 'ai_generated';
  usage_count: number;
};

type EmailStats = {
  total: number;
  success: number;
  failed: number;
  successRate: string;
};

const Analytics: React.FC = () => {
  const { users, emailLogs, loading, error, refreshData } = useDatabaseApi();
  const [timeRange, setTimeRange] = useState('30'); // days
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real data from backend
  const [popularTemplates, setPopularTemplates] = useState<PopularTemplate[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats>({ total: 0, success: 0, failed: 0, successRate: '0.0' });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchRealStats = async (days: string) => {
    setStatsLoading(true);
    try {
      const [tplRes, emailRes] = await Promise.all([
        apiClient.get<PopularTemplate[]>('/api/analytics/popular-templates', { limit: 5 }),
        apiClient.get<EmailStats>('/api/analytics/email-stats', { days }),
      ]);
      if (tplRes.data) setPopularTemplates(tplRes.data);
      if (emailRes.data) setEmailStats(emailRes.data);
    } catch (err) {
      console.error('[Analytics] Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchRealStats(timeRange);
  }, [timeRange]);

  // Calculate user metrics from useDatabaseApi (unchanged)
  const calculateUserMetrics = () => {
    const now = new Date();
    const rangeDate = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);
    const totalUsers = users.length;
    const newUsers = users.filter(user => new Date(user.dateOfBirth) >= rangeDate).length;
    const usersByCategory = {
      leads: users.filter(u => u.category === 'Lead').length,
      clients: users.filter(u => u.category === 'Client').length,
      users: users.filter(u => u.category === 'User').length,
    };
    return { totalUsers, newUsers, usersByCategory };
  };

  // Daily activity from emailLogs (unchanged)
  const calculateDailyActivity = () => {
    const now = new Date();
    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEmails = emailLogs.filter(log => {
        const logDate = new Date(log.sentAt);
        return logDate.toDateString() === date.toDateString();
      }).length;
      daily.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        emails: dayEmails,
      });
    }
    return daily;
  };

  // Event insights — count by subject keywords (safe fallback)
  const calculateEventInsights = () => ({
    birthday: emailLogs.filter(l =>
      (l.subject || '').toLowerCase().includes('birthday') ||
      (l.templateId || '').toLowerCase().includes('birthday')
    ).length,
    anniversary: emailLogs.filter(l =>
      (l.subject || '').toLowerCase().includes('anniversary') ||
      (l.templateId || '').toLowerCase().includes('anniversary')
    ).length,
    custom: emailLogs.filter(l => {
      const s = (l.subject || '').toLowerCase();
      const t = (l.templateId || '').toLowerCase();
      return !s.includes('birthday') && !s.includes('anniversary') &&
             !t.includes('birthday') && !t.includes('anniversary');
    }).length,
  });

  const userMetrics = calculateUserMetrics();
  const dailyActivity = calculateDailyActivity();
  const eventInsights = calculateEventInsights();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), fetchRealStats(timeRange)]);
    } catch (err) {
      console.error('Failed to refresh analytics:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Analytics...</h3>
          <p className="text-gray-600">Calculating performance metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-3">Analytics Dashboard</h2>
              <p className="text-indigo-100 text-xl">Comprehensive insights into your automation performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-xl border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <option value="7" className="text-gray-900">Last 7 days</option>
                <option value="30" className="text-gray-900">Last 30 days</option>
                <option value="90" className="text-gray-900">Last 90 days</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="group flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-xl hover:bg-opacity-30 transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-300`} />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{userMetrics.totalUsers}</p>
              <p className="text-sm text-emerald-600 font-medium">+{userMetrics.newUsers} this period</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Users className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Messages Sent</p>
              <p className="text-3xl font-bold text-gray-900">{statsLoading ? '…' : emailStats.success}</p>
              <p className="text-sm text-purple-600 font-medium">Last {timeRange} days</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Success Rate</p>
              <p className="text-3xl font-bold text-emerald-600">{statsLoading ? '…' : emailStats.successRate}%</p>
              <p className="text-sm text-emerald-600 font-medium">Delivery rate</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Failed Emails</p>
              <p className="text-3xl font-bold text-red-600">{statsLoading ? '…' : emailStats.failed}</p>
              <p className="text-sm text-red-600 font-medium">Need attention</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Category Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <PieChart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">User Categories</h3>
                <p className="text-blue-100">Distribution by user type</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Clients</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{userMetrics.usersByCategory.clients}</span>
                  <p className="text-sm text-gray-600">
                    {userMetrics.totalUsers > 0 ? Math.round((userMetrics.usersByCategory.clients / userMetrics.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Leads</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-amber-600">{userMetrics.usersByCategory.leads}</span>
                  <p className="text-sm text-gray-600">
                    {userMetrics.totalUsers > 0 ? Math.round((userMetrics.usersByCategory.leads / userMetrics.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Users</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-emerald-600">{userMetrics.usersByCategory.users}</span>
                  <p className="text-sm text-gray-600">
                    {userMetrics.totalUsers > 0 ? Math.round((userMetrics.usersByCategory.users / userMetrics.totalUsers) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Activity Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <LineChart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Daily Activity</h3>
                <p className="text-emerald-100">Email sending trends</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {dailyActivity.map((day, index) => {
                const maxEmails = Math.max(...dailyActivity.map(d => d.emails));
                const percentage = maxEmails > 0 ? (day.emails / maxEmails) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium text-gray-600">{day.date}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="w-8 text-sm font-bold text-gray-900">{day.emails}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Email Performance */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Email Performance</h3>
                <p className="text-purple-100">Detailed delivery analytics</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-emerald-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-emerald-600 mb-2">{statsLoading ? '…' : emailStats.success}</p>
              <p className="text-sm font-medium text-emerald-700">Successfully Sent</p>
            </div>
            
            <div className="text-center p-6 bg-red-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-red-600 mb-2">{statsLoading ? '…' : emailStats.failed}</p>
              <p className="text-sm font-medium text-red-700">Failed Deliveries</p>
            </div>
            
            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">{statsLoading ? '…' : emailStats.total}</p>
              <p className="text-sm font-medium text-blue-700">Total Sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Templates */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Popular Templates</h3>
              <p className="text-orange-100">Most used template designs</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {statsLoading ? (
              <p className="text-center text-gray-500 py-4">Loading...</p>
            ) : popularTemplates.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No templates used yet</p>
            ) : (
              popularTemplates.map((template, index) => (
                <div key={template.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500">
                        {template.template_type === 'ai_generated' ? 'AI Generated' : 'Uploaded'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{template.usage_count}</p>
                    <p className="text-sm text-gray-600">uses</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Failed Deliveries Log */}
      {emailStats.failed > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Failed Deliveries</h3>
                <p className="text-red-100">Issues requiring attention</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.emailStats.failed > 0 && emailLogs
                .filter(log => log.status === 'failed')
                .slice(0, 10)
                .map((log, index) => {
                  const user = users.find(u => u.id === log.userId);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                      <div>
                        <p className="font-semibold text-gray-900">{user?.name || 'Unknown User'}</p>
                        <p className="text-sm text-gray-600">{user?.email || 'No email'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">{log.errorMessage || 'Delivery failed'}</p>
                        <p className="text-xs text-gray-500">{formatDate(log.sentAt)}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Engagement Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Event Insights</h3>
                <p className="text-cyan-100">Automated event processing</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Birthday Events</span>
                <span className="text-xl font-bold text-yellow-600">{eventInsights.birthday}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Anniversary Events</span>
                <span className="text-xl font-bold text-pink-600">{eventInsights.anniversary}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">Custom Events</span>
                <span className="text-xl font-bold text-purple-600">{eventInsights.custom}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Peak Activity Times */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Peak Activity</h3>
                <p className="text-green-100">Busiest sending periods</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600 mb-2">9:00 AM</p>
                <p className="text-sm font-medium text-emerald-700">Peak Sending Time</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-gray-900">Monday</p>
                  <p className="text-sm text-gray-600">Busiest Day</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-gray-900">2.3s</p>
                  <p className="text-sm text-gray-600">Avg Response</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">System Health</h3>
              <p className="text-gray-200">Platform performance metrics</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <div className="w-3 h-3 bg-emerald-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-sm font-medium text-emerald-700">Database Connected</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-sm font-medium text-blue-700">Email Service Active</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="w-3 h-3 bg-purple-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <p className="text-sm font-medium text-purple-700">AI Templates Ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;