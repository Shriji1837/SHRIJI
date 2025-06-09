import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Search, Package, MapPin, CheckCircle, AlertCircle, Clock, Filter } from 'lucide-react';

// Custom hook for smooth number counting animation (proper method from research)
const useCountAnimation = (targetValue, duration = 2000) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (targetValue === currentValue) return;

    setIsAnimating(true);
    
    // Professional approach: 60fps frame-based animation
    const frameDuration = 1000 / 60; // 16.67ms per frame for 60fps
    const totalFrames = Math.round(duration / frameDuration);
    const easeOutQuad = t => t * (2 - t); // Smooth deceleration curve
    
    let frame = 0;
    const startValue = currentValue;
    
    const counter = setInterval(() => {
      frame++;
      
      // Calculate smooth progress from 0 to 1
      const progress = easeOutQuad(frame / totalFrames);
      
      // Calculate current value based on progress
      const current = Math.round(startValue + (targetValue - startValue) * progress);
      setCurrentValue(current);
      
      // Stop when animation is complete
      if (frame >= totalFrames) {
        setCurrentValue(targetValue);
        setIsAnimating(false);
        clearInterval(counter);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, [targetValue, duration, currentValue]);

  return { currentValue, isAnimating };
};

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
  // Local filter states for summary view
  const [summaryFilters, setSummaryFilters] = useState({
    category: '',
    ordered: 'all',
    priority: 'all'
  });
  const [summarySearchTerm, setSummarySearchTerm] = useState('');

  // Custom dropdown component with Portal solution (same as detailed breakdown)
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

  // Apply summary-specific filters
  const applySummaryFilters = () => {
    let filtered = [...properties];

    // Search filter
    if (summarySearchTerm) {
      filtered = filtered.filter(item =>
        Object.values(item).some(value =>
          value?.toString().toLowerCase().includes(summarySearchTerm.toLowerCase())
        )
      );
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

    // Priority filter
    if (summaryFilters.priority !== 'all') {
      filtered = filtered.filter(item => 
        item.priority && item.priority.toLowerCase() === summaryFilters.priority.toLowerCase()
      );
    }

    setFilteredProperties(filtered);
  };

  // Clear all summary filters
  const clearSummaryFilters = () => {
    setSummaryFilters({
      category: '',
      ordered: 'all',
      priority: 'all'
    });
    setSummarySearchTerm('');
    setFilteredProperties(properties);
  };

  // Handle filter changes
  const handleSummaryFilterChange = (filterType, value) => {
    setSummaryFilters(prev => ({ ...prev, [filterType]: value }));
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

  // Get unique values for filters
  const uniqueCategories = [...new Set(properties.map(item => item.category))].filter(Boolean);
  const uniquePriorities = [...new Set(properties.map(item => item.priority))].filter(Boolean);

  // Prepare dropdown options
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...uniqueCategories.map(cat => ({ value: cat, label: cat }))
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    ...uniquePriorities.map(priority => ({ value: priority, label: priority }))
  ];

  const orderStatusOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'yes', label: 'Ordered' },
    { value: 'no', label: 'Not Ordered' }
  ];

  // Calculate summary statistics
  const totalItems = filteredProperties.length;
  const orderedItems = filteredProperties.filter(p => 
    p.ordered && (p.ordered.toLowerCase() === 'y' || p.ordered.toLowerCase() === 'yes')
  ).length;
  const highPriorityItems = filteredProperties.filter(p => 
    p.priority && p.priority.toLowerCase() === 'high'
  ).length;
  const withNotesItems = filteredProperties.filter(p => p.notes && p.notes !== "").length;

  const activeFiltersCount = Object.values(summaryFilters).filter(value => value && value !== 'all').length + (summarySearchTerm ? 1 : 0);

  // Calculate total cost from filtered results
  const calculateTotalCost = () => {
    return filteredProperties.reduce((total, item) => {
      if (item.totalPriceWithTax) {
        // Remove any non-numeric characters and convert to number
        const numericValue = parseFloat(item.totalPriceWithTax.toString().replace(/[^0-9.-]/g, ''));
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }
      return total;
    }, 0);
  };

  // Calculate total allowance from filtered results (column M)
  const calculateTotalAllowance = () => {
    return filteredProperties.reduce((total, item) => {
      if (item.totalBudgetWithTax) {
        // Remove any non-numeric characters and convert to number
        const numericValue = parseFloat(item.totalBudgetWithTax.toString().replace(/[^0-9.-]/g, ''));
        return total + (isNaN(numericValue) ? 0 : numericValue);
      }
      return total;
    }, 0);
  };

  const totalCost = calculateTotalCost();
  const totalAllowance = calculateTotalAllowance();
  
  // Use counting animations for both totals - even faster but still smooth!
  const { currentValue: animatedTotalCost, isAnimating: isCostAnimating } = useCountAnimation(totalCost, 800);
  const { currentValue: animatedTotalAllowance, isAnimating: isAllowanceAnimating } = useCountAnimation(totalAllowance, 800);
  
  const formattedTotalCost = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(animatedTotalCost);

  const formattedTotalAllowance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(animatedTotalAllowance);

  return (
    <div className="p-6">
      {/* Main Layout: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar - Filters */}
        <div className="w-80 flex-shrink-0">
          {/* Summary Stats Cards */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Items</p>
                  <p className="text-white text-xl font-semibold">{totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Items Ordered</p>
                  <p className="text-white text-xl font-semibold">{orderedItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">High Priority</p>
                  <p className="text-white text-xl font-semibold">{highPriorityItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">With Notes</p>
                  <p className="text-white text-xl font-semibold">{withNotesItems}</p>
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
                    value={summarySearchTerm}
                    onChange={(e) => setSummarySearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ease-in-out transform hover:scale-[1.02] focus:scale-[1.02]"
                  />
                </div>
              </div>

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

              {/* Priority Dropdown */}
              <CustomDropdown
                label="Priority"
                value={summaryFilters.priority}
                options={priorityOptions}
                onChange={(value) => handleSummaryFilterChange('priority', value)}
                placeholder="All Priorities"
                zIndex={30}
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

        {/* Right Content Area - Table */}
        <div className="flex-1">
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Project Summary</h2>
                  <p className="text-gray-400 text-sm mt-1">Simplified view of project items and status</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-800 sticky top-0 z-10 border-b border-gray-600/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Property Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[200px]">Item Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Link</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[80px]">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[120px]">Total Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[150px]">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Ordered</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider min-w-[100px]">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredProperties.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-700/20 transition-colors duration-200">
                      <EditableCell 
                        item={item} 
                        fieldName="propertyName" 
                        value={item.propertyName}
                        className="px-4 py-4 text-sm text-gray-300"
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
                        className="px-4 py-4 text-sm text-gray-300"
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
                        className="px-4 py-4 text-sm text-gray-300 font-medium"
                      >
                        {item.itemDescription}
                      </EditableCell>
                      <EditableCell 
                        item={item} 
                        fieldName="sizeType" 
                        value={item.sizeType}
                        className="px-4 py-4 text-sm text-gray-300"
                      >
                        {item.sizeType}
                      </EditableCell>
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
                        fieldName="quantity" 
                        value={item.quantity}
                        className="px-4 py-4 text-sm text-gray-300"
                      >
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                          {item.quantity}
                        </span>
                      </EditableCell>
                      <EditableCell 
                        item={item} 
                        fieldName="totalPriceWithTax" 
                        value={item.totalPriceWithTax}
                        className="px-4 py-4 text-sm text-gray-300"
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
                      <EditableCell 
                        item={item} 
                        fieldName="ordered" 
                        value={item.ordered}
                        className="px-4 py-4 text-sm text-gray-300"
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
                        fieldName="priority" 
                        value={item.priority}
                        className="px-4 py-4 text-sm text-gray-300"
                      >
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
                      </EditableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Cost and Total Allowance Boxes */}
          <div className="mt-6 flex gap-6">
            {/* Total Cost Box */}
            <div className="relative w-80">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-2xl blur-xl"></div>
              
              {/* Main total cost container */}
              <div className="relative bg-gradient-to-br from-gray-800/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 shadow-2xl">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-green-500/5 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-emerald-500/5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-3/4 left-3/4 w-12 h-12 bg-green-400/5 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
                </div>

                {/* Content */}
                <div className="relative">
                  {/* Top section - Icon and label */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      {/* Rotating ring */}
                      <div className="absolute inset-0 w-12 h-12 border-2 border-green-500/20 rounded-full animate-spin" style={{animationDuration: '8s'}}></div>
                      <div className="absolute inset-1 w-10 h-10 border-2 border-emerald-500/30 rounded-full animate-spin" style={{animationDuration: '6s', animationDirection: 'reverse'}}></div>
                      
                      {/* Center icon */}
                      <div className="relative w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/25">
                        <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        {/* Glowing background text */}
                        <div className="absolute inset-0 text-sm font-black text-green-400/30 blur-sm">
                          TOTAL COST
                        </div>
                        {/* Main gradient text */}
                        <h3 className="relative text-sm font-black bg-gradient-to-r from-green-300 via-emerald-200 to-green-300 bg-clip-text text-transparent tracking-wide animate-pulse">
                          TOTAL COST
                        </h3>
                      </div>
                      <p className="text-gray-500 text-xs truncate mt-1">
                        {filteredProperties.length} {filteredProperties.length === 1 ? 'item' : 'items'} 
                        {filteredProperties.length !== properties.length ? ' (filtered)' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Bottom section - Total amount */}
                  <div className="text-center">
                    <div className="relative">
                      {/* Glowing text effect */}
                      <div className="absolute inset-0 text-2xl font-black text-green-400 blur-sm opacity-50">
                        {formattedTotalCost}
                      </div>
                      
                      {/* Main text with animation scaling */}
                      <div className={`relative text-2xl font-black bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent transition-all duration-300 ${
                        isCostAnimating ? 'animate-pulse scale-110' : 'animate-pulse scale-100'
                      }`}>
                        {formattedTotalCost}
                      </div>
                    </div>
                    
                    {/* Subtitle with animation indicator */}
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className={`w-1.5 h-1.5 bg-green-500 rounded-full transition-all duration-300 ${
                        isCostAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
                      }`}></div>
                      <span className={`text-green-400 text-xs font-medium tracking-wider transition-all duration-300 ${
                        isCostAnimating ? 'text-green-300' : 'text-green-400'
                      }`}>
                        {isCostAnimating ? 'UPDATING' : 'LIVE TOTAL'}
                      </span>
                      <div className={`w-1.5 h-1.5 bg-green-500 rounded-full transition-all duration-300 ${
                        isCostAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
                      }`} style={{animationDelay: '0.5s'}}></div>
                    </div>
                  </div>

                  {/* Progress bar effect */}
                  <div className="mt-3 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/25 animate-pulse"></div>
                  </div>
                </div>

                {/* Floating sparkles */}
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-emerald-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 right-4 w-1 h-1 bg-green-300 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
              </div>
            </div>

            {/* Total Allowance Box */}
            <div className="relative w-80">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
              
              {/* Main total allowance container */}
              <div className="relative bg-gradient-to-br from-gray-800/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl">
                {/* Animated background particles */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-blue-500/5 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-indigo-500/5 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
                  <div className="absolute top-3/4 right-3/4 w-12 h-12 bg-blue-400/5 rounded-full animate-pulse" style={{animationDelay: '3s'}}></div>
                </div>

                {/* Content */}
                <div className="relative">
                  {/* Top section - Icon and label */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="relative">
                      {/* Rotating squares */}
                      <div className="absolute inset-0 w-12 h-12 border-2 border-blue-500/20 rounded-lg animate-spin" style={{animationDuration: '10s'}}></div>
                      <div className="absolute inset-1 w-10 h-10 border-2 border-indigo-500/30 rounded-lg animate-spin" style={{animationDuration: '7s', animationDirection: 'reverse'}}></div>
                      
                      {/* Center icon */}
                      <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-2xl shadow-blue-500/25">
                        <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        {/* Glowing background text */}
                        <div className="absolute inset-0 text-sm font-black text-blue-400/30 blur-sm">
                          TOTAL ALLOWANCE
                        </div>
                        {/* Main gradient text */}
                        <h3 className="relative text-sm font-black bg-gradient-to-r from-blue-300 via-indigo-200 to-blue-300 bg-clip-text text-transparent tracking-wide animate-pulse">
                          TOTAL ALLOWANCE
                        </h3>
                      </div>
                      <p className="text-gray-500 text-xs truncate mt-1">
                        {filteredProperties.length} {filteredProperties.length === 1 ? 'budget' : 'budgets'} 
                        {filteredProperties.length !== properties.length ? ' (filtered)' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Bottom section - Total amount */}
                  <div className="text-center">
                    <div className="relative">
                      {/* Glowing text effect */}
                      <div className="absolute inset-0 text-2xl font-black text-blue-400 blur-sm opacity-50">
                        {formattedTotalAllowance}
                      </div>
                      
                      {/* Main text with animation scaling */}
                      <div className={`relative text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent transition-all duration-300 ${
                        isAllowanceAnimating ? 'animate-pulse scale-110' : 'animate-pulse scale-100'
                      }`}>
                        {formattedTotalAllowance}
                      </div>
                    </div>
                    
                    {/* Subtitle with animation indicator */}
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <div className={`w-1.5 h-1.5 bg-blue-500 rounded-full transition-all duration-300 ${
                        isAllowanceAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
                      }`}></div>
                      <span className={`text-blue-400 text-xs font-medium tracking-wider transition-all duration-300 ${
                        isAllowanceAnimating ? 'text-blue-300' : 'text-blue-400'
                      }`}>
                        {isAllowanceAnimating ? 'UPDATING' : 'BUDGET'}
                      </span>
                      <div className={`w-1.5 h-1.5 bg-blue-500 rounded-full transition-all duration-300 ${
                        isAllowanceAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
                      }`} style={{animationDelay: '0.5s'}}></div>
                    </div>
                  </div>

                  {/* Progress bar effect */}
                  <div className="mt-3 h-1 bg-gray-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/25 animate-pulse"></div>
                  </div>
                </div>

                {/* Floating sparkles */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
                <div className="absolute bottom-2 right-2 w-1 h-1 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute top-1/2 left-4 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummary;
