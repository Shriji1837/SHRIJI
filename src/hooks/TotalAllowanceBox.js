import React, { useSyncExternalStore, useCallback } from 'react';

// External store for allowance animation state (separate from cost store)
const allowanceStore = {
  state: {
    hasInitialized: false,
    lastKnownTotal: 0,
    currentValue: 0,
    isAnimating: false
  },
  
  listeners: new Set(),
  
  // Subscribe function for useSyncExternalStore
  subscribe(callback) {
    allowanceStore.listeners.add(callback);
    return () => {
      allowanceStore.listeners.delete(callback);
    };
  },
  
  // Get current state snapshot
  getSnapshot() {
    return allowanceStore.state;
  },
  
  // Update state and notify subscribers
  setState(newState) {
    allowanceStore.state = { ...allowanceStore.state, ...newState };
    allowanceStore.listeners.forEach(callback => callback());
  },
  
  // Animation logic
  startAnimation(fromValue, toValue) {
    if (allowanceStore.state.isAnimating) {
      console.log('🚫 [ALLOWANCE] Animation already running');
      return;
    }
    
    console.log(`🎯 [ALLOWANCE] Starting animation: ${fromValue} → ${toValue}`);
    
    allowanceStore.setState({
      isAnimating: true,
      currentValue: fromValue
    });
    
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const difference = toValue - fromValue;
    
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        // Animation complete
        allowanceStore.setState({
          currentValue: toValue,
          isAnimating: false,
          lastKnownTotal: toValue
        });
        clearInterval(timer);
        console.log(`✅ [ALLOWANCE] Animation complete: ${toValue}`);
      } else {
        // Animation step
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const newValue = Math.round(fromValue + (difference * easedProgress));
        allowanceStore.setState({ currentValue: newValue });
      }
    }, stepDuration);
  },
  
  // Handle target changes
  handleTargetChange(newTarget) {
    const { hasInitialized, lastKnownTotal, isAnimating } = allowanceStore.state;
    const targetValue = Math.round(newTarget);
    
    // Case 1: First time ever
    if (!hasInitialized) {
      console.log(`🎯 [ALLOWANCE] FIRST TIME: 0 → ${targetValue}`);
      allowanceStore.setState({ hasInitialized: true });
      allowanceStore.startAnimation(0, targetValue);
      return;
    }
    
    // Case 2: Already animating
    if (isAnimating) {
      console.log(`🚫 [ALLOWANCE] Currently animating, ignoring: ${targetValue}`);
      return;
    }
    
    // Case 3: No change
    if (lastKnownTotal === targetValue) {
      console.log(`🚫 [ALLOWANCE] No change: ${lastKnownTotal} → ${targetValue}`);
      return;
    }
    
    // Case 4: Value changed - animate
    console.log(`🎯 [ALLOWANCE] VALUE CHANGED: ${lastKnownTotal} → ${targetValue}`);
    allowanceStore.startAnimation(lastKnownTotal, targetValue);
  }
};

export function ProfessionalAllowanceCounter({ targetTotal = 100, label = "TOTAL ALLOWANCE", subtitle = "Budget" }) {
  // Subscribe to external store using React 18's official hook
  const storeState = useSyncExternalStore(
    allowanceStore.subscribe,
    allowanceStore.getSnapshot
  );
  
  // Handle target changes
  const handleTargetChange = useCallback((newTarget) => {
    allowanceStore.handleTargetChange(newTarget);
  }, []);
  
  // Trigger animation when target changes
  React.useEffect(() => {
    handleTargetChange(targetTotal);
  }, [targetTotal, handleTargetChange]);
  
  // Format currency
  const formatValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
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
                  {label}
                </div>
                {/* Main gradient text */}
                <h3 className="relative text-sm font-black bg-gradient-to-r from-blue-300 via-indigo-200 to-blue-300 bg-clip-text text-transparent tracking-wide animate-pulse">
                  {label}
                </h3>
              </div>
              <p className="text-gray-500 text-xs truncate mt-1">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Bottom section - Total amount */}
          <div className="text-center">
            <div className="relative">
              {/* Glowing text effect */}
              <div className="absolute inset-0 text-2xl font-black text-blue-400 blur-sm opacity-50">
                {formatValue(storeState.currentValue)}
              </div>
              
              {/* Main text with animation scaling */}
              <div className={`relative text-2xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent transition-all duration-300 ${
                storeState.isAnimating ? 'animate-pulse scale-110' : 'animate-pulse scale-100'
              }`}>
                {formatValue(storeState.currentValue)}
              </div>
            </div>
            
            {/* Subtitle with animation indicator */}
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className={`w-1.5 h-1.5 bg-blue-500 rounded-full transition-all duration-300 ${
                storeState.isAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
              }`}></div>
              <span className={`text-blue-400 text-xs font-medium tracking-wider transition-all duration-300 ${
                storeState.isAnimating ? 'text-blue-300' : 'text-blue-400'
              }`}>
                {storeState.isAnimating ? 'UPDATING' : 'BUDGET'}
              </span>
              <div className={`w-1.5 h-1.5 bg-blue-500 rounded-full transition-all duration-300 ${
                storeState.isAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
              }`} style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>

          {/* Progress bar effect */}
          <div className="mt-3 h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg shadow-blue-500/25 transition-all duration-75"
              style={{
                width: targetTotal > 0 ? `${Math.min((storeState.currentValue / targetTotal) * 100, 100)}%` : '100%'
              }}
            ></div>
          </div>
        </div>

        {/* Floating sparkles */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-2 right-2 w-1 h-1 bg-indigo-400 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/2 left-4 w-1 h-1 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
      </div>
    </div>
  );
}