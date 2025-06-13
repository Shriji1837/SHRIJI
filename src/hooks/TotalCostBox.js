import React, { useSyncExternalStore, useCallback } from 'react';

// External store for animation state (persists across component mounts)
const animationStore = {
  state: {
    hasInitialized: false,
    lastKnownTotal: 0,
    currentValue: 0,
    isAnimating: false
  },
  
  listeners: new Set(),
  
  // Subscribe function for useSyncExternalStore
  subscribe(callback) {
    animationStore.listeners.add(callback);
    return () => {
      animationStore.listeners.delete(callback);
    };
  },
  
  // Get current state snapshot
  getSnapshot() {
    return animationStore.state;
  },
  
  // Update state and notify subscribers
  setState(newState) {
    animationStore.state = { ...animationStore.state, ...newState };
    animationStore.listeners.forEach(callback => callback());
  },
  
  // Animation logic
  startAnimation(fromValue, toValue) {
    if (animationStore.state.isAnimating) {
      console.log('🚫 Animation already running');
      return;
    }
    
    console.log(`🎯 Starting animation: ${fromValue} → ${toValue}`);
    
    animationStore.setState({
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
        animationStore.setState({
          currentValue: toValue,
          isAnimating: false,
          lastKnownTotal: toValue
        });
        clearInterval(timer);
        console.log(`✅ Animation complete: ${toValue}`);
      } else {
        // Animation step
        const progress = currentStep / steps;
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const newValue = Math.round(fromValue + (difference * easedProgress));
        animationStore.setState({ currentValue: newValue });
      }
    }, stepDuration);
  }
};

export function ProfessionalCounter({ targetTotal = 100, label = "TOTAL COST", subtitle = "Animation Demo" }) {
  // Subscribe to external store using React 18's official hook
  const storeState = useSyncExternalStore(
    animationStore.subscribe,
    animationStore.getSnapshot
  );
  
  // Handle target changes
  const handleTargetChange = useCallback((newTarget) => {
    const { hasInitialized, lastKnownTotal, isAnimating } = storeState;
    const targetValue = Math.round(newTarget);
    
    // Case 1: First time ever
    if (!hasInitialized) {
      console.log(`🎯 FIRST TIME: 0 → ${targetValue}`);
      animationStore.setState({ hasInitialized: true });
      animationStore.startAnimation(0, targetValue);
      return;
    }
    
    // Case 2: Already animating
    if (isAnimating) {
      console.log(`🚫 Currently animating, ignoring: ${targetValue}`);
      return;
    }
    
    // Case 3: No change
    if (lastKnownTotal === targetValue) {
      console.log(`🚫 No change: ${lastKnownTotal} → ${targetValue}`);
      return;
    }
    
    // Case 4: Value changed - animate
    console.log(`🎯 VALUE CHANGED: ${lastKnownTotal} → ${targetValue}`);
    animationStore.startAnimation(lastKnownTotal, targetValue);
  }, [storeState]);
  
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
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-2xl blur-xl"></div>
      
      {/* Main total cost container */}
      <div className="relative bg-gradient-to-br from-gray-800/90 via-gray-800/95 to-gray-900/90 backdrop-blur-xl border border-green-500/30 rounded-2xl p-4 shadow-2xl">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-green-500/5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-16 h-16 bg-emerald-500/5 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
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
                  {label}
                </div>
                {/* Main gradient text */}
                <h3 className="relative text-sm font-black bg-gradient-to-r from-green-300 via-emerald-200 to-green-300 bg-clip-text text-transparent tracking-wide animate-pulse">
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
              <div className="absolute inset-0 text-2xl font-black text-green-400 blur-sm opacity-50">
                {formatValue(storeState.currentValue)}
              </div>
              
              {/* Main text with animation scaling */}
              <div className={`relative text-2xl font-black bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent transition-all duration-300 ${
                storeState.isAnimating ? 'animate-pulse scale-110' : 'animate-pulse scale-100'
              }`}>
                {formatValue(storeState.currentValue)}
              </div>
            </div>
            
            {/* Subtitle with animation indicator */}
            <div className="flex items-center justify-center space-x-2 mt-2">
              <div className={`w-1.5 h-1.5 bg-green-500 rounded-full transition-all duration-300 ${
                storeState.isAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
              }`}></div>
              <span className={`text-green-400 text-xs font-medium tracking-wider transition-all duration-300 ${
                storeState.isAnimating ? 'text-green-300' : 'text-green-400'
              }`}>
                {storeState.isAnimating ? 'UPDATING' : 'LIVE TOTAL'}
              </span>
              <div className={`w-1.5 h-1.5 bg-green-500 rounded-full transition-all duration-300 ${
                storeState.isAnimating ? 'animate-ping scale-150' : 'animate-pulse scale-100'
              }`} style={{animationDelay: '0.5s'}}></div>
            </div>
          </div>

          {/* Progress bar effect */}
          <div className="mt-3 h-1 bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg shadow-green-500/25 transition-all duration-75"
              style={{
                width: targetTotal > 0 ? `${Math.min((storeState.currentValue / targetTotal) * 100, 100)}%` : '100%'
              }}
            ></div>
          </div>
        </div>

        {/* Floating sparkles */}
        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-2 left-2 w-1 h-1 bg-emerald-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-4 w-1 h-1 bg-green-300 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
      </div>
    </div>
  );
}