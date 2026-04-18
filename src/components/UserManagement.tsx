import React, { useRef, useState, useEffect } from 'react';
import {
  Plus, Search, Edit, Trash2, Users, Filter, Star,
  RefreshCw, AlertCircle, ChevronLeft, ChevronRight,
  Upload, Download, X, CheckCircle, Loader2
} from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import UserForm from './UserForm';
import { User } from '../types';
import { formatDate } from '../utils/dateUtils';
import { apiClient } from '../services/apiClient';

// ─────────────────────────────────────────────────────────────────────────────
// ImportModal
// ─────────────────────────────────────────────────────────────────────────────
const ImportModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [importResult, setImportResult] = useState<{
    inserted: number; skipped: number; total: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setMessage('Only CSV files are accepted.');
      setStatus('error');
      return;
    }
    setFile(f);
    setMessage('');
    setStatus('idle');
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', file);

      const json = await apiClient.postFormData('/api/users/import', form) as any;

      if (json.success) {
        setStatus('done');
        setMessage(json.message || 'Import complete.');
        setImportResult({
          inserted: json.inserted ?? 0,
          skipped:  json.skipped  ?? 0,
          total:    json.total    ?? 0,
          errors:   Array.isArray(json.errors) ? json.errors : [],
        });
        onSuccess();
      } else {
        setStatus('error');
        setMessage(json.message || 'Import failed. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Import failed. Please try again.');
    }
  };

  // Auto-close 3.5 s after a clean successful import (inserted > 0, no errors)
  useEffect(() => {
    if (status !== 'done' || !importResult) return;
    if (importResult.inserted > 0 && importResult.errors.length === 0) {
      const t = setTimeout(() => onClose(), 3500);
      return () => clearTimeout(t);
    }
  }, [status, importResult, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Upload className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Import Users</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl p-8 text-center cursor-pointer transition-all group"
          >
            <Upload className="h-10 w-10 text-indigo-400 group-hover:text-indigo-600 mx-auto mb-3 transition-colors" />
            {file ? (
              <p className="text-sm font-semibold text-indigo-700">{file.name}</p>
            ) : (
              <p className="text-sm text-gray-500">
                Click to select a file<br />
                <span className="text-xs text-gray-400">or drag and drop here</span>
              </p>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Supported type label */}
          <p className="text-xs text-gray-500 text-center">
            Supported file type: <span className="font-semibold text-gray-700">CSV</span>
          </p>

          {/* CSV column hint */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">Accepted CSV columns:</p>
            <p className="text-xs text-gray-500 font-mono leading-relaxed">
              <span className="text-indigo-600 font-bold">name</span>, <span className="text-indigo-600 font-bold">email</span>, phone, category<br />
              birthday <span className="text-gray-400">or</span> date_of_birth <span className="text-gray-400">or</span> dob<br />
              anniversary <span className="text-gray-400">or</span> anniversary_date
            </p>
            <p className="text-xs text-gray-400 mt-1">* name and email are required</p>
          </div>

          {/* Status: success */}
          {status === 'done' && importResult && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">{message}</p>
              </div>
              {/* Stats bar */}
              <div className="flex gap-3 text-center">
                <div className="flex-1 bg-emerald-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-emerald-700">{importResult.inserted}</p>
                  <p className="text-xs text-emerald-600">Inserted</p>
                </div>
                <div className="flex-1 bg-amber-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-amber-700">{importResult.skipped}</p>
                  <p className="text-xs text-amber-600">Skipped</p>
                </div>
                <div className="flex-1 bg-gray-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-gray-700">{importResult.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
              {/* Per-row errors */}
              {importResult.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1.5">Skip details:</p>
                  <ul className="space-y-0.5 max-h-28 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <li key={i} className="text-xs text-amber-600">{e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {/* Status: error */}
          {status === 'error' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
          >
            {status === 'done' ? 'Close' : 'Cancel'}
          </button>
          {status !== 'done' && (
            <button
              onClick={handleImport}
              disabled={!file || status === 'uploading'}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'uploading' ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="h-4 w-4" /> Import</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UserManagement
// ─────────────────────────────────────────────────────────────────────────────
const UserManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 50;

  const {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refreshData,
  } = useDatabaseApi();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || user.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Reset page and selection whenever the filtered set changes
  useEffect(() => { 
    setCurrentPage(1); 
    setSelectedUserIds([]);
  }, [searchTerm, categoryFilter]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfFirstUser = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfFirstUser + usersPerPage);

  const allCurrentUsersSelected = currentUsers.length > 0 && currentUsers.every(user => selectedUserIds.includes(user.id));

  // Clear selection on page change
  useEffect(() => {
    setSelectedUserIds([]);
  }, [currentPage]);

  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));

  const handleAddUser = async (userData: Omit<User, 'id'>) => {
    try {
      await addUser(userData);
      setShowUserForm(false);
    } catch {
      alert('Failed to add user. Please try again.');
    }
  };

  const handleEditUser = async (userData: Omit<User, 'id'>) => {
    if (!editingUser) return;
    try {
      await updateUser(editingUser.id, userData);
      setEditingUser(null);
      setShowUserForm(false);
    } catch {
      alert('Failed to update user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await deleteUser(userId);
    } catch {
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSelectedUserIds([]);
    try { await refreshData(); } catch { /* silent */ } finally { setIsRefreshing(false); }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (allCurrentUsersSelected) {
      // Unselect all on current page
      const currentIds = currentUsers.map(u => u.id);
      setSelectedUserIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      // Select all on current page (only adding those not already selected)
      const newSelections = currentUsers.map(u => u.id).filter(id => !selectedUserIds.includes(id));
      setSelectedUserIds(prev => [...prev, ...newSelections]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} users? This action cannot be undone.`)) return;
    
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedUserIds.map(id => deleteUser(id)));
      setSelectedUserIds([]);
    } catch {
      alert('Failed to delete some users. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await apiClient.getBlob('/api/users/export');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `greetflow-users-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const stats = {
    total: users.length,
    clients: users.filter(u => u.category === 'Client').length,
    leads: users.filter(u => u.category === 'Lead').length,
    users: users.filter(u => u.category === 'User').length,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Database Connection Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold mb-1">User Management</h2>
            <p className="text-indigo-100 text-base">Manage your leads, clients, and users</p>
          </div>

          {/* Two-row button group */}
          <div className="flex flex-col gap-2">
            {/* Row 1 */}
            <div className="flex items-center gap-2">
              {selectedUserIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-semibold shadow-md whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  {isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedUserIds.length})`}
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || isBulkDeleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => { setEditingUser(null); setShowUserForm(true); }}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all text-sm font-semibold shadow-md whitespace-nowrap disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add New User
              </button>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium whitespace-nowrap"
              >
                <Upload className="h-4 w-4" />
                Import Data
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all text-sm font-medium disabled:opacity-50 whitespace-nowrap"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white opacity-5 rounded-full" />
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, sub: 'In database', gradient: 'from-indigo-500 to-purple-600', Icon: Users },
          { label: 'Clients', value: stats.clients, sub: 'High priority', gradient: 'from-blue-500 to-blue-600', Icon: Star },
          { label: 'Leads', value: stats.leads, sub: 'Converting', gradient: 'from-amber-500 to-orange-500', Icon: Filter },
          { label: 'Active Users', value: stats.users, sub: 'Engaged', gradient: 'from-emerald-500 to-green-600', Icon: Users },
        ].map(({ label, value, sub, gradient, Icon }) => (
          <div key={label} className="group bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-gray-50 focus:bg-white"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="sm:w-48 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 focus:bg-white transition-all"
          >
            <option value="All">All Categories</option>
            <option value="Lead">Leads</option>
            <option value="Client">Clients</option>
            <option value="User">Users</option>
          </select>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="text-center py-16">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Users className="h-7 w-7 text-white" />
          </div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3 w-12 mt-0.5">
                  <input
                    type="checkbox"
                    checked={allCurrentUsersSelected}
                    onChange={handleSelectAll}
                    disabled={isBulkDeleting}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                  />
                </th>
                {['Name', 'Email', 'Phone', 'Category', 'Birthday', 'Anniversary', 'Actions'].map(h => (
                  <th key={h} scope="col" className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 w-12">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      disabled={isBulkDeleting}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                    {(user.preferences || []).length > 0 && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{(user.preferences || []).join(', ')}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{user.phone || '–'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${
                      user.category === 'Client' ? 'bg-blue-100 text-blue-800' :
                      user.category === 'Lead'   ? 'bg-orange-100 text-orange-800' :
                                                   'bg-green-100 text-green-800'
                    }`}>
                      {user.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{formatDate(user.dateOfBirth)}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-500">{user.anniversaryDate ? formatDate(user.anniversaryDate) : '–'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingUser(user); setShowUserForm(true); }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{indexOfFirstUser + 1}</span>–
                <span className="font-semibold">{Math.min(indexOfFirstUser + usersPerPage, filteredUsers.length)}</span> of{' '}
                <span className="font-semibold">{filteredUsers.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 font-medium">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-5">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500 mb-6 text-sm">
            {searchTerm || categoryFilter !== 'All'
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first user'}
          </p>
          <button
            onClick={() => { setEditingUser(null); setShowUserForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Your First User
          </button>
        </div>
      )}

      {/* ── User Form Modal ──────────────────────────────────────────────────── */}
      {showUserForm && (
        <UserForm
          user={editingUser}
          onSave={editingUser ? handleEditUser : handleAddUser}
          onCancel={() => { setShowUserForm(false); setEditingUser(null); }}
        />
      )}

      {/* ── Import Modal ─────────────────────────────────────────────────────── */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => { handleRefresh(); setCurrentPage(1); }}
        />
      )}
    </div>
  );
};

export default UserManagement;