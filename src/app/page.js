"use client"
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Search, Home, DollarSign, MapPin, Package, User, Calendar, CheckCircle, RefreshCw, Loader2, UserCircle, Settings, LogOut, Eye, EyeOff, UserPlus, Lock } from 'lucide-react';

const ConstructionTracker = () => {
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Data states
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    floor: '',
    vendor: '',
    budgetStatus: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Google Sheets configuration
  const SHEET_ID = '1I0R7NgeWBI90bk30_BKsQ5Lze64fWBD4plrgNyZi6Po';
  const SHEET_NAME = 'Detailed breakdown';
  const SHEET_RANGE = 'A1:Z5000';
  const API_KEY = 'AIzaSyDjGF92yTLtzhoaUHC_TwB69YT3QqtgJcA';

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
      'pricePerItem',
      'totalPriceWithTax',
      'differenceFromAllowance',
      'shrijiShare',
      'clientShare',
      'shrijiComments',
      'orderId',
      'orderDate',
      'approval'
    ];
  };

  // Check if a field is editable for current user
  const isFieldEditable = (fieldName, userRole) => {
    const editableFields = getEditableFields(userRole);
    return editableFields === 'all' || editableFields.includes(fieldName);
  };

  // Show toast notification
  const showToastMessage = (message, duration = 4000) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), duration);
  };

  // Auth functions
  const handleAuth = async (formData, mode) => {
    setAuthLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mode === 'register') {
        if (formData.inviteCode !== 'SHRIJI') {
          throw new Error('Invalid invite code! Please contact admin for the correct code.');
        }
        
        const users = JSON.parse(localStorage.getItem('shriji_users') || '[]');
        const existingUser = users.find(u => u.email === formData.email || (formData.username && u.username === formData.username));
        if (existingUser) {
          if (existingUser.email === formData.email) {
            throw new Error('An account with this email already exists! Try logging in instead.');
          } else {
            throw new Error('This username is already taken! Please choose a different one.');
          }
        }
        
        const newUser = {
          id: Date.now(),
          email: formData.email,
          username: formData.username || null,
          password: formData.password,
          role: 'investor', // All registrations are investors
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('shriji_users', JSON.stringify(users));
        localStorage.setItem('shriji_currentUser', JSON.stringify(newUser));
        
        setCurrentUser(newUser);
        setShowLoginSuccess(true);
        
        // Show loading animation then authenticate
        setTimeout(() => {
          setShowLoginSuccess(false);
          setIsAuthenticated(true);
        }, 3000);
      } else {
        const users = JSON.parse(localStorage.getItem('shriji_users') || '[]');
        
        const user = users.find(u => {
          const emailMatch = u.email && u.email.toLowerCase() === formData.identifier.toLowerCase();
          const usernameMatch = u.username && u.username.toLowerCase() === formData.identifier.toLowerCase();
          const passwordMatch = u.password === formData.password;
          
          return (emailMatch || usernameMatch) && passwordMatch;
        });
        
        if (!user) {
          throw new Error('Invalid credentials! Please check your username/email and password.');
        }
        
        localStorage.setItem('shriji_currentUser', JSON.stringify(user));
        setCurrentUser(user);
        setShowLoginSuccess(true);
        
        // Show loading animation then authenticate
        setTimeout(() => {
          setShowLoginSuccess(false);
          setIsAuthenticated(true);
        }, 3000);
      }
    } catch (error) {
      showToastMessage(error.message);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('shriji_currentUser');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowProfile(false);
  };

  const updateProfile = async (updatedData) => {
    setAuthLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const users = JSON.parse(localStorage.getItem('shriji_users') || '[]');
      const updatedUsers = users.map(u => 
        u.id === currentUser.id ? { ...u, ...updatedData } : u
      );
      
      const updatedUser = { ...currentUser, ...updatedData };
      
      localStorage.setItem('shriji_users', JSON.stringify(updatedUsers));
      localStorage.setItem('shriji_currentUser', JSON.stringify(updatedUser));
      
      setCurrentUser(updatedUser);
    } catch (error) {
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('shriji_currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('shriji_currentUser');
      }
    }

    // Initialize default admin user if it doesn't exist
    const existingUsers = JSON.parse(localStorage.getItem('shriji_users') || '[]');
    const adminExists = existingUsers.find(u => u.username === 'admin' || u.email === 'admin@shriji.com');
    
    if (!adminExists) {
      const defaultAdmin = {
        id: Date.now(),
        email: 'admin@shriji.com',
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      const updatedUsers = [...existingUsers, defaultAdmin];
      localStorage.setItem('shriji_users', JSON.stringify(updatedUsers));
      console.log('Default admin user created:');
      console.log('Email: admin@shriji.com');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
    }
  }, []);

  const fetchSheetData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Google Sheets API instead of the old gviz method for better reliability
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${SHEET_RANGE}?key=${API_KEY}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        throw new Error('No data found in sheet');
      }
      
      // Skip header row and transform data
      const transformedData = data.values.slice(1).map((row, index) => {
        return {
          id: index + 1,
          rowIndex: index + 2, // +2 because sheet is 1-indexed and we skip header
          propertyName: row[0] || '',
          category: row[1] || '',
          floor: row[3] || '',
          location: row[4] || '',
          itemDescription: row[5] || '',
          sizeType: row[6] || '',
          hardwareType: row[7] || '',
          quantity: row[8] || 0,
          link: row[9] || '',
          vendor: row[10] || '',
          allowancePerItem: row[11] || '',
          totalBudgetWithTax: row[12] || '',
          notes: row[13] || '',
          qualityToBeOrdered: row[14] || 0,
          pricePerItem: row[15] || '',
          totalPriceWithTax: row[16] || '',
          differenceFromAllowance: row[17] || '',
          shrijiShare: row[18] || '',
          clientShare: row[19] || '',
          shrijiComments: row[20] || '',
          ordered: row[21] || '',
          orderId: row[22] || '',
          orderDate: row[23] || '',
          priority: row[24] || '',
          approval: row[25] || ''
        };
      }).filter(item => item.propertyName); // Only include rows with property names
      
      setProperties(transformedData);
      setFilteredProperties(transformedData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setError(`Failed to load data from Google Sheets: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSheetData();
      const interval = setInterval(fetchSheetData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleManualRefresh = () => {
    fetchSheetData();
  };

  const applyFilters = () => {
    const searchInput = document.querySelector('input[placeholder="Search all fields..."]');
    const currentSearchTerm = searchInput ? searchInput.value : '';
    
    let filtered = [...properties];

    if (currentSearchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(currentSearchTerm.toLowerCase())
        )
      );
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

    setSearchTerm(currentSearchTerm);
    setFilteredProperties(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      category: '',
      floor: '',
      vendor: '',
      budgetStatus: 'all'
    });
    setSearchTerm('');
    const searchInput = document.querySelector('input[placeholder="Search all fields..."]');
    if (searchInput) searchInput.value = '';
    setFilteredProperties(properties);
  };

  // Function to update a single cell in Google Sheets
  const updateSheetCell = async (rowIndex, columnLetter, newValue) => {
    try {
      const range = `${SHEET_NAME}!${columnLetter}${rowIndex}`;
      
      console.log(`Updating ${range} with value: ${newValue}`);
      
      // Google Sheets API call to update single cell
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW&key=${API_KEY}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[newValue]]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Sheets API Error:', errorData);
        throw new Error(`Failed to update sheet: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Sheet updated successfully:', result);
      return true;
    } catch (error) {
      console.error('Error updating sheet:', error);
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
      qualityToBeOrdered: 'O',
      pricePerItem: 'P',
      totalPriceWithTax: 'Q',
      differenceFromAllowance: 'R',
      shrijiShare: 'S',
      clientShare: 'T',
      shrijiComments: 'U',
      ordered: 'V',
      orderId: 'W',
      orderDate: 'X',
      priority: 'Y',
      approval: 'Z'
    };
    return columnMap[fieldName];
  };

  // --- EditableCell: renders a <td> that can turn into an <input> on click ---
  const EditableCell = ({ item, fieldName, value, className, children }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const userRole = currentUser?.role;
    const editable = isFieldEditable(fieldName, userRole);

    // when input loses focus or Enter is pressed
    const handleSave = async () => {
      setEditing(false);
      if (editValue !== value) {
        try {
          await updateSheetCell(item.rowIndex, getColumnLetter(fieldName), editValue);
          // update in-memory state so UI reflects change immediately
          setProperties(prev =>
            prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p)
          );
          setFilteredProperties(prev =>
            prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p)
          );
        } catch (error) {
          console.error('Error saving cell:', error);
          // Reset to original value on error
          setEditValue(value);
        }
      }
    };

    // Update editValue when value prop changes
    useEffect(() => {
      setEditValue(value);
    }, [value]);

    // Handle click to edit (prevent event bubbling from links)
    const handleEditClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setEditing(true);
    };

    // if user shouldn't edit this field, just render normal cell
    if (!editable) {
      return <td className={className}>{children}</td>;
    }

    // Special handling for link fields
    if (fieldName === 'link' && value && !editing) {
      return (
        <td className={className}>
          <div className="flex items-center space-x-2 group">
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 underline flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              {formatLink(value)}
            </a>
            <button
              onClick={handleEditClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded"
              title="Edit link"
            >
              Edit
            </button>
          </div>
        </td>
      );
    }

    // editable: show input when in editing mode
    return (
      <td className={className}>
        {editing ? (
          <input
            className="w-full bg-gray-700/50 text-white rounded px-2 py-1 border border-gray-600 focus:border-blue-400 focus:outline-none"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSave();
              } else if (e.key === 'Escape') {
                setEditValue(value);
                setEditing(false);
              }
            }}
            autoFocus
            placeholder={fieldName === 'link' ? 'Enter URL...' : 'Enter value...'}
          />
        ) : (
          <div 
            className="cursor-pointer hover:bg-gray-600/30 rounded px-1 py-0.5 transition-colors duration-200" 
            onClick={handleEditClick}
            title="Click to edit"
          >
            {children || <span className="text-gray-500 italic">Click to add...</span>}
          </div>
        )}
      </td>
    );
  };

  const activeFiltersCount = Object.values(filters).filter(value => value && value !== 'all').length + (searchTerm ? 1 : 0);

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
      <div className="fixed top-4 right-4 z-50 transform transition-all duration-500 ease-out">
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

  // Auth form component
  const AuthForm = ({ mode, onSubmit, onModeChange, loading }) => {
    const [formData, setFormData] = useState({
      identifier: '',
      email: '',
      username: '',
      password: '',
      inviteCode: ''
    });

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

  // Profile dropdown component
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

  if (!isAuthenticated) {
    return (
      <>
        {showLoginSuccess && <LoginSuccessAnimation user={currentUser} />}
        {!showLoginSuccess && (
          <AuthForm
            mode={authMode}
            onSubmit={handleAuth}
            onModeChange={setAuthMode}
            loading={authLoading}
          />
        )}
        <ToastNotification 
          message={toastMessage} 
          show={showToast} 
          onClose={() => setShowToast(false)} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <ToastNotification 
        message={toastMessage} 
        show={showToast} 
        onClose={() => setShowToast(false)} 
      />
      
      <div className="relative z-50 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Shriji Task Tracker</h1>
                <p className="text-gray-400 text-sm">Construction Project Management</p>
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
              
              <div className="relative">
                <button
                  onClick={() => setShowProfile(prev => !prev)}
                  className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 px-3 py-2 rounded-lg border border-gray-600/50 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white text-sm">{currentUser.username || 'User'} ({currentUser.role})</span>
                </button>
                
                {showProfile && (
                  <ProfileDropdown
                    user={currentUser}
                    onUpdate={updateProfile}
                    onLogout={handleLogout}
                    loading={authLoading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Filters & Search</h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Clear All ({activeFiltersCount})
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all fields..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

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

          <div className="flex items-center justify-center mt-6">
            <button
              onClick={applyFilters}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center space-x-3">
                <Search className="w-5 h-5" />
                <span className="text-lg">Apply Filters</span>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              </div>
            </button>
          </div>
        </div>

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

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-800 sticky top-0 z-10 border-b border-gray-600/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Property Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Floor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">Item Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Size/Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Hardware Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px]">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Link</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Allowance/Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Total Allowance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Qty to Order</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Price/Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Total Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Difference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Shriji Share</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Client Share</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">Shriji Comments</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px]">Ordered?</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Order Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px]">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filteredProperties.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-700/20 transition-colors duration-200">
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="font-medium">{item.propertyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-green-400" />
                        <span>{item.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <span className="bg-gray-700/50 px-2 py-1 rounded-md text-xs">
                        {item.floor}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">{item.location}</td>
                    <td className="px-4 py-4 text-sm text-gray-300 font-medium">{item.itemDescription}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">{item.sizeType}</td>
                    <EditableCell 
                      item={item} 
                      fieldName="hardwareType" 
                      value={item.hardwareType}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.hardwareType}
                    </EditableCell>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                        {item.quantity}
                      </span>
                    </td>
                    <EditableCell 
                      item={item} 
                      fieldName="link" 
                      value={item.link}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.link}
                    </EditableCell>
                    <EditableCell 
                      item={item} 
                      fieldName="vendor" 
                      value={item.vendor}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.vendor && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4 text-purple-400" />
                          <span>{item.vendor}</span>
                        </div>
                      )}
                    </EditableCell>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {item.allowancePerItem && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          <span className="font-medium text-yellow-300">{formatCurrency(item.allowancePerItem)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {item.totalBudgetWithTax && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="font-medium text-green-300">{formatCurrency(item.totalBudgetWithTax)}</span>
                        </div>
                      )}
                    </td>
                    <EditableCell 
                      item={item} 
                      fieldName="notes" 
                      value={item.notes}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.notes && (
                        <div className="max-w-xs">
                          <p className="text-gray-400 text-xs bg-gray-700/30 px-2 py-1 rounded-md">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </EditableCell>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span>{item.qualityToBeOrdered}</span>
                      </div>
                    </td>
                    <EditableCell 
                      item={item} 
                      fieldName="pricePerItem" 
                      value={item.pricePerItem}
                      className="px-4 py-4 text-sm text-gray-300"
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
                      className="px-4 py-4 text-sm text-gray-300"
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
                      className="px-4 py-4 text-sm text-gray-300"
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
                      fieldName="shrijiShare" 
                      value={item.shrijiShare}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.shrijiShare && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-purple-400" />
                          <span className="font-medium text-purple-300">{formatCurrency(item.shrijiShare)}</span>
                        </div>
                      )}
                    </EditableCell>
                    <EditableCell 
                      item={item} 
                      fieldName="clientShare" 
                      value={item.clientShare}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.clientShare && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-cyan-400" />
                          <span className="font-medium text-cyan-300">{formatCurrency(item.clientShare)}</span>
                        </div>
                      )}
                    </EditableCell>
                    <EditableCell 
                      item={item} 
                      fieldName="shrijiComments" 
                      value={item.shrijiComments}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.shrijiComments && (
                        <div className="max-w-xs">
                          <p className="text-gray-400 text-xs bg-purple-700/20 px-2 py-1 rounded-md">
                            {item.shrijiComments}
                          </p>
                        </div>
                      )}
                    </EditableCell>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {item.ordered && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.ordered.toLowerCase() === 'y' || item.ordered.toLowerCase() === 'yes' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {item.ordered}
                        </span>
                      )}
                    </td>
                    <EditableCell 
                      item={item} 
                      fieldName="orderId" 
                      value={item.orderId}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {item.orderId}
                    </EditableCell>
                    <EditableCell 
                      item={item} 
                      fieldName="orderDate" 
                      value={item.orderDate}
                      className="px-4 py-4 text-sm text-gray-300"
                    >
                      {formatDate(item.orderDate)}
                    </EditableCell>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {item.priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.priority.toLowerCase() === 'high' 
                            ? 'bg-red-500/20 text-red-300' 
                            : item.priority.toLowerCase() === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {item.priority}
                        </span>
                      )}
                    </td>
                    <EditableCell 
                      item={item} 
                      fieldName="approval" 
                      value={item.approval}
                      className="px-4 py-4 text-sm text-gray-300"
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {showProfile && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfile(false)}
        ></div>
      )}
    </div>
  );
};

export default ConstructionTracker;
