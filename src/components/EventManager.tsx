import React, { useState, useEffect } from 'react';
import { Calendar, Mail, Users, Filter, Send, Target, Zap, PlusCircle, Gift, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDatabaseApi } from '../hooks/useDatabaseApi';
import { User } from '../types';
import BulkSendModal from './BulkSendModal';
import AddEventModal from './AddEventModal';
import AddOccasionModal from './AddOccasionModal';

const EventManager: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 100;

  const { users, templates, getUpcomingEvents, loading, error, deleteUser } = useDatabaseApi();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [eventFilter, setEventFilter] = useState('All');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddOccasion, setShowAddOccasion] = useState(false);

  const upcomingEvents = getUpcomingEvents();

  useEffect(() => {
    const selectionStateJSON = sessionStorage.getItem('templateSelectionState');
    if (selectionStateJSON) {
      try {
        const selectionState = JSON.parse(selectionStateJSON);
        if (selectionState.selectedUserIds) {
          setSelectedUsers(selectionState.selectedUserIds);
        }
        if (selectionState.type === 'event') {
          setShowAddEvent(true);
        } else if (selectionState.type === 'occasion') {
          setShowAddOccasion(true);
        }
        // The state has been processed, so remove it to prevent re-triggering.
        sessionStorage.removeItem('templateSelectionState');
      } catch (e) {
        console.error("Failed to parse templateSelectionState", e);
        sessionStorage.removeItem('templateSelectionState');
      }
    }
  }, []);
  
  const filteredEvents = upcomingEvents.filter(event => {
    if (eventFilter === 'All') return true;
    return event.type === eventFilter.toLowerCase();
  });

  const handleUserSelection = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => {
      const isSelected = prev.includes(userId);
      return checked && !isSelected ? [...prev, userId] : prev.filter(id => id !== userId);
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleSelectPage = () => {
    const pageUserIds = users.map(u => u.id);
    const allSelectedOnPage = pageUserIds.every(id => selectedUsers.includes(id));
    if (allSelectedOnPage) {
      setSelectedUsers(selectedUsers.filter(id => !pageUserIds.includes(id)));
    } else {
      setSelectedUsers(prev => [...new Set([...prev, ...pageUserIds])]);
    }
  };

  const quickSelectByCategory = (category: string) => {
    const categoryUsers = users.filter(user => user.category === category);
    setSelectedUsers(categoryUsers.map(user => user.id));
  };

  const handleEditUser = (user: User) => {
    // TODO: Implement user editing logic, e.g., open a modal
    console.log('Editing user:', user);
    alert(`Editing ${user.name}`);
  };

  const handleDeleteUser = async (userId: string) => {
    // This function should call the deleteUser method from the useDatabase hook
    if (window.confirm('Are you sure you want to delete this user?')) {
      console.log('Deleting user:', userId);
      // await deleteUser(userId); // Example: This would trigger the Supabase call
      alert(`User ${userId} deleted. (This should trigger a Supabase call and a data refresh)`);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(users.length / usersPerPage);
  const indexOfFirstUser = (currentPage - 1) * usersPerPage;

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Events...</h3>
          <p className="text-gray-600">Fetching upcoming events and user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-4xl font-bold mb-3">Event Manager</h2>
              <p className="text-emerald-100 text-xl">Orchestrate automated events and bulk communications</p>
            </div>
            <button
              onClick={() => setShowBulkSend(true)}
              disabled={selectedUsers.length === 0}
              className={`group flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg font-semibold ${
                selectedUsers.length > 0
                  ? 'bg-white text-emerald-600 hover:bg-emerald-50 hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className={`h-5 w-5 ${selectedUsers.length > 0 ? 'group-hover:rotate-12' : ''} transition-transform duration-300`} />
              <span>Bulk Send ({selectedUsers.length})</span>
            </button>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white opacity-5 rounded-full"></div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Events</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Next 30 days</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">Ready to use</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm">
              <Mail className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Selected Users</p>
              <p className="text-2xl font-bold text-gray-900">{selectedUsers.length}</p>
              <p className="text-xs text-purple-600 font-medium mt-1">For bulk send</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
              <p className="text-xs text-orange-600 font-medium mt-1">Delivery rate</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0 shadow-sm">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Selection Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Selection</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-medium"
          >
            <Users className="h-4 w-4" />
            <span>{selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}</span>
          </button>
          <button
            onClick={() => quickSelectByCategory('Client')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-medium"
          >
            <Target className="h-4 w-4" />
            <span>All Clients</span>
          </button>
          <button
            onClick={() => quickSelectByCategory('Lead')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 font-medium"
          >
            <Zap className="h-4 w-4" />
            <span>All Leads</span>
          </button>
          <button
            onClick={() => quickSelectByCategory('User')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 font-medium"
          >
            <Users className="h-4 w-4" />
            <span>All Users</span>
          </button>
        </div>
      </div>

      {/* Event Filter */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl">
              <Filter className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-2">Filter Events</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="w-full md:w-auto px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-gray-50 focus:bg-white"
              >
                <option value="All">All Events</option>
                <option value="Birthday">Birthdays Only</option>
                <option value="Anniversary">Anniversaries Only</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddEvent(true)}
              disabled={selectedUsers.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 font-medium disabled:bg-gray-300 disabled:from-gray-300"
            >
              <PlusCircle className="h-5 w-5" />
              <span>Add Event</span>
            </button>
            <button
              onClick={() => setShowAddOccasion(true)}
              disabled={selectedUsers.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-300 font-medium disabled:bg-gray-300 disabled:from-gray-300"
            >
              <Gift className="h-5 w-5" />
              <span>Add Occasion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced User Selection Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-x-auto">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Select Recipients</h3>
            <div className="text-sm text-gray-600">{selectedUsers.length} selected</div>
          </div>
        </div>
        
        <div className="p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" onChange={handleSelectPage} checked={users.length > 0 && users.every(u => selectedUsers.includes(u.id))} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birthday</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anniversary</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <tr key={user.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input type="checkbox" checked={isSelected} onChange={(e) => handleUserSelection(user.id, e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.interest || 'No interest specified'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.category === 'Client' ? 'bg-blue-100 text-blue-800' :
                        user.category === 'Lead' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : '–'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.anniversaryDate ? new Date(user.anniversaryDate).toLocaleDateString() : '–'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onClick={() => handleEditUser(user)} className="text-indigo-600 hover:text-indigo-900"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-2xl">
          <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={handlePrevPage} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button onClick={handleNextPage} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to <span className="font-medium">{Math.min(indexOfFirstUser + usersPerPage, users.length)}</span> of{' '}
                <span className="font-medium">{users.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button onClick={handlePrevPage} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button onClick={handleNextPage} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {showBulkSend && (
        <BulkSendModal
          selectedUserIds={selectedUsers}
          eventFilter={eventFilter}
          onClose={() => setShowBulkSend(false)}
          onSend={() => {
            setShowBulkSend(false);
            setSelectedUsers([]);
          }}
        />
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <AddEventModal
          selectedUserIds={selectedUsers}
          onClose={() => setShowAddEvent(false)}
          onSend={() => {
            setShowAddEvent(false);
            setSelectedUsers([]);
          }}
        />
      )}

      {/* Add Occasion Modal */}
      {showAddOccasion && (
        <AddOccasionModal
          selectedUserIds={selectedUsers}
          onClose={() => setShowAddOccasion(false)}
          onSend={() => {
            setShowAddOccasion(false);
            setSelectedUsers([]);
          }}
        />
      )}
    </div>
  );
};

export default EventManager;