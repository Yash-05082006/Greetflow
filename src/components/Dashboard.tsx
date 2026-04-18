import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Users, Mail, TrendingUp, Clock, CheckCircle, Zap, Target, Award, Activity, RefreshCw, AlertCircle, LogOut, History } from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import { supabase } from '../lib/supabase';
import { formatDate, isToday, isTomorrow, isThisWeek } from '../utils/dateUtils';

type EmailHistoryRow = {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  status: string;
  sent_at?: string | null;
  created_at: string;
};

type RecentActivityRange = '24h' | '48h' | '7d';

const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { users, emailLogs, loading, error, getUpcomingEvents, refreshData } = useDatabaseApi();
  const upcomingEvents = getUpcomingEvents();
  
  // Email History state
  const [activeTab, setActiveTab] = useState<'recent' | 'history'>('recent');
  const [emailHistory, setEmailHistory] = useState<EmailHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [hiddenHistoryIds, setHiddenHistoryIds] = useState<string[]>([]);
  const [isHistoryViewCleared, setIsHistoryViewCleared] = useState(false);

  const [recentActivityRange, setRecentActivityRange] = useState<RecentActivityRange>('24h');
  const [recentActivity, setRecentActivity] = useState<EmailHistoryRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  const activeTabRef = useRef(activeTab);
  const currentPageRef = useRef(currentPage);
  const recentActivityRangeRef = useRef(recentActivityRange);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    recentActivityRangeRef.current = recentActivityRange;
  }, [recentActivityRange]);

  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      onLogout();
    }
  }, [onLogout]);

  const PAGE_SIZE = 20;
  const RECENT_LIMIT = 10;

  const normalizeStatus = (raw: string | null | undefined): 'sent' | 'failed' | 'pending' => {
    const value = String(raw || '').toLowerCase();
    if (value === 'sent') return 'sent';
    if (value === 'failed') return 'failed';
    if (value === 'pending') return 'pending';
    if (value === 'succeeded') return 'sent';
    if (value === 'error') return 'failed';
    return 'pending';
  };

  const getRecentCutoffIso = useCallback((range: RecentActivityRange) => {
    const now = Date.now();
    const ms =
      range === '24h' ? 24 * 60 * 60 * 1000 :
      range === '48h' ? 48 * 60 * 60 * 1000 :
      7 * 24 * 60 * 60 * 1000;
    return new Date(now - ms).toISOString();
  }, []);

  const formatRecentActivityDate = useCallback((value: string | null | undefined) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  const isWithinRecentRange = useCallback((sentAt: string | null | undefined, range: RecentActivityRange) => {
    if (!sentAt) return false;
    const t = new Date(sentAt).getTime();
    if (Number.isNaN(t)) return false;
    const cutoff = new Date(getRecentCutoffIso(range)).getTime();
    return t >= cutoff;
  }, [getRecentCutoffIso]);

  const fetchRecentActivity = useCallback(async (silent = false) => {
    if (!silent) setRecentLoading(true);
    setRecentError(null);

    try {
      const cutoffIso = getRecentCutoffIso(recentActivityRange);
      const { data, error: fetchError } = await supabase
        .from('email_logs')
        .select('id, recipient_email, recipient_name, subject, status, sent_at, created_at')
        .gte('sent_at', cutoffIso)
        .order('sent_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(RECENT_LIMIT);

      if (fetchError) {
        throw fetchError;
      }

      setRecentActivity((data || []) as EmailHistoryRow[]);
    } catch (err) {
      console.error('Failed to fetch recent activity:', err);
      setRecentError('Failed to load recent activity');
    } finally {
      if (!silent) setRecentLoading(false);
    }
  }, [RECENT_LIMIT, getRecentCutoffIso, recentActivityRange]);

  useEffect(() => {
    if (activeTab === 'recent') {
      fetchRecentActivity();
    }
  }, [activeTab, recentActivityRange, fetchRecentActivity]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-recent-email-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_logs' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const inserted: EmailHistoryRow = {
            id: String(row.id || ''),
            recipient_email: String(row.recipient_email || ''),
            recipient_name: String(row.recipient_name || ''),
            subject: String(row.subject || ''),
            status: String(row.status || ''),
            sent_at: (row.sent_at as string | null | undefined) ?? null,
            created_at: String(row.created_at || new Date().toISOString()),
          };

          if (!inserted.id) return;
          if (!isWithinRecentRange(inserted.sent_at ?? null, recentActivityRangeRef.current)) return;

          setRecentActivity(prev => {
            if (prev.some(item => item.id === inserted.id)) return prev;
            return [inserted, ...prev].slice(0, RECENT_LIMIT);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [RECENT_LIMIT, isWithinRecentRange]);

  const fetchEmailHistory = useCallback(async (silent = false) => {
    if (!silent) setHistoryLoading(true);
    setHistoryError(null);

    try {
      const offset = (currentPage - 1) * PAGE_SIZE;
      const { data, error: fetchError, count } = await supabase
        .from('email_logs')
        .select('id, recipient_email, recipient_name, subject, status, sent_at, created_at', { count: 'exact' })
        .order('sent_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (fetchError) {
        throw fetchError;
      }

      setEmailHistory((data || []) as EmailHistoryRow[]);
      const total = typeof count === 'number' ? count : (data || []).length;
      setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    } catch (err) {
      console.error('Failed to fetch email history:', err);
      setHistoryError('Failed to load email history');
    } finally {
      if (!silent) setHistoryLoading(false);
    }
  }, [PAGE_SIZE, currentPage]);

  // Fetch email history when tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      fetchEmailHistory();
    }
  }, [activeTab, currentPage, fetchEmailHistory]);

  // Live updates - poll every 10 seconds when on history tab
  useEffect(() => {
    if (activeTab === 'history') {
      const interval = setInterval(() => {
        fetchEmailHistory(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, currentPage, fetchEmailHistory]);

  useEffect(() => {
    const channel = supabase
      .channel('dashboard-email-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'email_logs' },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const inserted: EmailHistoryRow = {
            id: String(row.id || ''),
            recipient_email: String(row.recipient_email || ''),
            recipient_name: String(row.recipient_name || ''),
            subject: String(row.subject || ''),
            status: String(row.status || ''),
            sent_at: (row.sent_at as string | null | undefined) ?? null,
            created_at: String(row.created_at || new Date().toISOString()),
          };

          if (!inserted.id) return;

          if (activeTabRef.current === 'history' && currentPageRef.current !== 1) {
            setCurrentPage(1);
          }

          setEmailHistory(prev => {
            if (prev.some(item => item.id === inserted.id)) return prev;
            if (activeTabRef.current !== 'history') return prev;
            if (isHistoryViewCleared) return prev;
            return [inserted, ...prev].slice(0, PAGE_SIZE);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [PAGE_SIZE, isHistoryViewCleared]);

  const hiddenHistoryIdSet = useMemo(() => new Set(hiddenHistoryIds), [hiddenHistoryIds]);
  const visibleEmailHistory = useMemo(
    () => (isHistoryViewCleared ? [] : emailHistory.filter(item => !hiddenHistoryIdSet.has(item.id))),
    [emailHistory, hiddenHistoryIdSet, isHistoryViewCleared]
  );

  const selectedHistoryIdSet = useMemo(() => new Set(selectedHistoryIds), [selectedHistoryIds]);
  const allVisibleSelected = visibleEmailHistory.length > 0 && visibleEmailHistory.every(item => selectedHistoryIdSet.has(item.id));

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    onLogout();
  };


  const todayEvents = upcomingEvents.filter(event => isToday(event.date));
  const tomorrowEvents = upcomingEvents.filter(event => isTomorrow(event.date));
  const thisWeekEvents = upcomingEvents.filter(event => isThisWeek(event.date));

  const sentEmailsThisMonth = emailLogs.filter(log => {
    const logDate = new Date(log.sentAt);
    const now = new Date();
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
  }).length;

  const successRate = emailLogs.length > 0 
    ? ((emailLogs.filter(log => log.status === 'sent').length / emailLogs.length) * 100).toFixed(1)
    : '0.0';

  const stats = [
    {
      title: 'Total Users',
      value: users.length,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      change: '+12%',
      changeType: 'positive',
      description: 'In database'
    },
    {
      title: 'Today\'s Events',
      value: todayEvents.length,
      icon: Calendar,
      gradient: 'from-emerald-500 to-teal-500',
      change: `${todayEvents.length} pending`,
      changeType: 'neutral',
      description: 'Scheduled today'
    },
    {
      title: 'Messages Sent',
      value: sentEmailsThisMonth.toString(),
      icon: Mail,
      gradient: 'from-purple-500 to-pink-500',
      change: '+8%',
      changeType: 'positive',
      description: 'This month'
    },
    {
      title: 'Success Rate',
      value: `${successRate}%`,
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-500',
      change: '+2.1%',
      changeType: 'positive',
      description: 'Delivery rate'
    },
  ];

  const quickActions = [
    { title: 'Send Bulk Message', icon: Zap, color: 'from-indigo-500 to-purple-500' },
    { title: 'Create Template', icon: Target, color: 'from-pink-500 to-rose-500' },
    { title: 'View Analytics', icon: Activity, color: 'from-emerald-500 to-teal-500' },
    { title: 'Export Data', icon: Award, color: 'from-amber-500 to-orange-500' },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Database Connection Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Retry Connection</span>
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h3>
          <p className="text-gray-600">Fetching your business data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full animate-pulse"></div>
            <div className="absolute top-20 right-20 w-16 h-16 bg-white opacity-5 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute bottom-10 left-1/3 w-12 h-12 bg-white opacity-10 rounded-full animate-pulse delay-500"></div>
          </div>
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start">
            <h2 className="text-4xl font-bold mb-3">Welcome to GreetFlow</h2>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all duration-300 font-medium"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>

          <p className="text-indigo-100 text-xl mb-6">
            Your intelligent relationship management system with persistent data storage
          </p>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-indigo-100 font-medium">Database Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></div>
              <span className="text-indigo-100 font-medium">Email Service Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse delay-600"></div>
              <span className="text-indigo-100 font-medium">AI Templates Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-4 bg-gradient-to-br ${stat.gradient} rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stat.changeType === 'positive' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="group relative p-6 rounded-xl border-2 border-gray-200 hover:border-transparent transition-all duration-300 hover:shadow-xl hover:scale-[1.03] overflow-hidden bg-white"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10 flex flex-col items-center">
                  <Icon className="h-8 w-8 mb-3 text-gray-600 group-hover:text-white transition-colors duration-300" />
                  <p className="font-semibold text-gray-900 group-hover:text-white transition-colors duration-300">{action.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Events - Enhanced */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Today's Events</h3>
                <p className="text-indigo-100">Events scheduled for today</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{todayEvents.length}</p>
              <p className="text-indigo-100 text-sm">Active</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {todayEvents.length > 0 ? (
            <div className="space-y-4">
              {todayEvents.map((event, index) => (
                <div key={index} className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-indigo-50 hover:to-purple-50 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${
                      event.type === 'birthday' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-pink-400 to-rose-400'
                    } shadow-lg`}></div>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{event.user.name}</p>
                      <p className="text-sm text-gray-600">
                        {event.type === 'birthday' ? '🎂 Birthday' : '💕 Anniversary'} • {event.user.category}
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Send</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">All caught up!</p>
              <p className="text-gray-600">No events scheduled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tomorrow's Events */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Tomorrow</h3>
                <p className="text-emerald-100">{tomorrowEvents.length} events</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {tomorrowEvents.length > 0 ? (
              <div className="space-y-3">
                {tomorrowEvents.slice(0, 4).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'birthday' ? 'bg-yellow-400' : 'bg-pink-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.user.name}</p>
                        <p className="text-xs text-gray-600">
                          {event.type === 'birthday' ? '🎂 Birthday' : '💕 Anniversary'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      event.user.category === 'Client' ? 'bg-blue-100 text-blue-700' :
                      event.user.category === 'Lead' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {event.user.category}
                    </span>
                  </div>
                ))}
                {tomorrowEvents.length > 4 && (
                  <p className="text-xs text-gray-500 text-center pt-2">+{tomorrowEvents.length - 4} more events</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No events tomorrow</p>
              </div>
            )}
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">This Week</h3>
                <p className="text-purple-100">{thisWeekEvents.length} events</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {thisWeekEvents.length > 0 ? (
              <div className="space-y-3">
                {thisWeekEvents.slice(0, 5).map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'birthday' ? 'bg-yellow-400' : 'bg-pink-400'
                      }`}></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{event.user.name}</p>
                        <p className="text-xs text-gray-600">{formatDate(event.date)}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      event.user.category === 'Client' ? 'bg-blue-100 text-blue-700' :
                      event.user.category === 'Lead' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {event.user.category}
                    </span>
                  </div>
                ))}
                {thisWeekEvents.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">+{thisWeekEvents.length - 5} more events</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No events this week</p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Email Activity Section with Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Email Activity</h3>
            <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'recent'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Recent Activity</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>Email History</span>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Recent Activity Tab */}
          {activeTab === 'recent' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <select
                  value={recentActivityRange}
                  onChange={(e) => setRecentActivityRange(e.target.value as RecentActivityRange)}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
                  aria-label="Recent activity time range"
                >
                  <option value="24h">Last 24 hours</option>
                  <option value="48h">Last 48 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>
              </div>

              {recentLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="mx-auto h-8 w-8 text-indigo-600 animate-spin mb-3" />
                  <p className="text-gray-600">Loading recent activity...</p>
                </div>
              ) : recentError ? (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-3" />
                  <p className="text-red-600 font-medium mb-2">Error Loading Recent Activity</p>
                  <p className="text-gray-600 text-sm">{recentError}</p>
                </div>
              ) : recentActivity.map((item) => {
                const normalized = normalizeStatus(item.status);
                const displayName = item.recipient_name || item.recipient_email || 'Unknown';
                const displayDate = formatRecentActivityDate(item.sent_at || item.created_at);

                return (
                  <div key={item.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-3 h-3 rounded-full ${
                      normalized === 'sent' ? 'bg-emerald-400' :
                      normalized === 'failed' ? 'bg-red-400' :
                      'bg-blue-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {normalized === 'failed' ? 'Email delivery failed to ' : 'Email sent successfully to '}{displayName}
                      </p>
                      <p className="text-xs text-gray-600">To: {item.recipient_email}</p>
                    </div>
                    <p className="text-xs text-gray-500">{displayDate}</p>
                  </div>
                );
              })}

              {!recentLoading && !recentError && recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <Mail className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No email activity yet</p>
                </div>
              )}
            </div>
          )}

          {/* Email History Tab */}
          {activeTab === 'history' && (
            <div>
              {historyLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="mx-auto h-8 w-8 text-indigo-600 animate-spin mb-3" />
                  <p className="text-gray-600">Loading email history...</p>
                </div>
              ) : historyError ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-3" />
                  <p className="text-red-600 font-medium mb-2">Error Loading History</p>
                  <p className="text-gray-600 text-sm mb-4">{historyError}</p>
                  <button
                    onClick={() => fetchEmailHistory()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : visibleEmailHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No email history found</p>
                  <p className="text-gray-400 text-sm mt-1">Email records will appear here once sent</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-end space-x-2 mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedHistoryIds.length === 0) return;
                        setHiddenHistoryIds(prev => Array.from(new Set([...prev, ...selectedHistoryIds])));
                        setSelectedHistoryIds([]);
                      }}
                      disabled={selectedHistoryIds.length === 0}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Selected
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsHistoryViewCleared(true);
                        setHiddenHistoryIds([]);
                        setSelectedHistoryIds([]);
                      }}
                      disabled={emailHistory.length === 0}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Clear View
                    </button>
                  </div>

                  {/* Email History Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    setSelectedHistoryIds(visibleEmailHistory.map(item => item.id));
                                  } else {
                                    setSelectedHistoryIds([]);
                                  }
                                }}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                aria-label="Select all"
                              />
                              <span>Recipient Email</span>
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {visibleEmailHistory.map((item) => {
                          const normalized = normalizeStatus(item.status);
                          const sentAtValue = item.sent_at || item.created_at;
                          const isSelected = selectedHistoryIdSet.has(item.id);

                          return (
                          <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectedHistoryIds(prev => {
                                      if (checked) return Array.from(new Set([...prev, item.id]));
                                      return prev.filter(id => id !== item.id);
                                    });
                                  }}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  aria-label={`Select ${item.recipient_email}`}
                                />
                                <div className="text-sm text-gray-900">{item.recipient_email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.recipient_name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 max-w-xs truncate" title={item.subject}>
                                {item.subject}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                normalized === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                                normalized === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {normalized === 'sent' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {normalized === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {normalized === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                {normalized.charAt(0).toUpperCase() + normalized.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(sentAtValue).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;