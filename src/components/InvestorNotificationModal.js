// components/InvestorNotificationModal.js
import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useApprovals } from '../hooks/useApprovals';

const InvestorNotificationModal = ({ currentUser, onClose }) => {
  const { notifications, markNotificationRead } = useApprovals();

  console.log('🔍 InvestorNotificationModal - notifications:', notifications);
  console.log('🔍 InvestorNotificationModal - notifications.length:', notifications.length);
  
  if (notifications.length === 0) {
    return null; // No notifications to show
  }

  const handleDismiss = async (notificationId) => {
  try {
    const result = await markNotificationRead(notificationId);
    
    if (result.success) {
      // Check if this was the last notification
      const remainingNotifications = notifications.filter(n => n.id !== notificationId);
      if (remainingNotifications.length === 0) {
        onClose(); // Close modal when no more notifications
      }
    }
  } catch (error) {
    console.error('Error dismissing notification:', error);
  }
};

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {notifications.map((notification, index) => (
          <div key={notification.id} className={`p-6 ${index > 0 ? 'border-t border-gray-700/50' : ''}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.type === 'approved' 
                    ? 'bg-green-500/20' 
                    : 'bg-red-500/20'
                }`}>
                  {notification.type === 'approved' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${
                    notification.type === 'approved' ? 'text-green-300' : 'text-red-300'
                  }`}>
                    Changes {notification.type === 'approved' ? 'Approved' : 'Rejected'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <p className="text-white text-sm leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                onClick={() => handleDismiss(notification.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] ${
                  notification.type === 'approved'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                OK, Got It
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvestorNotificationModal;