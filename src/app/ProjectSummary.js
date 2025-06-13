import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, Package, MapPin, CheckCircle, AlertCircle, Clock, Filter, User } from 'lucide-react';
import { ProfessionalCounter } from '../hooks/TotalCostBox'; 
import { ProfessionalAllowanceCounter } from '../hooks/TotalAllowanceBox';
import { ProfessionalQuantityCounter } from '../hooks/TotalQuantityBox';





const ProjectSummary = ({ 
  properties, 
  filteredProperties, 
  setFilteredProperties,
  setProperties,  // Add this prop
  updateSheetCell,
  getColumnLetter,
  isFieldEditable,
  currentUser,
  formatLink 
}) => {
  // Add local state for filtered properties    


  // Local filter states for summary view
  const [summaryFilters, setSummaryFilters] = useState({
  propertyName: '',
  category: '',
  ordered: 'all'
});
const [summarySearchTerm, setSummarySearchTerm] = useState('');
const [currentSummarySearchInput, setCurrentSummarySearchInput] = useState('');

// Add state persistence like page.js does
const [persistedFilters, setPersistedFilters] = useState({
  propertyName: '',
  category: '',
  ordered: 'all'
});
const [persistedSearchTerm, setPersistedSearchTerm] = useState('');
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [localFilteredProperties, setLocalFilteredProperties] = useState(properties);

  // Add these debug useEffects right here
useEffect(() => {
  console.log('🔄 summaryFilters changed to:', JSON.stringify(summaryFilters, null, 2));
}, [summaryFilters]);

useEffect(() => {
  console.log('🔄 Properties changed, length:', properties.length);
  console.log('🔄 Current summaryFilters at properties change:', JSON.stringify(summaryFilters, null, 2));
}, [properties]);


  // Custom dropdown component with Portal solution (same as detailed breakdown)
  const CustomDropdown = ({ label, value, options, onChange, placeholder, zIndex = 50 }) => {
    console.log(`🔽 CustomDropdown "${label}" rendered with value:`, value);
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

  // Apply summary-specific filters
const applySummaryFilters = () => {

  setPersistedFilters(summaryFilters);
  setPersistedSearchTerm(currentSummarySearchInput);
  
  let filtered = [...properties];

  // Use the current search input state (like page.js does)
  if (currentSummarySearchInput) {
    filtered = filtered.filter(item =>
      Object.values(item).some(value =>
        value?.toString().toLowerCase().includes(currentSummarySearchInput.toLowerCase())
      )
    );
  }

  // Set the actual search term for tracking
  setSummarySearchTerm(currentSummarySearchInput);

  // Property filter
  if (summaryFilters.propertyName) {
    filtered = filtered.filter(item => item.propertyName === summaryFilters.propertyName);
  }
  // Category filter
  if (summaryFilters.category) {
    filtered = filtered.filter(item => item.category === summaryFilters.category);
  }

  // Ordered status filter
  if (summaryFilters.ordered === 'yes') {
    filtered = filtered.filter(item => 
      item.ordered && (item.ordered.toLowerCase() === 'y' || item.ordered.toLowerCase() === 'yes')
    );
  } else if (summaryFilters.ordered === 'no') {
    filtered = filtered.filter(item => 
      !item.ordered || (item.ordered.toLowerCase() === 'n' || item.ordered.toLowerCase() === 'no')
    );
  }

  setLocalFilteredProperties(filtered);
  console.log('🎯 AFTER applySummaryFilters:');
  console.log('summaryFilters:', JSON.stringify(summaryFilters, null, 2));
  console.log('Filtered count:', filtered.length);
  console.log('activeFiltersCount:', activeFiltersCount);
};

  // Clear all summary filters
  const clearSummaryFilters = () => {
  console.log('🧹 Clearing filters');
  setSummaryFilters({
    propertyName: '',
    category: '',
    ordered: 'all'
  });
  setSummarySearchTerm('');
  setCurrentSummarySearchInput( '');
  setLocalFilteredProperties(properties);
  console.log('🧹 Filters cleared');
};

// Update the handleSummaryFilterChange function:
const handleSummaryFilterChange = (filterType, value) => {
  console.log('🔧 Filter changed:', filterType, '=', value);
  setSummaryFilters(prev => {
    const newFilters = { ...prev, [filterType]: value };
    console.log('🔧 New filters state:', JSON.stringify(newFilters, null, 2));
    return newFilters;
  });
};

  // EditableCell component for summary view
  const EditableCell = ({ item, fieldName, value, className, children }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    const userRole = currentUser?.role;
    const editable = isFieldEditable(fieldName, userRole);

    const handleSave = async () => {
      setEditing(false);
      if (editValue !== value) {
        try {
          // Update Google Sheets
          await updateSheetCell(item.rowIndex, getColumnLetter(fieldName), editValue);
          
          // Update local state immediately for instant UI feedback
          setProperties(prev =>
            prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p)
          );
          setFilteredProperties(prev =>
            prev.map(p => p.id === item.id ? { ...p, [fieldName]: editValue } : p)
          );
          
          console.log(`Summary cell updated: ${fieldName} = ${editValue}`);
          
        } catch (error) {
          console.error('Error saving cell:', error);
          setEditValue(value);
        }
      }
    };

    useEffect(() => {
      setEditValue(value);
    }, [value]);

    const handleEditClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setEditing(true);
    };

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

  const uniquePropertyNames = [...new Set(properties.map(item => item.propertyName))].filter(Boolean);
  // Get unique values for filters
  const uniqueCategories = [...new Set(properties.map(item => item.category))].filter(Boolean);

  const propertyNameOptions = [
    { value: '', label: 'All Properties' },
    ...uniquePropertyNames.map(prop => ({ value: prop, label: prop }))
  ];
  // Prepare dropdown options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
  ];

  const orderStatusOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'yes', label: 'Ordered' },
    { value: 'no', label: 'Not Ordered' }
  ];

  // Calculate summary statistics
  const totalItems = localFilteredProperties.length;
  const orderedItems = localFilteredProperties.filter(p => 
    p.ordered && (p.ordered.toLowerCase() === 'y' || p.ordered.toLowerCase() === 'yes')
  ).length;
  const withNotesItems = localFilteredProperties.filter(p => p.notes && p.notes !== "").length;

  const activeFiltersCount = Object.values(summaryFilters).filter(value => value && value !== 'all').length + (summarySearchTerm ? 1 : 0);
  // Add this debug line
  console.log('🎯 activeFiltersCount calculation:', {
    summaryFilters: JSON.stringify(summaryFilters),
    summarySearchTerm,
    activeFiltersCount
  });
  // Calculate total cost from filtered results
  const calculateTotalCost = () => {
  return localFilteredProperties.reduce((total, item) => {
    if (item.totalPriceWithTax) {
      const numericValue = parseFloat(item.totalPriceWithTax.toString().replace(/[^0-9.-]/g, ''));
      return total + (isNaN(numericValue) ? 0 : numericValue);
    }
    return total;
  }, 0);
};

const calculateTotalAllowance = () => {
  return localFilteredProperties.reduce((total, item) => {
    if (item.totalBudgetWithTax) {
      const cleanedValue = item.totalBudgetWithTax.toString().replace(/[$,£€¥₹\s]/g, '').replace(/[^0-9.-]/g, '');
      const numericValue = parseFloat(cleanedValue);
      
      if (!isNaN(numericValue)) {
        return total + numericValue;
      }
    }
    return total;
  }, 0);
};

const calculateTotalQuantity = () => {
  return localFilteredProperties.reduce((total, item) => {
    if (item.quantity) {
      const numericValue = parseFloat(item.quantity.toString().replace(/[^0-9.-]/g, ''));
      return total + (isNaN(numericValue) ? 0 : numericValue);
    }
    return total;
  }, 0);
};

  const totalCost = calculateTotalCost();
  const totalAllowance = calculateTotalAllowance();
  const totalQuantity = calculateTotalQuantity();
  
  // Use counting animations for both totals - super fast but still smooth!
// const { currentValue: animatedTotalCost, isAnimating: isCostAnimating } = useAnimatedCounter('totalCost', totalCost);
// const { currentValue: animatedTotalAllowance, isAnimating: isAllowanceAnimating } = useAnimatedCounter('totalAllowance', totalAllowance);
  // console.log(`📊 Hook returned: animatedTotalAllowance=${animatedTotalAllowance}, isAnimating=${isAllowanceAnimating}, target=${totalAllowance}`);
  const formattedTotalCost = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(totalCost);

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

  const formattedTotalAllowance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(totalAllowance);

  return (
    <div className="p-4 lg:p-6">
      {/* Main Layout: Responsive Sidebar + Content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left Sidebar - Filters - Stack on mobile */}
        <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
          {/* Summary Stats Cards */}
          {/* Summary Stats Cards - 2 columns on mobile, 1 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 mb-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-3 lg:p-4">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs lg:text-sm">Total Items</p>
                  <p className="text-white text-lg lg:text-xl font-semibold">{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-3 lg:p-4">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs lg:text-sm">Items Ordered</p>
                  <p className="text-white text-lg lg:text-xl font-semibold">{orderedItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-3 lg:p-4">
              <div className="flex items-center space-x-2 lg:space-x-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs lg:text-sm">With Notes</p>
                  <p className="text-white text-lg lg:text-xl font-semibold">{withNotesItems}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Summary Filters</span>
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearSummaryFilters}
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
                    placeholder="Search summary..."
                    value={currentSummarySearchInput}  // Changed from summarySearchTerm
                    onChange={(e) => setCurrentSummarySearchInput(e.target.value)}  // Changed function
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Property Filter */}
                    <CustomDropdown
                      label="Property"
                      value={summaryFilters.propertyName}
                      options={propertyNameOptions}
                      onChange={(value) => handleSummaryFilterChange('propertyName', value)}
                      placeholder="All Properties"
                      zIndex={70}
                    />

              {/* Category Dropdown */}
              <CustomDropdown
                label="Category"
                value={summaryFilters.category}
                options={categoryOptions}
                onChange={(value) => handleSummaryFilterChange('category', value)}
                placeholder="All Categories"
                zIndex={50}
              />

              {/* Order Status Dropdown */}
              <CustomDropdown
                label="Order Status"
                value={summaryFilters.ordered}
                options={orderStatusOptions}
                onChange={(value) => handleSummaryFilterChange('ordered', value)}
                placeholder="All Items"
                zIndex={40}
              />
            </div>

            {/* Apply Button */}
            <div className="mt-6">
              <button
                onClick={applySummaryFilters}
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

        {/* Right Content Area - Table - Full width on mobile */}
        <div className="flex-1 order-1 lg:order-2 min-w-0">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Project Summary</h2>
                  <p className="text-gray-400 text-sm mt-1">Simplified view of project items and status</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[70vh] lg:max-h-96 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800 sticky top-0 z-10 border-b border-gray-600/50">
                  <tr>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Property Name</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Category</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px] lg:min-w-[200px]">Item Description</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Size</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Link</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[60px] lg:min-w-[80px]">Quantity</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px] lg:min-w-[120px]">Total Price</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px] lg:min-w-[150px]">Notes</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Ordered</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Vendor</th>
                    <th className="px-2 lg:px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px] lg:min-w-[100px]">Order Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {localFilteredProperties.map((item, index) => (
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
                        fieldName="link" 
                        value={item.link}
                        className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                      >
                        {item.link}
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
                        fieldName="totalPriceWithTax" 
                        value={item.totalPriceWithTax}
                        className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                      >
                        {item.totalPriceWithTax && (
                          <div className="flex items-center space-x-1">
                            <span className="text-green-400">$</span>
                            <span className="font-medium text-green-300">{item.totalPriceWithTax}</span>
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
                        fieldName="orderDate" 
                        value={item.orderDate}
                        className="px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm text-gray-300"
                      >
                        {formatDate(item.orderDate)}
                      </EditableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Cost and Total Allowance Boxes */}
          <div className="mt-6 flex gap-6">
            <ProfessionalCounter 
              targetTotal={totalCost} 
              label="TOTAL COST" 
              subtitle={`${localFilteredProperties.length} ${localFilteredProperties.length === 1 ? 'item' : 'items'}${localFilteredProperties.length !== properties.length ? ' (filtered)' : ''}`}
            />

            {/* Total Allowance Box */}
            <ProfessionalAllowanceCounter 
              targetTotal={totalAllowance} 
              label="TOTAL ALLOWANCE" 
              subtitle={`${localFilteredProperties.length} ${localFilteredProperties.length === 1 ? 'budget' : 'budgets'}${localFilteredProperties.length !== properties.length ? ' (filtered)' : ''}`}
            />
            <ProfessionalQuantityCounter 
              targetTotal={totalQuantity} 
              label="TOTAL QUANTITY" 
              subtitle={`${localFilteredProperties.length} ${localFilteredProperties.length === 1 ? 'item' : 'items'}${localFilteredProperties.length !== properties.length ? ' (filtered)' : ''}`}
            />
          </div>
        </div>
      </div>
      {/* Match Popup */}
{showMatchPopup && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="bg-gray-800/95 backdrop-blur-xl border border-green-500/50 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h3 className="text-white text-lg font-semibold">Values Match!</h3>
          <p className="text-gray-300 text-sm">No changes detected in totals</p>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default ProjectSummary;