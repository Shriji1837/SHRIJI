# 🛡️ Industry Code Review Report

## ConstructionTracker.js

This report identifies *critical industry violations*, *anti-patterns*, *unoptimized code*, and *potential errors* in your provided code. For every point, the **correct suggested code (in pseudocode)** is given in a separate code block **(not the full file, just the delta)**.

---

## 1. **Direct DOM Access in React (Anti-Pattern)**
- **Problem:** Directly using `document.querySelector` (e.g. in `applyFilters` and `clearAllFilters`) to get/set search term is an anti-pattern and can cause sync bugs.
- **Fix:** Use controlled components for all form inputs.
- **Suggested delta:**
  ```js
  // In applyFilters, use state instead of direct DOM access:
  const applyFilters = () => {
    // Remove document query
    // Use currentSearchInput from state
    setSearchTerm(currentSearchInput);
    applyFiltersToData(properties);
  };

  // In clearAllFilters, also avoid DOM access:
  const clearAllFilters = () => {
    setFilters({...});
    setSearchTerm('');
    setCurrentSearchInput('');
    setFilteredProperties(properties);
  }
  ```

---

## 2. **Unoptimized Filtering Logic**
- **Problem:** Filters are NOT re-applied automatically when their state changes (because applyFilters must be called manually).
- **Fix:** Use a useEffect on `filters` and `currentSearchInput` to auto-filter.
- **Suggested delta:**
  ```js
  useEffect(() => {
    // Apply filters every time filters or search input changes
    applyFiltersToData(properties);
  }, [filters, currentSearchInput, properties]);
  ```
  > *Remove the manual "Apply Filters" button entirely, or make it refresh from backend only. This aligns with instant-filter UX standards.*

---

## 3. **Leaking Sensitive API Keys**
- **Problem:** Google API Key is hardcoded in frontend.
- **Fix:** Store in backend/Environment variable, not source code. If using Next.js, use `process.env.NEXT_PUBLIC_GOOGLE_API_KEY` for public key, or only in API routes.
- **Suggested delta:**
  ```js
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  ```
  > *And add a .env entry instead of in JS code*

---

## 4. **Potential Infinite Loop in Filters**
- **Problem:** In `applyFiltersToData`, filteredProperties triggers setFilteredProperties, which is sometimes called in a useEffect with properties as dependency.
- **Fix:** Make sure you're not causing repeated trigger cycles.
- **Suggested delta:**
  *Check for changes before setting state:*
  ```js
  if (!lodash.isEqual(filtered, filteredProperties)) {
    setFilteredProperties(filtered);
  }
  ```
  *(You'd use lodash's isEqual or other deep comparison utility.)*

---

## 5. **Error Handling for LocalStorage JSON**
- **Problem:** `localStorage.getItem(...); JSON.parse(...)` can throw if the storage is corrupted.
- **Fix:** Use try/catch everywhere you parse.
- **Suggested delta:**
  ```js
  function safeJSONParse(item) {
    try { return JSON.parse(item); } catch { return []; }
  }
  // ...replace all JSON.parse(localStorage.getItem(...)) with safeJSONParse(...)
  ```

---

## 6. **Date Formatting Function is Unreliable**
- **Problem:** `formatDate` handles Excel numbers but does not account for all date strings, and the Excel epoch formula is off by 2 days due to Excel bug (should add +2 days).
- **Fix:** Correct Excel epoch and improve validation.
- **Suggested delta:**
  ```js
  // Correct Excel epoch (Excel bug - 2 days offset)
  else if (typeof dateValue === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    date = new Date(excelEpoch.getTime() + dateValue * 86400000);
  }
  ```

---

## 7. **Inefficient Inline Functions and Objects in JSX**
- **Problem:** Passing functions and objects like `options={...}` or `onClick={() => ...}` directly can cause unnecessary renders.
- **Fix:** Memoize with `useCallback`, and use `useMemo` for options arrays.
- **Suggested delta:**
  ```js
  const handleFilterChange = useCallback((type, value) => { ... }, []);
  const categoryOptions = useMemo(() => [...], [properties]);
  // and so on for floorOptions, vendorOptions
  ```

---

## 8. **Immutability Violation in EditableCell**
- **Problem:** Changing both properties and filteredProperties for edit (could be out-of-sync).
- **Fix:** Change "properties" only. The filtered list should be derived from "properties" always.
- **Suggested delta:**
  ```js
  // In EditableCell.handleSave
  setProperties(prev => prev.map(...)); // Remove setFilteredProperties from here
  // Let useEffect for filtering update filteredProperties
  ```

---

## 9. **Potential Race Condition: Manual Refresh Overwrites Filters**
- **Problem:** On "Refresh", `fetchSheetData` sets filteredProperties via `applyFiltersToData` which can use stale filters/search.
- **Fix:** Always derive filteredProperties from up-to-date states only, and remove filter calls from fetch. (Let useEffect handle it.)
- **Suggested delta:**
  ```js
  // remove applyFiltersToData(transformedData) from fetchSheetData
  // Always call setProperties(transformedData)
  // Let the useEffect handle filtering as in #2 above.
  ```

---

## 10. **No Dependency or Version Pinning for Imported Libraries**
- **Problem:** No indication of `lucide-react`, `react-dom`, etc. versions.  
- **Action:** Ensure versions are locked in `package.json` and add an explicit comment in code for team clarity.
- **Suggested comment:**
  ```js
  // IMPORTANT: Make sure lucide-react, react-dom, etc. versions are pinned and audited for security.
  ```

---

## 11. **Unoptimized Search Filtering**
- **Problem:** Search filtering in `applyFiltersToData` does a blind `.toString().toLowerCase()` for every field, which could be slow for large data.
- **Fix:** Use explicit string join or pre-index values if performance drops.
- **Suggestion:**  
  No code delta unless performance is an issue, but comment for future optimization.

---

## 12. **Component Naming and Folder Structure**
- **Observation:** All major components (sidebar, cells, dropdowns) are in a single file.
- **Suggestion:** For maintainability, split them into separate files/folders.

---

## 13. **UI Accessibility & Keyboard Navigation**
- **Observation:** Good ARIA use on sidebar, but some buttons (e.g. in CustomDropdown options) lack proper keyboard navigation support.
- **Suggestion:** Add tabIndex, ARIA attributes, and (optionally) keyboard controls.

---

## 14. **Missing React Keys**
- **Observation:** In map for options, filteredProperties, etc, check that items have unique keys.
- **Correct:** Already in place, but always review for any maps where key might be unstable.

---

## 15. **Security: LocalStorage for Passwords**
- **Risk:** Storing passwords in localStorage is highly insecure and should never be done.
- **Fix:** Use proper backend auth; NEVER store plain-text or hashed password in browser localStorage.

*No pseudocode here: this is a major architectural fix.*

---

## Summary

**This code functions but has several _critical issues_ that should be addressed before production:**

- Never access the DOM directly in React applications for value management.
- All user filters/search must be in React state, and filter logic should auto-apply based on state.
- Don't store API keys or passwords in source/frontend (biggest industry violation).
- Always set derived state from source-of-truth, not by mutating filteredProperties directly.
- Immutability and performance optimizations suggest using `useCallback`, `useMemo`, and useEffect filtering patterns.

---

### **Quick Reference: Example Deltas**

```js
// 1. Remove document.querySelector in filter logic:
const applyFilters = () => {
  setSearchTerm(currentSearchInput);
  applyFiltersToData(properties);
};

// 2. Auto-filter on filter or search change:
useEffect(() => {
  applyFiltersToData(properties);
}, [filters, currentSearchInput, properties]);

// 3. API Key from environment:
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

// 4. Defensive JSON parse:
function safeJSONParse(str) {
  try { return JSON.parse(str); } catch { return []; }
}
```

---

## **☑️ Address ALL ABOVE ISSUES before moving to production.**  
*If unsure on any, request a training session or more detailed code walk-through from your lead.*

---

**End of Review.**