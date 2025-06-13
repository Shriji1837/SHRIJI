// components/AdminInbox.js
import React, { useState } from 'react';
import { useApprovals } from '../hooks/useApprovals';
import { Home, ArrowLeft, Clock, User, CheckCircle, XCircle, Eye } from 'lucide-react';

const AdminInbox = ({ onClose, selectedRequest, setSelectedRequest, currentUser, properties, updateSheetCell, getColumnLetter, setProperties, setFilteredProperties, showToastMessage }) => {
  const { approvalRequests, approveRequest, rejectRequest, loading } = useApprovals();
console.log('🔍 Final approval requests:', approvalRequests);

// DEBUG
console.log('🔍 Admin inbox - approval requests:', approvalRequests);

  // Add this handler
  const handleApproval = async (decision) => {
  try {
    let result;
    
    if (decision === 'approved') {
      result = await approveRequest(
        selectedRequest.id,
        properties,
        setProperties,
        setFilteredProperties,
        updateSheetCell,
        getColumnLetter
      );
    } else {
      result = await rejectRequest(selectedRequest.id);
    }
    
    if (result.success) {
      showToastMessage(`✅ ${result.message}`, 3000);
      setSelectedRequest(null); // Go back to inbox
    } else {
      showToastMessage(`❌ ${result.message}`, 4000);
    }
  } catch (error) {
    showToastMessage(`❌ Error: ${error.message}`, 4000);
  }
};

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // If viewing a specific request (table mode)
  if (selectedRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="flex flex-col lg:flex-row h-screen">
          {/* Message Panel - Full width on mobile, 30% on desktop */}
          <div className="w-full lg:w-[30%] xl:w-[25%] bg-gray-800/50 border-b lg:border-b-0 lg:border-r border-gray-700/50 p-4 lg:p-6 max-h-[40vh] lg:max-h-none overflow-y-auto transform transition-transform duration-500 ease-out">
            {/* Back to Inbox Arrow */}
            <button
              onClick={() => setSelectedRequest(null)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Inbox</span>
            </button>

            {/* Request Details */}
            <div className="bg-gray-700/30 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedRequest.userName}</h3>
                  <p className="text-gray-400 text-sm">{selectedRequest.changes.length} changes</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm">
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-white ml-2">{formatDate(selectedRequest.submittedAt)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-yellow-300 ml-2 capitalize">{selectedRequest.status}</span>
                </div>
              </div>

              {/* Changes Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Changes Made:</h4>
                {selectedRequest.changes.map((change, index) => (
                  <div key={index} className="bg-gray-600/30 rounded-lg p-2 text-xs">
                    <div className="text-white font-medium">{formatFieldName(change.fieldName)}</div>
                    <div className="text-gray-400">Item {change.itemId.replace('item-', '')}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-6">
                <button 
                  onClick={() => handleApproval('approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-semibold"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button 
                  onClick={() => handleApproval('rejected')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm font-semibold"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table Panel - Full width on mobile, 70% on desktop */}
          <div className="flex-1 p-4 lg:p-6 min-h-0 min-w-0">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 h-full overflow-hidden">
              <div className="px-4 lg:px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
                <h2 className="text-xl font-semibold text-white">Review Changes</h2>
                <p className="text-gray-400 text-sm mt-1">Click red highlights to compare old vs new values</p>
              </div>

              <div className="overflow-x-auto overflow-y-auto h-[calc(100%-80px)]">
                <ReviewTable 
                    approvalRequest={selectedRequest}
                    properties={properties}
                />
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main inbox view (list of requests)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
          >
            <Home className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="w-px h-6 bg-gray-600"></div>
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Inbox</h1>
            <p className="text-gray-400">Review pending approval requests</p>
          </div>
        </div>
        <div className="bg-gray-700/50 px-4 py-2 rounded-lg border border-gray-600/50">
          <span className="text-gray-300 text-sm">
            {approvalRequests.length} pending requests
          </span>
        </div>
      </div>

      {/* Approval Requests List */}
      <div className="space-y-4">
        {approvalRequests.length === 0 ? (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-12 text-center">
            <Clock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No Pending Requests</h3>
            <p className="text-gray-500">All approval requests have been processed.</p>
          </div>
        ) : (
          approvalRequests.map((request) => (
            <div
              key={request.id}
              className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 hover:bg-gray-700/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">{request.userName}</h3>
                    <p className="text-gray-400 text-sm">
                      {request.changes.length} changes • {formatDate(request.submittedAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
                    Pending Review
                  </span>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Changes</span>
                  </button>
                </div>
              </div>

              {/* Quick Preview of Changes */}
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="flex flex-wrap gap-2">
                  {request.changes.slice(0, 3).map((change, index) => (
                    <span
                      key={index}
                      className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded text-xs"
                    >
                      {formatFieldName(change.fieldName)}
                    </span>
                  ))}
                  {request.changes.length > 3 && (
                    <span className="text-gray-500 text-xs px-2 py-1">
                      +{request.changes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Add this ReviewTable component at the bottom of AdminInbox.js, before the export
const ReviewTable = ({ approvalRequest, properties }) => {
  const [toggledCells, setToggledCells] = useState(new Set());

  // Create a map of changes for quick lookup
  const changesMap = new Map();
  approvalRequest.changes.forEach(change => {
    const key = `${change.itemId}-${change.fieldName}`;
    changesMap.set(key, change);
  });

  // Mock data for now - we'll connect real data later
  // Get real items that have changes in this approval request
  // Get only the specific rows that have changes
  const getItemsWithChanges = () => {
    const itemIds = [...new Set(approvalRequest.changes.map(change => change.itemId))];
    const filteredItems = properties.filter(item => itemIds.includes(item.id));
    
    console.log('🔍 Items with changes:', filteredItems);
    console.log('🔍 Change item IDs:', itemIds);
    console.log('🔍 All properties count:', properties.length);
    
    return filteredItems;
  };

  const itemsWithChanges = getItemsWithChanges();

  const toggleCell = (itemId, fieldName) => {
    const cellKey = `${itemId}-${fieldName}`;
    const newToggled = new Set(toggledCells);
    
    if (newToggled.has(cellKey)) {
      newToggled.delete(cellKey);
    } else {
      newToggled.add(cellKey);
    }
    
    setToggledCells(newToggled);
  };

  const getCellContent = (item, fieldName) => {
    const cellKey = `${item.id}-${fieldName}`;
    const change = changesMap.get(cellKey);
    const isToggled = toggledCells.has(cellKey);

    if (!change) {
      // No change for this field, show normal value
      return {
        value: item[fieldName] || '',
        className: 'text-gray-300',
        clickable: false
      };
    }

    // Field has changes
    if (isToggled) {
      // Show OLD value in GREEN
      return {
        value: change.oldValue || 'empty',
        className: 'bg-green-500/20 text-green-300 border-2 border-green-500/50 cursor-pointer animate-pulse',
        clickable: true,
        label: '(Original)'
      };
    } else {
      // Show NEW value in RED
      return {
        value: change.newValue,
        className: 'bg-red-500/20 text-red-300 border-2 border-red-500/50 cursor-pointer animate-pulse',
        clickable: true,
        label: '(New)'
      };
    }
  };

  const formatFieldName = (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full">
        <thead className="bg-gray-800 sticky top-0 z-10 border-b border-gray-600/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Property</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Floor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size/Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hardware Type</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Link</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Vendor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Allowance/Item</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Allowance</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Notes</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Qty to Order</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price/Item</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Difference</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Comments</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Ordered</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Order Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Approval</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Collection</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {itemsWithChanges.map(item => (
            <tr key={item.id} className="hover:bg-gray-700/10 transition-colors duration-200">
              {['propertyName', 'category', 'floor', 'location', 'itemDescription', 'sizeType', 'hardwareType', 'quantity', 'link', 'vendor', 'allowancePerItem', 'totalBudgetWithTax', 'notes', 'quantityToBeOrdered', 'pricePerItem', 'totalPriceWithTax', 'differenceFromAllowance', 'shrijiComments', 'ordered', 'orderDate', 'approval', 'allowanceCollection'].map(fieldName => {
                const cellContent = getCellContent(item, fieldName);
              
              return (
                <td 
                  key={fieldName}
                  className={`px-4 py-4 text-sm transition-all duration-300 ${cellContent.className}`}
                  onClick={cellContent.clickable ? () => toggleCell(item.id, fieldName) : undefined}
                  title={cellContent.clickable ? 'Click to toggle between old and new values' : ''}
                >
                  <div className="flex items-center space-x-2">
                    <span>{cellContent.value}</span>
                    {cellContent.label && (
                      <span className="text-xs opacity-70">{cellContent.label}</span>
                    )}
                    {cellContent.clickable && (
                      <div className="w-2 h-2 rounded-full bg-current animate-ping" />
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded"></div>
            <span className="text-red-300">New Values (Click to see original)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/50 rounded"></div>
            <span className="text-green-300">Original Values (Click to see new)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-600/50 rounded"></div>
            <span className="text-gray-300">Unchanged Fields</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminInbox;