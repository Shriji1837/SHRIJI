// hooks/useApprovals.js
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useApprovals() {
  const { data: session } = useSession()
  const [approvalRequests, setApprovalRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [pendingChanges, setPendingChanges] = useState(new Map())
  const [loading, setLoading] = useState(false)

  // Track changes locally (in memory)
  const trackChange = useCallback((itemId, fieldName, oldValue, newValue, userRole) => {
    if (userRole === 'admin') {
      return 'direct' // Admin changes go directly to sheets
    }

    const changeKey = `${itemId}-${fieldName}`
    const newChanges = new Map(pendingChanges)
    
    if (oldValue === newValue) {
      newChanges.delete(changeKey)
    } else {
      newChanges.set(changeKey, {
        itemId,
        fieldName,
        oldValue,
        newValue,
        timestamp: new Date().toISOString(),
        userRole
      })
    }
    
    setPendingChanges(newChanges)
    return 'tracked'
  }, [pendingChanges])

  // Submit changes for approval
  const submitForApproval = useCallback(async () => {
    if (pendingChanges.size === 0) {
      return { success: false, message: 'No changes to submit' }
    }

    setLoading(true)
    try {
      const changes = Array.from(pendingChanges.values())
      
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          changes
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setPendingChanges(new Map()) // Clear pending changes
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || 'Failed to submit changes')
      }
    } catch (error) {
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }, [pendingChanges])

  // Fetch approval requests (for admin)
  const fetchApprovalRequests = useCallback(async () => {
    if (session?.user?.role !== 'admin') return

    setLoading(true)
    try {
      const response = await fetch('/api/approvals?type=requests')
      const result = await response.json()
      
      if (response.ok) {
        setApprovalRequests(result.approvalRequests || [])
      } else {
        console.error('Failed to fetch approval requests:', result.error)
      }
    } catch (error) {
      console.error('Error fetching approval requests:', error)
    } finally {
      setLoading(false)
    }
  }, [session])

  // Fetch notifications (for investor)
  const fetchNotifications = useCallback(async () => {
  if (session?.user?.role === 'admin') return

  setLoading(true)
  try {
    const response = await fetch('/api/approvals?type=notifications')
    const result = await response.json()
    
    if (response.ok) {
      setNotifications(result.notifications || [])
      console.log('🔍 Set notifications:', result.notifications || [])
      // Force a state update check
  setTimeout(() => {
    console.log('🔍 Notifications state after set:', notifications.length)
  }, 100)
    } else {
      console.error('Failed to fetch notifications:', result.error)
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
  } finally {
    setLoading(false)
  }
}, [session])

  // Approve request (admin only)
  const approveRequest = useCallback(async (requestId, properties, setProperties, setFilteredProperties, updateSheetCell, getColumnLetter) => {
    if (session?.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized' }
    }

    setLoading(true)
    try {
      // Get the request details first
      const request = approvalRequests.find(req => req.id === requestId)
      if (!request) {
        throw new Error('Request not found')
      }

      // Apply changes to Google Sheets
      for (const change of request.changes) {
        try {
          const item = properties.find(p => p.id === change.itemId)
          if (item) {
            await updateSheetCell(item.rowIndex, getColumnLetter(change.fieldName), change.newValue)
            
            // Update local state
            setProperties(prev => 
              prev.map(p => p.id === change.itemId ? { ...p, [change.fieldName]: change.newValue } : p)
            )
            setFilteredProperties(prev => 
              prev.map(p => p.id === change.itemId ? { ...p, [change.fieldName]: change.newValue } : p)
            )
          }
        } catch (error) {
          console.error('Error applying change to sheets:', error)
        }
      }

      // Update approval status in database
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          requestId
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        // Remove from local approval requests
        setApprovalRequests(prev => prev.filter(req => req.id !== requestId))
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || 'Failed to approve request')
      }
    } catch (error) {
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }, [session, approvalRequests])

  // Reject request (admin only)
  const rejectRequest = useCallback(async (requestId) => {
    if (session?.user?.role !== 'admin') {
      return { success: false, message: 'Unauthorized' }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          requestId
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        // Remove from local approval requests
        setApprovalRequests(prev => prev.filter(req => req.id !== requestId))
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || 'Failed to reject request')
      }
    } catch (error) {
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }, [session])

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId) => {
    setLoading(true)
    try {
      const response = await fetch('/api/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      })

      const result = await response.json()
      
      if (response.ok) {
        // Remove from local notifications
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
        return { success: true, message: result.message }
      } else {
        throw new Error(result.error || 'Failed to mark notification as read')
      }
    } catch (error) {
      return { success: false, message: error.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-fetch data when component mounts or session changes
    useEffect(() => {
    if (session?.user?.role === 'admin') {
        fetchApprovalRequests()
    } else if (session?.user?.role === 'investor') {
        fetchNotifications()
    }
    }, [session, fetchApprovalRequests, fetchNotifications])

  // Helper functions
  const hasFieldChange = useCallback((itemId, fieldName) => {
    const changeKey = `${itemId}-${fieldName}`
    return pendingChanges.has(changeKey)
  }, [pendingChanges])

  const getFieldNewValue = useCallback((itemId, fieldName) => {
    const changeKey = `${itemId}-${fieldName}`
    const change = pendingChanges.get(changeKey)
    return change?.newValue
  }, [pendingChanges])

  return {
    // State
    approvalRequests,
    notifications,
    pendingChanges,
    loading,
    
    // Actions
    trackChange,
    submitForApproval,
    approveRequest,
    rejectRequest,
    markNotificationRead,
    fetchApprovalRequests,
    fetchNotifications,
    
    // Helpers
    hasFieldChange,
    getFieldNewValue,
    pendingChangesCount: pendingChanges.size,
    hasUnreadNotifications: notifications.length > 0
  }
}