import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Heart, Save } from 'lucide-react';
import { User as UserType } from '../types';

interface UserFormProps {
  user?: UserType | null;
  onSave: (userData: Omit<UserType, 'id'>) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Lead' as 'Lead' | 'Client' | 'User',
    dateOfBirth: '',
    anniversaryDate: '',
    preferences: [] as string[],
  });
  const [nameParts, setNameParts] = useState({
    firstName: '',
    lastName: '',
  });

  const [preferencesInput, setPreferencesInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        category: user.category,
        dateOfBirth: user.dateOfBirth.toISOString().split('T')[0],
        anniversaryDate: user.anniversaryDate ? user.anniversaryDate.toISOString().split('T')[0] : '',
        preferences: user.preferences || [],
      });
      const [firstName, ...rest] = (user.name || '').split(' ');
      setNameParts({
        firstName: firstName || '',
        lastName: rest.join(' ') || '',
      });
      setPreferencesInput((user.preferences || []).join(', '));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNamePartChange = (field: 'firstName' | 'lastName', value: string) => {
    const updated = {
      ...nameParts,
      [field]: value,
    };
    setNameParts(updated);

    const fullName = [updated.firstName, updated.lastName].filter(Boolean).join(' ');
    setFormData(prev => ({
      ...prev,
      name: fullName,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const userData = {
      ...formData,
      dateOfBirth: new Date(formData.dateOfBirth),
      anniversaryDate: formData.anniversaryDate ? new Date(formData.anniversaryDate) : undefined,
      preferences: preferencesInput
        .split(',')
        .map(pref => pref.trim())
        .filter(pref => pref.length > 0),
    };

    onSave(userData);
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Lead': return 'Potential customers who have shown interest';
      case 'Client': return 'Active paying customers';
      case 'User': return 'General users of your service';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {user ? 'Edit User Profile' : 'Add New User'}
                </h3>
                <p className="text-indigo-100">
                  {user ? 'Update user information and preferences' : 'Create a new user profile for automated greetings'}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:text-indigo-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <User className="h-5 w-5 text-indigo-600" />
              <span>Basic Information</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameParts.firstName}
                      onChange={(e) => handleNamePartChange('firstName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameParts.lastName}
                      onChange={(e) => handleNamePartChange('lastName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-indigo-500'
                      }`}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'Lead' | 'Client' | 'User' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                >
                  <option value="Lead">Lead</option>
                  <option value="Client">Client</option>
                  <option value="User">User</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">{getCategoryDescription(formData.category)}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <span>Contact Information</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="Enter phone number"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-pink-600" />
              <span>Important Dates</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 transition-all duration-300 ${
                    errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-pink-500'
                  }`}
                />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>}
                <p className="mt-1 text-xs text-gray-500">Used for automatic birthday greetings</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Anniversary Date
                </label>
                <input
                  type="date"
                  value={formData.anniversaryDate}
                  onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300"
                />
                <p className="mt-1 text-xs text-gray-500">Optional: For anniversary greetings</p>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center space-x-2">
              <Heart className="h-5 w-5 text-purple-600" />
              <span>Interests & Preferences</span>
            </h4>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Interests/Hobbies
              </label>
              <input
                type="text"
                value={preferencesInput}
                onChange={(e) => setPreferencesInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                placeholder="e.g., travel, photography, cooking, sports, music"
              />
              <p className="mt-2 text-sm text-gray-500">
                💡 Separate multiple interests with commas. This helps create more personalized messages!
              </p>
              
              {/* Suggested Interests */}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Popular Interests:</p>
                <div className="flex flex-wrap gap-2">
                  {['travel', 'photography', 'cooking', 'sports', 'music', 'reading', 'gardening', 'technology'].map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        const current = preferencesInput.split(',').map(p => p.trim()).filter(p => p);
                        if (!current.includes(interest)) {
                          setPreferencesInput([...current, interest].join(', '));
                        }
                      }}
                      className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                    >
                      + {interest}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold"
            >
              <Save className="h-5 w-5" />
              <span>{user ? 'Update User' : 'Add User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;