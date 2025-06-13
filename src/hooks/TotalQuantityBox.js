import React, { useSyncExternalStore, useCallback } from 'react';

// External store for quantity animation state (separate from cost and allowance stores)
const quantityStore = {
  state: {
    hasInitialized: false,
    lastKnownTotal: 0,
    currentValue: 0,
    isAnimating: false
  },
  
  listeners: new Set(),
  
  // Subscribe function for useSyncExternalStore
  subscribe(callback) {
    quantityStore.listeners.add(callback);
    return () => {
      quantityStore.listeners.delete(callback);
    };
  },
  
  // Get current state snapshot
  getSnapshot() {
    return quantityStore.state;
  },
  
  // Update state and notify subscribers
  setState(newState) {
    quantityStore.state = { ...quantityStore.state, ...newState };
    quantityStore.listeners.forEach(callback => callback());
  },
  
  // Animation logic
  startAnimation(fromValue, toValue) {
    if (quantityStore.state.isAnimating) {
      console.log('🚫 [QUANTITY] Animation already running');
      return;
    }
    
    console.log(`🎯 [QUANTITY] Starting animation: ${fromValue} → ${toValue}`);
    
    quantityStore.setState({
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
        quantityStore.setState({
          currentValue: toValue,
          isAnimating: false,
          lastKnownTotal: toValue
        });
        clearInterval(timer);
        console.log(`✅ [QUANTITY] Animation complete: ${toValue}`);
      } else {
        // Animation step
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const newValue = Math.round(fromValue + (difference * easedProgress));
        quantityStore.setState({ currentValue: newValue });
      }
    }, stepDuration);
  },
  
  // Handle target changes
  handleTargetChange(newTarget) {
    const { hasInitialized, lastKnownTotal, isAnimating } = quantityStore.state;
    const targetValue = Math.round(newTarget);
    
    // Case 1: First time ever
    if (!hasInitialized) {
      console.log(`🎯 [QUANTITY] FIRST TIME: 0 → ${targetValue}`);
      quantityStore.setState({ hasInitialized: true });
      quantityStore.startAnimation(0, targetValue);
      return;
    }
    
    // Case 2: Already animating
    if (isAnimating) {
      console.log(`🚫 [QUANTITY] Currently animating, ignoring: ${targetValue}`);
      return;
    }
    
    // Case 3: No change
    if (lastKnownTotal === targetValue) {
      console.log(`🚫 [QUANTITY] No change: ${lastKnownTotal} → ${targetValue}`);
      return;
    }
    
    // Case 4: Value changed - animate
    console.log(`🎯 [QUANTITY] VALUE CHANGED: ${lastKnownTotal} → ${targetValue}`);
    quantityStore.startAnimation(lastKnownTotal, targetValue);
  }
};

export function ProfessionalQuantityCounter({ targetTotal = 100, label = "TOTAL QUANTITY", subtitle = "Items" }) {
  // Subscribe to external store using React 18's official hook
  const storeState = useSyncExternalStore(
    quantityStore.subscribe,
    quantityStore.getSnapshot
  );
  
  // Handle target changes
  const handleTargetChange = useCallback((newTarget) => {
    quantityStore.handleTargetChange(newTarget);
  }, []);
  
  // Trigger animation when target changes
  React.useEffect(() => {
    handleTargetChange(targetTotal);
  }, [targetTotal, handleTargetChange]);
  
  // Format number (no currency, just commas)
  const formatValue = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="relative w-80">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
      
      {/* Main total quantity container */}
      <div className="relative bg-gradient-to-br from-gray-800/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-2xl">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-purple-500/5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-pink-500/5 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-3/4 left-3/4 w-12 h-12 bg-purple-400/5 rounded-full animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Content */}
        <div className="relative">
          {/* Top section - Icon and label */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              {/* Rotating diamonds */}
              <div className="absolute inset-0 w-12 h-12 border-2 border-purple-500/20 rounded-lg rotate-45 animate-spin" style={{animationDuration: '12s'}}></div>
              <div className="absolute inset-1 w-10 h-10 border-2 border-pink-500/30 rounded-lg rotate-45 animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
              
              {/* Center icon */}
              <div className="relative w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-2xl shadow-purple-500/25">
                <svg className="w-6 h-6 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="relative">
                {/* Glowing background text */}
                <div className="absolute inset-0 text-sm font-black text-purple-400/30 blur-sm">
                  {label}
                </div>
                {/* Main gradient text */}
                <h3 className="relative text-sm font-black bg-gradient-to-r from-purple-300 via-pink-200 to-purple-300 bg-clip-text text-transparent tracking-wide animate-pulse">
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
              <div className="absolute inset-0 text-2xl font-black text-purple-400 blur-sm opacity-50">
                {formatValue(storeState.currentValue)}
              </div>
              
              {/* Main text with animation scaling */}
              <div className={`relative text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-300 to-purple-400 bg-clip-text text-transparent transition-all duration-300 ${
                storeState.isAnimating ? 'animate-pulse scale-110' : 'animate-pulse scale-100'
              }`}>
                {formatValue(storeState.currentValue)}
              </div>
            </div>
            
            {/* Subtitle with animation indicator */}
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className={`w-1.5 h-1.5 bg-purple-500 rounded-full transition-all duration-300 ${
                storeState.isAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
              }`}></div>
              <span className={`text-purple-400 text-xs font-medium tracking-wider transition-all duration-300 ${
                storeState.isAnimating ? 'text-purple-300' : 'text-purple-400'
              }`}>
                {storeState.isAnimating ? 'COUNTING' : 'TOTAL QTY'}
              </span>
              <div className={`w-1.5 h-1.5 bg-purple-500 rounded-full transition-all duration-300 ${
                storeState.isAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
              }`} style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>

          {/* Progress bar effect */}
          <div className="mt-3 h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/25 transition-all duration-75"
              style={{
                width: targetTotal > 0 ? `${Math.min((storeState.currentValue / targetTotal) * 100, 100)}%` : '100%'
              }}
            ></div>
          </div>
        </div>

        {/* Floating sparkles */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-2 right-2 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-4 w-1 h-1 bg-purple-300 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
      </div>
    </div>
  );
}