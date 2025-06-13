// hooks/useChangeTracker.js
import React, { useState, useCallback } from 'react';

// Helper functions for localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// Convert Map to Array for storage
const mapToArray = (map) => Array.from(map.entries());
const arrayToMap = (array) => new Map(array || []);

// External store with localStorage persistence
const changeStore = {
  state: {
    pendingChanges: arrayToMap(loadFromStorage('pendingChanges', [])),
    submittedChanges: arrayToMap(loadFromStorage('submittedChanges', [])),
    approvalRequests: loadFromStorage('approvalRequests', []),
    investorNotifications: loadFromStorage('investorNotifications', [])
  },
  
  listeners: new Set(),
  
  subscribe(callback) {
    changeStore.listeners.add(callback);
    return () => {
      changeStore.listeners.delete(callback);
    };
  },
  
  getSnapshot() {
    return changeStore.state;
  },
  
  setState(newState) {
    changeStore.state = { ...changeStore.state, ...newState };
    
    // Persist to localStorage
    if (newState.pendingChanges) {
      saveToStorage('pendingChanges', mapToArray(newState.pendingChanges));
    }
    if (newState.submittedChanges) {
      saveToStorage('submittedChanges', mapToArray(newState.submittedChanges));
    }
    if (newState.approvalRequests) {
      saveToStorage('approvalRequests', newState.approvalRequests);
    }
    if (newState.investorNotifications) {
      saveToStorage('investorNotifications', newState.investorNotifications);
    }
    
    changeStore.listeners.forEach(callback => callback());
  },
  
  // Track a new change
  trackChange(itemId, fieldName, oldValue, newValue, userRole) {
    const changeKey = `${itemId}-${fieldName}`;
    
    console.log(`📝 Tracking change: ${changeKey}`, { oldValue, newValue, userRole });
    
    if (userRole === 'admin') {
      return 'direct';
    }
    
    const newChanges = new Map(changeStore.state.pendingChanges);
    
    if (oldValue === newValue) {
      newChanges.delete(changeKey);
      console.log(`🗑️ Removed change (back to original): ${changeKey}`);
    } else {
      newChanges.set(changeKey, {
        itemId,
        fieldName,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        userRole
      });
      console.log(`✅ Change tracked: ${changeKey}`);
    }
    
    changeStore.setState({ pendingChanges: newChanges });
    return 'tracked';
  },
  
  // Get changes for a specific item
  getItemChanges(itemId) {
    const changes = {};
    for (const [key, change] of changeStore.state.pendingChanges) {
      if (change.itemId === itemId) {
        changes[change.fieldName] = change;
      }
    }
    return changes;
  },
  
  // Check if a field has pending changes
  hasFieldChange(itemId, fieldName) {
    const changeKey = `${itemId}-${fieldName}`;
    return changeStore.state.pendingChanges.has(changeKey);
  },
  
  // Get the new value for a field (if changed)
  getFieldNewValue(itemId, fieldName) {
    const changeKey = `${itemId}-${fieldName}`;
    const change = changeStore.state.pendingChanges.get(changeKey);
    return change?.newValue;
  },
  
  // Submit changes for approval
  submitForApproval(userId, userName) {
    const changes = Array.from(changeStore.state.pendingChanges.values());
    
    if (changes.length === 0) {
      return { success: false, message: 'No changes to submit' };
    }
    
    const approvalRequest = {
      id: `approval-${Date.now()}`,
      userId,
      userName,
      changes,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    const newApprovalRequests = [...changeStore.state.approvalRequests, approvalRequest];
    const newSubmittedChanges = new Map(changeStore.state.submittedChanges);
    
    changes.forEach(change => {
      const changeKey = `${change.itemId}-${change.fieldName}`;
      newSubmittedChanges.set(changeKey, change);
    });
    
    changeStore.setState({
      pendingChanges: new Map(),
      submittedChanges: newSubmittedChanges,
      approvalRequests: newApprovalRequests
    });
    
    console.log(`📤 Submitted ${changes.length} changes for approval`);
    return { success: true, message: `Submitted ${changes.length} changes for approval` };
  },
  
  // Get all pending approval requests (for admin)
  getApprovalRequests() {
    return changeStore.state.approvalRequests.filter(req => req.status === 'pending');
  },
  
  // Notification functions
  notifyInvestor(userId, message, type) {
    const notification = {
      id: `notif-${Date.now()}`,
      userId,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    const newNotifications = [...changeStore.state.investorNotifications, notification];
    changeStore.setState({ investorNotifications: newNotifications });
    
    console.log('📬 Notification sent to investor:', notification);
  },
  
  getInvestorNotifications(userId) {
    return changeStore.state.investorNotifications.filter(notif => 
      notif.userId === userId && !notif.read
    );
  },
  
  markNotificationRead(notificationId) {
    const notifications = changeStore.state.investorNotifications;
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    
    changeStore.setState({ investorNotifications: updatedNotifications });
  },
  
  // Approval functions
  approveRequest(requestId, properties, setProperties, setFilteredProperties, updateSheetCell, getColumnLetter) {
    const request = changeStore.state.approvalRequests.find(req => req.id === requestId);
    if (!request) return { success: false, message: 'Request not found' };

    console.log('🟢 Approving request:', requestId);
    
    request.changes.forEach(async (change) => {
      try {
        const item = properties.find(p => p.id === change.itemId);
        if (item) {
          await updateSheetCell(item.rowIndex, getColumnLetter(change.fieldName), change.newValue);
          
          setProperties(prev => 
            prev.map(p => p.id === change.itemId ? { ...p, [change.fieldName]: change.newValue } : p)
          );
          setFilteredProperties(prev => 
            prev.map(p => p.id === change.itemId ? { ...p, [change.fieldName]: change.newValue } : p)
          );
        }
      } catch (error) {
        console.error('Error applying change:', error);
      }
    });

    // Notify investor
    changeStore.notifyInvestor(
      request.userId, 
      `Your ${request.changes.length} changes have been approved and applied!`, 
      'approved'
    );

    // Remove from approval requests
    const newApprovalRequests = changeStore.state.approvalRequests.filter(req => req.id !== requestId);
    changeStore.setState({ approvalRequests: newApprovalRequests });

    return { success: true, message: `Approved ${request.changes.length} changes` };
  },
  
  rejectRequest(requestId) {
    const request = changeStore.state.approvalRequests.find(req => req.id === requestId);
    if (!request) return { success: false, message: 'Request not found' };

    console.log('🔴 Rejecting request:', requestId);

    // Notify investor
    changeStore.notifyInvestor(
      request.userId, 
      `Your ${request.changes.length} changes have been rejected.`, 
      'rejected'
    );

    // Remove from approval requests
    const newApprovalRequests = changeStore.state.approvalRequests.filter(req => req.id !== requestId);
    changeStore.setState({ approvalRequests: newApprovalRequests });

    return { success: true, message: `Rejected ${request.changes.length} changes` };
  },
  
  // Clear submitted changes
  clearSubmittedChanges() {
    changeStore.setState({
      submittedChanges: new Map(),
      investorNotifications: []
    });
    
    console.log('🧹 Cleared submitted changes and notifications');
  },
  
  // Test data
  addTestData() {
    const testRequests = [
      {
        id: 'test-1',
        userId: 'user-1', 
        userName: 'John Investor',
        changes: [
          {
            itemId: 'item-5',
            fieldName: 'vendor',
            oldValue: 'Old Vendor Co.',
            newValue: 'New Better Vendor',
            timestamp: new Date().toISOString()
          }
        ],
        submittedAt: new Date().toISOString(),
        status: 'pending'
      }
    ];
    
    changeStore.setState({
      approvalRequests: [...changeStore.state.approvalRequests, ...testRequests]
    });
  },
  
  // Clear all changes (for testing)
  clearAllChanges() {
    changeStore.setState({
      pendingChanges: new Map(),
      submittedChanges: new Map(),
      approvalRequests: [],
      investorNotifications: []
    });
    
    // Clear localStorage
    localStorage.removeItem('pendingChanges');
    localStorage.removeItem('submittedChanges');
    localStorage.removeItem('approvalRequests');
    localStorage.removeItem('investorNotifications');
    
    console.log('🧹 All changes and localStorage cleared');
  }
};

// Add this test function at the very end, before the useChangeTracker function
changeStore.addTestData = () => {
  const testRequests = [
    {
      id: 'test-1',
      userId: 'user-1', 
      userName: 'John Investor',
      changes: [
        {
          itemId: 'item-5',
          fieldName: 'vendor',
          oldValue: 'Old Vendor Co.',
          newValue: 'New Better Vendor',
          timestamp: new Date().toISOString()
        }
      ],
      submittedAt: new Date().toISOString(),
      status: 'pending'
    }
  ];
  
  changeStore.setState({
    approvalRequests: [...changeStore.state.approvalRequests, ...testRequests]
  });
};

// Add these functions before the useChangeTracker export
changeStore.approveRequest = (requestId, properties, setProperties, setFilteredProperties, updateSheetCell, getColumnLetter) => {
  const request = changeStore.state.approvalRequests.find(req => req.id === requestId);
  if (!request) return { success: false, message: 'Request not found' };

  console.log('🟢 Approving request:', requestId);
  
  // Apply each change to Google Sheets and local state
  request.changes.forEach(async (change) => {
    try {
      // Find the item to get rowIndex
      const item = properties.find(p => p.id === change.itemId);
      if (item) {
        // Update Google Sheets
        await updateSheetCell(item.rowIndex, getColumnLetter(change.fieldName), change.newValue);
        
        // Update local state
        setProperties(prev => 
          prev.map(p => p.id === change.itemId ? { ...p, [change.fieldName]: change.newValue } : p)
        );
        setFilteredProperties(prev => 
          prev.map(p => p.id === change.itemId ? { ...p, [change.fieldName]: change.newValue } : p)
        );
      }
    } catch (error) {
      console.error('Error applying change:', error);
    }
  });

  // ADD: Notify the investor
  changeStore.notifyInvestor(
    request.userId, 
    `Your ${request.changes.length} changes have been approved and applied!`, 
    'approved'
  );

  // Remove the request from approvalRequests
  const newApprovalRequests = changeStore.state.approvalRequests.filter(req => req.id !== requestId);
  changeStore.setState({ approvalRequests: newApprovalRequests });

  return { success: true, message: `Approved ${request.changes.length} changes` };
};

changeStore.rejectRequest = (requestId) => {
  const request = changeStore.state.approvalRequests.find(req => req.id === requestId);
  if (!request) return { success: false, message: 'Request not found' };

  console.log('🔴 Rejecting request:', requestId);

  // ADD: Notify the investor
  changeStore.notifyInvestor(
    request.userId, 
    `Your ${request.changes.length} changes have been rejected.`, 
    'rejected'
  );

  // Just remove the request (changes are discarded)
  const newApprovalRequests = changeStore.state.approvalRequests.filter(req => req.id !== requestId);
  changeStore.setState({ approvalRequests: newApprovalRequests });

  return { success: true, message: `Rejected ${request.changes.length} changes` };
};

// Add these before the useChangeTracker export
changeStore.notifyInvestor = (userId, message, type) => {
  const notification = {
    id: `notif-${Date.now()}`,
    userId,
    message,
    type, // 'approved' or 'rejected'
    timestamp: new Date().toISOString(),
    read: false
  };
  
  const newNotifications = [...(changeStore.state.investorNotifications || []), notification];
  changeStore.setState({
    investorNotifications: newNotifications
  });
  
  console.log('📬 Notification sent to investor:', notification);
};

changeStore.getInvestorNotifications = (userId) => {
  return (changeStore.state.investorNotifications || []).filter(notif => 
    notif.userId === userId && !notif.read
  );
};

changeStore.markNotificationRead = (notificationId) => {
  const notifications = changeStore.state.investorNotifications || [];
  const updatedNotifications = notifications.map(notif =>
    notif.id === notificationId ? { ...notif, read: true } : notif
  );
  
  changeStore.setState({
    investorNotifications: updatedNotifications
  });
};

// Add this cleanup function
changeStore.clearSubmittedChanges = () => {
  changeStore.setState({
    submittedChanges: new Map(),
    investorNotifications: [] // Also clear notifications
  });
  
  console.log('🧹 Cleared submitted changes and notifications');
};
// Hook for components to use the change tracker
export function useChangeTracker() {
  const [, forceUpdate] = useState({});
  
  // Subscribe to changes
  React.useEffect(() => {
    const unsubscribe = changeStore.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);
  
  const trackChange = useCallback((itemId, fieldName, oldValue, newValue, userRole) => {
    return changeStore.trackChange(itemId, fieldName, oldValue, newValue, userRole);
  }, []);
  
  const submitForApproval = useCallback((userId, userName) => {
    return changeStore.submitForApproval(userId, userName);
  }, []);
  
  const hasFieldChange = useCallback((itemId, fieldName) => {
    return changeStore.hasFieldChange(itemId, fieldName);
  }, []);
  
  const getFieldNewValue = useCallback((itemId, fieldName) => {
    return changeStore.getFieldNewValue(itemId, fieldName);
  }, []);
  
  const getItemChanges = useCallback((itemId) => {
    return changeStore.getItemChanges(itemId);
  }, []);
  
  return {
    pendingChanges: changeStore.state.pendingChanges,
    submittedChanges: changeStore.state.submittedChanges,
    addTestData: changeStore.addTestData,  
    approvalRequests: changeStore.state.approvalRequests,
    approveRequest: changeStore.approveRequest,
    rejectRequest: changeStore.rejectRequest,
    notifyInvestor: changeStore.notifyInvestor,
    getInvestorNotifications: changeStore.getInvestorNotifications,
    markNotificationRead: changeStore.markNotificationRead,
    clearSubmittedChanges: changeStore.clearSubmittedChanges,
    trackChange,
    submitForApproval,
    hasFieldChange,
    getFieldNewValue,
    getItemChanges,
    clearAllChanges: changeStore.clearAllChanges,
    getApprovalRequests: changeStore.getApprovalRequests
  };
}