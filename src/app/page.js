"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import ReactDOM from 'react-dom';
import ProjectSummary from './ProjectSummary';
import { Search, Home, DollarSign, MapPin, Package, User, Calendar, CheckCircle, RefreshCw, Loader2, UserCircle, Settings, LogOut, Eye, EyeOff, UserPlus, Lock, Filter } from 'lucide-react';
import { useApprovals } from '../hooks/useApprovals';
import { ChangeSummary } from '../components/ChangeSummary';
import AdminInbox from '../components/AdminInbox';
import InvestorNotificationModal from '../components/InvestorNotificationModal';

// Auth Form: standalone component so its state sticks
const AuthForm = ({ mode, onSubmit, onModeChange, loading }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    username: '',
    password: '',
    inviteCode: ''
  });
  // Local visibility toggle - this won't affect parent component
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await onSubmit(formData, mode);
    } catch (error) {
      // Error is handled by toast in handleAuth
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {mode === 'login' ? <Lock className="w-8 h-8 text-white" /> : <UserPlus className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : 'Join Shriji'}
          </h1>
          <p className="text-gray-400">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <>
              <div className="group focus-within:text-blue-400">
                <label className="block text-sm font-medium text-gray-300 mb-2 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
                  placeholder="Enter your email"
                />
              </div>

              <div className="group focus-within:text-blue-400">
                <label className="block text-sm font-medium text-gray-300 mb-2 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">Username (Optional)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
                  placeholder="Choose a username"
                />
              </div>

              <div className="group focus-within:text-blue-400">
                <label className="block text-sm font-medium text-gray-300 mb-2 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">Invite Code *</label>
                <input
                  type="text"
                  required
                  value={formData.inviteCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteCode: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
                  placeholder="Enter invite code"
                />
              </div>
            </>
          )}

          {mode === 'login' && (
            <div className="group focus-within:text-blue-400">
              <label className="block text-sm font-medium text-gray-300 mb-2 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">Email or Username</label>
              <input
                type="text"
                required
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
                placeholder="Enter email or username"
              />
            </div>
          )}

          <div className="group focus-within:text-blue-400">
            <label className="block text-sm font-medium text-gray-300 mb-2 transition-all duration-200 group-focus-within:text-blue-400 group-focus-within:scale-105 transform origin-left">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 focus:scale-[1.02] transition-all duration-200 transform-gpu"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'
            }
          </button>
        </div>
      </div>
    </div>
  );
};


const ConstructionTracker = () => {
  // Auth states
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const currentUser = session?.user;
  const authLoading = status === 'loading';
  const [authMode, setAuthMode] = useState('login');
  const [showProfile, setShowProfile] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { 
  trackChange, 
  submitForApproval, 
  hasFieldChange, 
  getFieldNewValue,
  pendingChanges, 
  pendingChangesCount,
  hasUnreadNotifications,
  fetchNotifications,
  approvalRequests,
  loading: approvalsLoading 
} = useApprovals();
  // Navigation states
const [isNavOpen, setIsNavOpen] = useState(false);
const [currentPage, setCurrentPage] = useState('detailed-breakdown');
const [showInbox, setShowInbox] = useState(false);
const [selectedApprovalRequest, setSelectedApprovalRequest] = useState(null);

  // Data states
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    propertyName: '',
    category: '',
    floor: '',
    vendor: '',
    budgetStatus: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchInput, setCurrentSearchInput] = useState(''); // Track search input separately

// Google Sheets configuration
const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = 'Detailed breakdown';
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const SHEET_RANGE = 'A1:Z5000';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;

  // Navigation menu items
const navigationItems = [
  {
    id: 'detailed-breakdown',
    name: 'Detailed Breakdown',
    icon: Package,
    description: 'Complete project overview and item tracking'
  },
  {
    id: 'project-summary',
    name: 'Project Summary',
    icon: DollarSign,
    description: 'Financial summary and progress tracking'
  }
];


// Handle page navigation
const handlePageChange = (pageId) => {
  setCurrentPage(pageId);
  setIsNavOpen(false);
};
  // Define editable fields based on user role
  const getEditableFields = (userRole) => {
    if (userRole === 'admin') {
      return 'all'; // Admin can edit everything
    }
    
    // Investor editable fields (the ones NOT in the locked list)
    return [
      'hardwareType',
      'link', 
      'vendor',
      'notes',    
      'orderDate',
      'approval'
    ];
  };

  // Check if a field is editable for current user
  const isFieldEditable = (fieldName, userRole) => {
    const editableFields = getEditableFields(userRole);
    if (editableFields === 'all') {
      return true; // Admin can edit everything
    }
    return editableFields.includes(fieldName);
  };

  // Show toast notification
  const showToastMessage = (message, duration = 4000) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), duration);
  };

  // Auth functions
  const handleAuth = async (formData, mode) => {
  setLoginLoading(true); // Start loading
  try {
    // Add a small delay to see the "Signing In..." text
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = await signIn('credentials', {
      identifier: formData.identifier,
      password: formData.password,
      email: formData.email,
      username: formData.username,
      inviteCode: formData.inviteCode,
      mode: mode,
      redirect: false
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    setShowLoginSuccess(true);
    setTimeout(() => {
      setShowLoginSuccess(false);
    }, 3000);

  } catch (error) {
    showToastMessage(error.message);
    throw error;
  } finally {
    setLoginLoading(false); // Stop loading
  }
};

  const handleLogout = () => {
  signOut({ redirect: false });
  setShowProfile(false);
};

const handleNotificationClose = () => {
  setShowNotificationModal(false);
  // Refetch notifications to update the UI
  fetchNotifications();
  console.log('Notification dismissed');
};

  const fetchSheetData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Fetch investor properties first if user is investor
    let userInvestorProperties = [];
    if (currentUser?.role === 'investor') {
      console.log('🔍 Fetching investor properties for:', currentUser.username);
      try {
        const investorResponse = await fetch('/api/investor-properties');
        const investorResult = await investorResponse.json();
        if (investorResponse.ok) {
          userInvestorProperties = investorResult.properties || [];
          console.log('✅ Got investor properties:', userInvestorProperties);
        }
      } catch (error) {
        console.error('Error fetching investor properties:', error);
      }
    }
    const response = await fetch('/api/sheets');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch data');
    }
    
    const transformedData = result.data;
    
    // Calculate totals for comparison (existing logic)
    const newTotalCost = transformedData.reduce((total, item) => {
      if (item.totalPriceWithTax) {
        const numericValue = parseFloat(item.totalPriceWithTax.toString().replace(/[^0-9.-]/g, ''));
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }
      return total;
    }, 0);

    const newTotalAllowance = transformedData.reduce((total, item) => {
      if (item.totalBudgetWithTax) {
        const numericValue = parseFloat(item.totalBudgetWithTax.toString().replace(/[^0-9.-]/g, ''));
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }
      return total;
    }, 0);

    // Get current totals for comparison
    const currentTotalCost = properties.reduce((total, item) => {
      if (item.totalPriceWithTax) {
        const numericValue = parseFloat(item.totalPriceWithTax.toString().replace(/[^0-9.-]/g, ''));
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }
      return total;
    }, 0);

    const currentTotalAllowance = properties.reduce((total, item) => {
      if (item.totalBudgetWithTax) {
        const numericValue = parseFloat(item.totalBudgetWithTax.toString().replace(/[^0-9.-]/g, ''));
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }
      return total;
    }, 0);

    // Check if values match (only if we have existing data)
    if (properties.length > 0 && newTotalCost === currentTotalCost && newTotalAllowance === currentTotalAllowance) {
      // Show match popup
      setShowMatchPopup(true);
      setTimeout(() => setShowMatchPopup(false), 2000);
    }

    
    
    // Filter data based on investor access using local properties
    let filteredForInvestor = transformedData;
    if (currentUser?.role === 'investor' && userInvestorProperties.length > 0) {
      filteredForInvestor = transformedData.filter(property => {
        return userInvestorProperties.some(investorProp => 
          investorProp.toLowerCase() === property.propertyName?.toLowerCase()
        );
      });
    }
    
    console.log(`📊 Original data: ${transformedData.length} items`);
    console.log(`🎯 Filtered for investor: ${filteredForInvestor.length} items`);
    
    // Update properties data with filtered results
    setProperties(filteredForInvestor);
    
    // Preserve user's current filter state by re-applying filters to new data
    applyFiltersToData(filteredForInvestor);
    
    setLastUpdated(new Date());
    setLoading(false);
  } catch (err) {
    console.error('Error fetching sheet data:', err);
    setError(`Failed to load data: ${err.message}`);
    setLoading(false);
  }
};

  // Helper function to apply current filters to new data
  const applyFiltersToData = (newData) => {
    let filtered = [...newData];

    // Use stored search term instead of reading from DOM
    if (currentSearchInput) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(currentSearchInput.toLowerCase())
        )
      );
    }

    if (filters.propertyName) {
    filtered = filtered.filter(item => item.propertyName === filters.propertyName);
    } 
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    if (filters.floor) {
      filtered = filtered.filter(item => item.floor === filters.floor);
    }
    if (filters.vendor) {
      filtered = filtered.filter(item => item.vendor === filters.vendor);
    }
    if (filters.budgetStatus === 'with') {
      filtered = filtered.filter(item => item.totalBudgetWithTax && item.totalBudgetWithTax !== '');
    }
    if (filters.budgetStatus === 'without') {
      filtered = filtered.filter(item => !item.totalBudgetWithTax || item.totalBudgetWithTax === '');
    }

    setFilteredProperties(filtered);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSheetData();
      const interval = setInterval(fetchSheetData, 1200000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleManualRefresh = () => {
    // Don't reset filters/search during manual refresh either
    fetchSheetData();
  };

  const applyFilters = () => {
    const searchInput = document.querySelector('input[placeholder="Search all fields..."]');
    const searchValue = searchInput ? searchInput.value : '';
    
    // Update the search input state
    setCurrentSearchInput(searchValue);
    setSearchTerm(searchValue);
    
    // Apply filters to current data
    applyFiltersToData(properties);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      propertyName: '',
      category: '',
      floor: '',
      vendor: '',
      budgetStatus: 'all'
    });
    setSearchTerm('');
    setCurrentSearchInput('');
    const searchInput = document.querySelector('input[placeholder="Search all fields..."]');
    if (searchInput) searchInput.value = '';
    setFilteredProperties(properties);
  };

  // Function to update a single cell in Google Sheets
  const updateSheetCell = async (rowIndex, columnLetter, newValue) => {
  try {
    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rowIndex,
        columnLetter,
        newValue
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Update failed');
    }
    
    showToastMessage(`✅ ${result.message}`, 2000);
    return true;
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    showToastMessage(`❌ Failed to update cell: ${error.message}`, 4000);
    throw error;
  }
};

// Alternative function for testing (with better error handling)
const updateSheetCellWithFallback = async (rowIndex, columnLetter, newValue) => {
  try {
    const range = `${columnLetter}${rowIndex}`;
    
    console.log(`Updating ${range} with value: ${newValue}`);
    
    // Try the normal fetch first
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sheetId: SHEET_ID,
          range: range,
          value: newValue
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showToastMessage(`✅ Cell ${range} updated successfully!`, 2000);
          return true;
        } else {
          throw new Error(result.error || 'Update failed');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
    } catch (fetchError) {
      console.warn('Fetch failed, trying alternative method:', fetchError.message);
      
      // Fallback: Use form submission method
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = APPS_SCRIPT_URL;
      form.target = '_blank';
      form.style.display = 'none';
      
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify({
        sheetId: SHEET_ID,
        range: range,
        value: newValue
      });
      
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      showToastMessage(`📤 Update request sent to Google Sheets`, 2000);
      return true;
    }
    
  } catch (error) {
    console.error('Error updating sheet:', error);
    showToastMessage(`❌ Failed to update cell: ${error.message}`, 4000);
    throw error;
  }
};

  // Get column letter for field name
  const getColumnLetter = (fieldName) => {
    const columnMap = {
      propertyName: 'A',
      category: 'B', 
      floor: 'D',
      location: 'E',
      itemDescription: 'F',
      sizeType: 'G',
      hardwareType: 'H',
      quantity: 'I',
      link: 'J',
      vendor: 'K',
      allowancePerItem: 'L',
      totalBudgetWithTax: 'M',
      notes: 'N',
      quantityToBeOrdered: 'O',
      pricePerItem: 'P',
      totalPriceWithTax: 'Q',
      differenceFromAllowance: 'R',
      shrijiComments: 'U',
      ordered: 'W',
      orderDate: 'Y',
      approval: 'V',
      allowanceCollection: 'AA'
    };
    return columnMap[fieldName];
  };

  // --- EditableCell: renders a <td> that can turn into an <input> on click ---
  const EditableCell = ({ item, fieldName, value, className, children }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  
  const userRole = currentUser?.role;
  const editable = isFieldEditable(fieldName, userRole);
  
  // Check if this field has pending changes
  const hasPendingChange = hasFieldChange(item.id, fieldName);
  const newValue = getFieldNewValue(item.id, fieldName);
  const displayValue = hasPendingChange ? newValue : value;

  const handleSave = async () => {
    setEditing(false);
    if (editValue === displayValue) return;

    try {
      const result = trackChange(item.id, fieldName, value, editValue, userRole);
      
      if (result === 'direct') {
        // Admin - update sheets directly
        await updateSheetCell(item.rowIndex, getColumnLetter(fieldName), editValue);
        setProperties(prev => prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p));
        setFilteredProperties(prev => prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p));
        showToastMessage(`✅ Updated ${fieldName}`, 2000);
      } else if (result === 'tracked') {
        // Investor - track change, update local UI
        setProperties(prev => prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p));
        setFilteredProperties(prev => prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p));
        showToastMessage(`📝 Change tracked: ${fieldName}`, 2000);
      }
    } catch (error) {
      setEditValue(displayValue);
      showToastMessage(`❌ Failed: ${error.message}`, 4000);
    }
  };

  useEffect(() => {
    setEditValue(displayValue);
  }, [displayValue]);

  if (!editable) {
    return <td className={className}>{children}</td>;
  }

  // Special handling for links (same as before)
  if (fieldName === 'link' && displayValue && !editing) {
    return (
      <td className={`${className} ${hasPendingChange ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : ''}`}>
        <div className="flex items-center space-x-2 group">
          <a href={displayValue} target="_blank" rel="noopener noreferrer"
             className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline flex-1"
             onClick={(e) => e.stopPropagation()}>
            {formatLink(displayValue)}
          </a>
          <button onClick={() => setEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded">
            Edit
          </button>
          {hasPendingChange && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>}
        </div>
      </td>
    );
  }

  return (
    <td className={`${className} ${hasPendingChange ? 'bg-yellow-500/10 border-l-4 border-yellow-500' : ''}`}>
      {editing ? (
        <input
          className="w-full bg-gray-700/50 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            else if (e.key === 'Escape') { setEditValue(displayValue); setEditing(false); }
          }}
          autoFocus
        />
      ) : (
        <div className="relative">
          <div className="cursor-pointer hover:bg-gray-600/30 rounded px-1 py-0.5 transition-colors duration-200" 
               onClick={() => setEditing(true)}>
            {children || <span className="text-gray-500 italic">Click to add...</span>}
          </div>
          {hasPendingChange && <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>}
        </div>
      )}
    </td>
  );
};

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'all').length + (searchTerm ? 1 : 0);

  // Modern Hamburger Menu Component
const HamburgerMenu = () => {
  return (
    <button
      onClick={() => setIsNavOpen(!isNavOpen)}
      className="group relative w-10 h-10 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Toggle navigation menu"
    >
      <div className="absolute inset-0 flex flex-col justify-center items-center space-y-1.5">
        <span
          className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-in-out transform-gpu ${
            isNavOpen 
              ? 'rotate-45 translate-y-2 bg-blue-400' 
              : 'group-hover:w-7 group-hover:bg-blue-300'
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-in-out transform-gpu ${
            isNavOpen 
              ? 'opacity-0 scale-0' 
              : 'group-hover:w-5 group-hover:bg-blue-300'
          }`}
        />
        <span
          className={`block h-0.5 w-6 bg-white rounded-full transition-all duration-300 ease-in-out transform-gpu ${
            isNavOpen 
              ? '-rotate-45 -translate-y-2 bg-blue-400' 
              : 'group-hover:w-7 group-hover:bg-blue-300'
          }`}
        />
      </div>
      
      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className={`absolute inset-0 bg-blue-500/20 rounded-lg transform scale-0 transition-transform duration-300 ${
          isNavOpen ? 'scale-100' : 'scale-0'
        }`} />
      </div>
    </button>
  );
};

// Modern Navigation Sidebar Component
const NavigationSidebar = () => {
  if (!isNavOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={() => setIsNavOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 z-50 transform transition-all duration-500 ease-out ${
        isNavOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Shriji Tracker</h2>
                <p className="text-gray-400 text-sm">Navigation</p>
              </div>
            </div>
            <button
              onClick={() => setIsNavOpen(false)}
              className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id)}
                className={`group relative w-full p-4 rounded-xl text-left transition-all duration-300 transform hover:scale-[1.02] ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-white' 
                    : 'bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 text-gray-300 hover:text-white'
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: isNavOpen ? 'slideInFromLeft 0.5s ease-out forwards' : ''
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" />
                )}
                
                {/* Content */}
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-500/20 text-blue-400' 
                      : 'bg-gray-700/50 text-gray-400 group-hover:bg-gray-600/50 group-hover:text-blue-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                    }`}>
                      {item.name}
                    </h3>
                    <p className={`text-sm transition-colors duration-300 ${
                      isActive ? 'text-blue-300' : 'text-gray-500 group-hover:text-gray-400'
                    }`}>
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{currentUser?.username || 'User'}</p>
                <p className="text-gray-400 text-xs">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Remove the old ProjectSummaryPage component and replace with:
const ProjectSummaryPage = () => {
  return (
    <ProjectSummary
      key="project-summary" // Add this key to prevent re-mounting
      properties={properties}
      filteredProperties={filteredProperties}
      setFilteredProperties={setFilteredProperties}
      setProperties={setProperties}
      updateSheetCell={updateSheetCell}
      getColumnLetter={getColumnLetter}
      isFieldEditable={isFieldEditable}
      currentUser={currentUser}
      formatLink={formatLink}
    />
  );
};

  const formatCurrency = (value) => {
    if (!value || value === "") return "";
    return value;
  };

  const formatLink = (url) => {
    if (!url || url === "") return "";
    return url.length > 30 ? url.substring(0, 30) + "..." : url;
  };

  const formatDate = (dateValue) => {
    if (!dateValue || dateValue === "") return "";
    
    try {
      let date;
      
      if (typeof dateValue === 'string' && dateValue.startsWith('Date(')) {
        const match = dateValue.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
        if (match) {
          const [, year, month, day, hour, minute, second] = match;
          date = new Date(parseInt(year), parseInt(month), parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        }
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('/') && dateValue.includes(':')) {
          const [datePart] = dateValue.split(' ');
          return datePart;
        }
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1900, 0, 1);
        date = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
      } else {
        date = new Date(dateValue);
      }
      
      if (!date || isNaN(date.getTime())) {
        return dateValue;
      }
      
      return date.toLocaleDateString('en-US');
    } catch (error) {
      console.log('Date parsing error:', dateValue, error);
      return dateValue;
    }
  };

  // Custom dropdown component with Portal solution
  const CustomDropdown = ({ label, value, options, onChange, placeholder, zIndex = 50 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
            buttonRef.current && !buttonRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen]);

    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(prev => !prev);
    };

    const handleSelect = (optionValue) => {
      onChange(optionValue);
      setIsOpen(false);
    };

    const displayValue = value || placeholder;

    // Create portal for dropdown menu
    const DropdownPortal = () => {
      if (typeof document === 'undefined' || !isOpen) return null;
      
      return ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-gray-800/95 backdrop-blur-xl border border-gray-600/50 rounded-lg shadow-2xl opacity-100 scale-y-100 translate-y-0 visible transition-all duration-300 ease-in-out transform origin-top"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 9999
          }}
        >
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(option.value);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors duration-200 hover:bg-gray-700/70 first:rounded-t-lg last:rounded-b-lg ${
                  value === option.value 
                    ? 'bg-blue-600/30 text-blue-300' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      );
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 focus:bg-gray-700/70 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:scale-[1.02] flex items-center justify-between"
        >
          <span className={value ? 'text-white' : 'text-gray-400'}>
            {displayValue}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <DropdownPortal />
      </div>
    );
  };

  // Derive unique values for our three filters
  const uniqueCategories = [
    ...new Set(properties.map(item => item.category))
  ].filter(Boolean);

  const uniquePropertyNames = [
  ...new Set(properties.map(item => item.propertyName))
].filter(Boolean);

  const uniqueFloors = [
    ...new Set(properties.map(item => item.floor))
  ].filter(Boolean);

  const uniqueVendors = [
    ...new Set(properties.map(item => item.vendor))
  ].filter(Boolean);

  // Prepare dropdown options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
  ];

  const propertyNameOptions = [
  { value: '', label: 'All Properties' },
  ...uniquePropertyNames.map(propertyName => ({ value: propertyName, label: propertyName }))
];

  const floorOptions = [
    { value: '', label: 'All Floors' },
    ...uniqueFloors.map(floor => ({ value: floor, label: floor }))
  ];

  const vendorOptions = [
    { value: '', label: 'All Vendors' },
    ...uniqueVendors.map(vendor => ({ value: vendor, label: vendor }))
  ];

  // Modern Toast Notification Component
  const ToastNotification = ({ message, show, onClose }) => {
    useEffect(() => {
      if (show) {
        const timer = setTimeout(() => {
          onClose();
        }, 4000);
        return () => clearTimeout(timer);
      }
    }, [show, onClose]);

    if (!show) return null;

    return (
      <div className="fixed top-4 right-4 z-[9999] transform transition-all duration-500 ease-out">
        <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/50 rounded-2xl px-6 py-4 shadow-2xl max-w-sm">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-400 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white text-sm font-medium leading-relaxed">{message}</p>
            <button
              onClick={onClose}
              className="text-red-200 hover:text-white transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Success Loading Animation Component
  const LoginSuccessAnimation = ({ user }) => {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          {/* Animated Success Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              {/* Spinning ring */}
              <div className="absolute inset-0 border-4 border-transparent border-l-blue-500 border-t-blue-500 rounded-full animate-spin"></div>
              {/* Inner success icon */}
              <div className="absolute inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Text with typing animation */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white animate-pulse">
              Welcome Back, {user?.username || user?.email?.split('@')[0] || 'User'}!
            </h1>
            <p className="text-gray-300 text-lg animate-fade-in">
              Loading your dashboard...
            </p>
            
            {/* Progress dots */}
            <div className="flex justify-center space-x-2 mt-8">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>

          {/* Background animated elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  };

  

  // Profile dropdown component
  const ProfileDropdown = ({ user, onLogout, loading }) => {
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl z-50 transform-gpu">
      <div className="p-6">
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

        <div className="space-y-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors duration-200 text-left"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-red-300">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
  <>
    {showLoginSuccess && <LoginSuccessAnimation user={currentUser} />}
    
    {!isAuthenticated && !showLoginSuccess && (
      <>
        <AuthForm
          mode={authMode}
          onSubmit={handleAuth}
          onModeChange={setAuthMode}
          loading={loginLoading}
        />
        <ToastNotification 
          message={toastMessage} 
          show={showToast} 
          onClose={() => setShowToast(false)} 
        />
      </>
    )}

    {isAuthenticated && !showLoginSuccess && (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <style jsx>{`
          @keyframes slideInFromLeft {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
        
        <ToastNotification 
          message={toastMessage} 
          show={showToast} 
          onClose={() => setShowToast(false)} 
        />
        
        {/* Navigation Sidebar */}
        <NavigationSidebar />
        
        <div className="relative z-50 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Hamburger Menu */}
                <HamburgerMenu />
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">Shriji Task Tracker</h1>
                    <p className="text-gray-400 text-sm">
                      {navigationItems.find(item => item.id === currentPage)?.name || 'Construction Project Management'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleManualRefresh}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span className="text-white text-sm">
                    {loading ? 'Updating...' : 'Refresh'}
                  </span>
                </button>
                {/* Check for Updates button - investors only */}
                {currentUser?.role === 'investor' && (
                  <button
                    onClick={() => {
  console.log('🔍 fetchNotifications function:', fetchNotifications);
  console.log('🔍 Current user:', currentUser);
  console.log('🔍 User role:', currentUser?.role);
  
  if (fetchNotifications) {
    fetchNotifications();
  } else {
    console.error('❌ fetchNotifications is undefined!');
  }
  
  console.log('Checking for notifications...');
}}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-white text-sm">Check for Updates</span>
                  </button>
                )}
                <div className="bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-600/50">
                  <span className="text-gray-300 text-sm">
                    {filteredProperties.length !== properties.length 
                      ? `${filteredProperties.length} of ${properties.length} items` 
                      : `Total Items: ${properties.length}`
                    }
                  </span>
                </div>
                {lastUpdated && (
                  <div className="text-gray-400 text-sm">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
                {/* Admin Inbox Icon */}
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => {
                      setShowInbox(true);
                      console.log('Opening inbox!');
                    }}
                    className="flex items-center justify-center w-12 h-12 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl border border-gray-600/50 transition-all duration-300 ease-in-out transform hover:scale-[1.05] focus:scale-[1.05] group relative"
                    title="Admin Inbox"
                  >
                    {/* Envelope Mail Icon */}
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    
                    {/* Notification Badge (if there are pending approvals) */}
                    {approvalRequests.length > 0 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {approvalRequests.length > 3 ? '3+' : approvalRequests.length}
                        </span>
                      </div>
                    )}
                  </button>
                )}
                <div className="relative">
                  <button
                    onClick={() => setShowProfile(prev => !prev)}
                    className="flex items-center space-x-3 bg-gray-700/50 hover:bg-gray-600/50 px-4 py-2 rounded-xl border border-gray-600/50 transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:scale-[1.02] group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <UserCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="relative">
                        {/* Glowing text effect */}
                        <div className="absolute inset-0 text-lg font-bold text-white/20 blur-sm">
                          {currentUser.username || currentUser.email?.split('@')[0] || 'User'}
                        </div>
                        {/* Main text with gradient */}
                        <div className="relative text-lg font-bold bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent group-hover:from-blue-200 group-hover:via-white group-hover:to-blue-200 transition-all duration-300">
                          {currentUser.username || currentUser.email?.split('@')[0] || 'User'}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-medium tracking-wider">
                        Welcome back
                      </div>
                    </div>
                    <div className="w-4 h-4 text-gray-400 group-hover:text-blue-300 transition-all duration-300">
                      <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${showProfile ? 'rotate-180' : 'rotate-0'}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {showProfile && (
                    <ProfileDropdown
                      user={currentUser}
                      onLogout={handleLogout}
                      loading={authLoading}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {showInbox ? (
          <AdminInbox 
            onClose={() => setShowInbox(false)}
            selectedRequest={selectedApprovalRequest}
            setSelectedRequest={setSelectedApprovalRequest}
            currentUser={currentUser}
            properties={properties}
            updateSheetCell={updateSheetCell}
            getColumnLetter={getColumnLetter}
            setProperties={setProperties}
            setFilteredProperties={setFilteredProperties}
            showToastMessage={showToastMessage}
          />
        ) : currentPage === 'detailed-breakdown' ? (
          <div className="p-4 lg:p-6">
            {/* Main Layout: Responsive Sidebar + Content */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Left Sidebar - Filters - Stack on mobile */}
              <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
                {/* Summary Stats Cards */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Items</p>
                        <p className="text-white text-xl font-semibold">{filteredProperties.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Items with Budget</p>
                        <p className="text-white text-xl font-semibold">
                          {filteredProperties.filter(p => p.totalBudgetWithTax && p.totalBudgetWithTax !== "").length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">With Vendors</p>
                        <p className="text-white text-xl font-semibold">
                          {filteredProperties.filter(p => p.vendor && p.vendor !== "").length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">With Notes</p>
                        <p className="text-white text-xl font-semibold">
                          {filteredProperties.filter(p => p.notes && p.notes !== "").length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters Section */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                      <Filter className="w-5 h-5" />
                      <span>Filters</span>
                    </h3>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded-md"
                      >
                        Clear ({activeFiltersCount})
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search all fields..."
                          value={currentSearchInput}
                          onChange={(e) => setCurrentSearchInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:scale-[1.02]"
                        />
                      </div>
                    </div>
                    
                    <CustomDropdown
                      label="Property Name"
                      value={filters.propertyName}
                      options={propertyNameOptions}
                      onChange={(value) => handleFilterChange('propertyName', value)}
                      placeholder="All Properties"
                      zIndex={60}
                    />

                    {/* Move your existing CustomDropdown components here */}
                    <CustomDropdown
                      label="Category"
                      value={filters.category}
                      options={categoryOptions}
                      onChange={(value) => handleFilterChange('category', value)}
                      placeholder="All Categories"
                      zIndex={50}
                    />

                    <CustomDropdown
                      label="Floor"
                      value={filters.floor}
                      options={floorOptions}
                      onChange={(value) => handleFilterChange('floor', value)}
                      placeholder="All Floors"
                      zIndex={40}
                    />

                    <CustomDropdown
                      label="Vendor"
                      value={filters.vendor}
                      options={vendorOptions}
                      onChange={(value) => handleFilterChange('vendor', value)}
                      placeholder="All Vendors"
                      zIndex={30}
                    />
                  </div>

                  {/* Filter buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={() => handleFilterChange('budgetStatus', filters.budgetStatus === 'with' ? 'all' : 'with')}
                      className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                        filters.budgetStatus === 'with' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                      }`}
                    >
                      With Budget
                    </button>
                    <button
                      onClick={() => handleFilterChange('budgetStatus', filters.budgetStatus === 'without' ? 'all' : 'without')}
                      className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
                        filters.budgetStatus === 'without' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/50' 
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                      }`}
                    >
                      Without Budget
                    </button>
                  </div>

                  {/* Apply Button */}
                  <div className="mt-6">
                    <button
                      onClick={applyFilters}
                      className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-500 hover:via-blue-500 hover:to-purple-500 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 w-full"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      <div className="relative flex items-center justify-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Apply Filters</span>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Content Area - Table */}
              <div className="flex-1 order-1 lg:order-2 min-w-0">
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">Project Details</h2>
                        <p className="text-gray-400 text-sm mt-1">Complete overview of all construction items and materials</p>
                      </div>
                      {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-3 py-2 rounded-lg text-sm">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-[70vh] lg:max-h-96">
                    <table className="min-w-full">
                      <thead className="bg-gray-800 sticky top-0 z-10 border-b border-gray-600/50">
                        <tr>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Property Name</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[150px]">Category</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Floor</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Location</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Item Description</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Size/Type</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Hardware Type</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[60px] lg:min-w-[80px]">Quantity</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Link</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Vendor</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Allowance/Item</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Total Allowance</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Notes</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Qty to Order</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Price/Item</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Total Purchase Price</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Difference from Allowance</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Shriji Comments</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[60px] lg:min-w-[80px]">Ordered?</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Order Date</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Client&apos;s Approval</th>
                          <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Allowance Collection</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {filteredProperties.map((item, index) => (
                          <tr key={item.id} className="hover:bg-gray-700/20 transition-colors duration-200">
                            <EditableCell 
                              item={item} 
                              fieldName="propertyName" 
                              value={item.propertyName}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-blue-400" />
                                <span className="font-medium">{item.propertyName}</span>
                              </div>
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="category" 
                              value={item.category}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4 text-green-400" />
                                <span>{item.category}</span>
                              </div>
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="floor" 
                              value={item.floor}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              <span className="bg-gray-700/50 px-2 py-1 rounded-md text-xs">
                                {item.floor}
                              </span>
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="location" 
                              value={item.location}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.location}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="itemDescription" 
                              value={item.itemDescription}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300 font-medium"
                            >
                              {item.itemDescription}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="sizeType" 
                              value={item.sizeType}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.sizeType}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="hardwareType" 
                              value={item.hardwareType}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.hardwareType}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="quantity" 
                              value={item.quantity}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                                {item.quantity}
                              </span>
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="link" 
                              value={item.link}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.link}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="vendor" 
                              value={item.vendor}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.vendor && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4 text-purple-400" />
                                  <span>{item.vendor}</span>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="allowancePerItem" 
                              value={item.allowancePerItem}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.allowancePerItem && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4 text-yellow-400" />
                                  <span className="font-medium text-yellow-300">{formatCurrency(item.allowancePerItem)}</span>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="totalBudgetWithTax" 
                              value={item.totalBudgetWithTax}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.totalBudgetWithTax && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4 text-green-400" />
                                  <span className="font-medium text-green-300">{formatCurrency(item.totalBudgetWithTax)}</span>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="notes" 
                              value={item.notes}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.notes && (
                                <div className="max-w-xs">
                                  <p className="text-gray-400 text-xs bg-gray-700/30 px-2 py-1 rounded-md">
                                    {item.notes}
                                  </p>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="quantityToBeOrdered" 
                              value={item.quantityToBeOrdered}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>{item.quantityToBeOrdered}</span>
                              </div>
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="pricePerItem" 
                              value={item.pricePerItem}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.pricePerItem && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4 text-blue-400" />
                                  <span className="font-medium text-blue-300">{formatCurrency(item.pricePerItem)}</span>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="totalPriceWithTax" 
                              value={item.totalPriceWithTax}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.totalPriceWithTax && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4 text-blue-400" />
                                  <span className="font-medium text-blue-300">{formatCurrency(item.totalPriceWithTax)}</span>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="differenceFromAllowance" 
                              value={item.differenceFromAllowance}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.differenceFromAllowance && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-4 h-4 text-orange-400" />
                                  <span className="font-medium text-orange-300">{formatCurrency(item.differenceFromAllowance)}</span>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="shrijiComments" 
                              value={item.shrijiComments}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.shrijiComments && (
                                <div className="max-w-xs">
                                  <p className="text-gray-400 text-xs bg-purple-700/20 px-2 py-1 rounded-md">
                                    {item.shrijiComments}
                                  </p>
                                </div>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="ordered" 
                              value={item.ordered}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.ordered && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.ordered.toLowerCase() === 'y' || item.ordered.toLowerCase() === 'yes' 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {item.ordered}
                                </span>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="orderDate" 
                              value={item.orderDate}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {formatDate(item.orderDate)}
                            </EditableCell>

                            <EditableCell 
                              item={item} 
                              fieldName="approval" 
                              value={item.approval}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.approval && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.approval.toLowerCase() === 'approved' 
                                    ? 'bg-green-500/20 text-green-300' 
                                    : item.approval.toLowerCase() === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}>
                                  {item.approval}
                                </span>
                              )}
                            </EditableCell>
                            <EditableCell 
                              item={item} 
                              fieldName="allowanceCollection" 
                              value={item.allowanceCollection}
                              className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                            >
                              {item.allowanceCollection && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.allowanceCollection.toLowerCase() === 'y' || item.allowanceCollection.toLowerCase() === 'yes'
                                    ? 'bg-green-500/20 text-green-300' 
                                    : item.allowanceCollection.toLowerCase() === 'pending'
                                    ? 'bg-red-500/20 text-red-300'
                                    : item.allowanceCollection.toLowerCase() === 'n' || item.allowanceCollection.toLowerCase() === 'no'
                                    ? 'bg-gray-500/20 text-gray-400'
                                    : 'bg-gray-500/20 text-gray-300' // fallback for any other values
                                }`}>
                                  {item.allowanceCollection}
                                </span>
                              )}
                            </EditableCell>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ProjectSummaryPage />
        )}
        {/* Change Summary - only show for investors on detailed breakdown */}
        {isAuthenticated && !showLoginSuccess && currentPage === 'detailed-breakdown' && currentUser?.role === 'investor' && (
          <ChangeSummary 
            currentUser={currentUser}
            showToastMessage={showToastMessage}
            pendingChanges={pendingChanges}
            pendingChangesCount={pendingChangesCount}
            submitForApproval={submitForApproval}
            loading={approvalsLoading}    // Use the renamed variable
          />
        )}
        {/* Investor Notification Modal */}
        {isAuthenticated && !showLoginSuccess && currentUser?.role === 'investor' && hasUnreadNotifications && (
          <InvestorNotificationModal
            currentUser={currentUser}
            onClose={handleNotificationClose}
          />
        )}
        {showProfile && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowProfile(false)}
          ></div>
        )}
      </div>
    )}
  </>
);
};

export default ConstructionTracker;