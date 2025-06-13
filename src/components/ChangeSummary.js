// components/ChangeSummary.js
import React, { useState } from 'react';
import { useApprovals } from '../hooks/useApprovals';
import { Send, Clock, AlertCircle, CheckCircle, X, Eye } from 'lucide-react';

export const ChangeSummary = ({ currentUser, showToastMessage, pendingChanges, pendingChangesCount, submitForApproval, loading }) => {
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingCount = pendingChangesCount;

  const handleSubmitForApproval = async () => {
    if (pendingCount === 0) {
      showToastMessage('No changes to submit', 3000);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitForApproval();
      
      if (result.success) {
        showToastMessage(`✅ ${result.message}`, 3000);
        setIsExpanded(false);
      } else {
        showToastMessage(`❌ ${result.message}`, 3000);
      }
    } catch (error) {
      showToastMessage(`❌ Failed to submit: ${error.message}`, 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFieldName = (fieldName) => {
    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  if (pendingCount === 0) {
    return null; // Don't show if no changes
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating Summary Button */}
      <div className={`transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group relative overflow-hidden bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 hover:from-yellow-500 hover:via-orange-500 hover:to-yellow-500 px-6 py-3 rounded-2xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 flex items-center space-x-3 ${isExpanded ? 'rounded-b-none' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          
          <div className="relative flex items-center space-x-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              {pendingCount > 0 ? (
                <Clock className="w-4 h-4" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">
                {pendingCount > 0 ? `${pendingCount} Pending Changes` : 'Changes Submitted'}
              </div>
            </div>
            <div className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl rounded-tr-none shadow-2xl w-96 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Your Changes</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors duration-200"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {/* Pending Changes */}
            {pendingCount > 0 && (
              <div className="p-4 border-b border-gray-700/50">
                <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Changes ({pendingCount})</span>
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Array.from(pendingChanges.values()).map((change, index) => (
                    <div key={index} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {formatFieldName(change.fieldName)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Item {change.itemId.replace('item-', '')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-300">
                        <span className="text-red-300">&quot;{change.oldValue || 'empty'}&quot;</span>
                        <span className="mx-2">→</span>
                        <span className="text-green-300">&quot;{change.newValue}&quot;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          {pendingCount > 0 && (
            <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700/50">
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitForApproval}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit for Approval</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    clearAllChanges();
                    showToastMessage('🧹 All changes cleared', 2000);
                  }}
                  className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  title="Clear all changes"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};