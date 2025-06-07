import React, { useState } from 'react';
import { UserCircle, Settings, LogOut } from 'lucide-react';

const ProfileDropdown = ({ user, onUpdate, onLogout, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user.username || '',
    email: user.email
  });
  const [editError, setEditError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setEditError('');
    
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      setEditError(error.message);
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50">
      <div className="p-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <UserCircle className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.username || 'User'}</h3>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <span className="inline-block bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full mt-1">
              {user.role}
            </span>
          </div>
        </div>

        {/* Edit Profile Form */}
        {isEditing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            {editError && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg text-sm">
                {editError}
              </div>
            )}
            
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-1 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">Username</label>
              <input
                type="text"
                value={editData.username}
                onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
                placeholder="Enter username"
              />
            </div>
            
            <div className="group">
              <label className="block text-sm font-medium text-gray-300 mb-1 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">Email</label>
              <input
                type="email"
                required
                value={editData.email}
                onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors duration-200 text-left"
            >
              <Settings className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">Edit Profile</span>
            </button>
            
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors duration-200 text-left"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="text-red-300">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileDropdown;