# High-Level Documentation: ConstructionTracker Component

---

## Overview

The `ConstructionTracker` React component implements a **modern, feature-rich construction project tracking web interface**. It allows authenticated users to manage, filter, and update detailed project task/items data stored in a Google Sheet. The application includes role-based access, inline editing with real-time Google Sheets updates, navigation, search, filters, insightful summaries, notifications, and user profile management—all within an engaging, responsive UI.

---

## Major Functional Areas

### 1. **Authentication and User Management**

- **Login/Register System**:  
  - Register with email, (optional username), password, and an invite code for access.
  - Login with email/username & password.  
  - User credentials are stored locally in `localStorage`.
  - Default admin credentials are auto-initialized if missing.
- **User Sessions**:  
  - Maintains session via localStorage.
  - Auth state determines access to the main app.
- **Role-Based Access**:  
  - Users have `admin` or `investor` roles.
  - Admins can edit all fields; investors have restricted edit access.
- **Profile Management**:  
  - Users can view and inline-edit their profile information.
  - Includes profile dropdown with sign-out option.

---

### 2. **Navigation and Layout**

- **Sidebar Navigation**:  
  - Hamburger menu toggles an animated sidebar with navigation items.
  - Responsive and visually modern, showing user info in the footer.
- **Header Bar**:  
  - Displays app title, current section, item counts, refresh/status, and user controls.

---

### 3. **Data Layer (Google Sheets Integration)**

- **Data Fetching**:  
  - Loads project/task/item breakdown from a Google Sheet via the Sheets API.
  - Keeps data updated with manual and periodic automatic refresh (every 30 seconds).
- **Data Structure**:  
  - Each row in the sheet corresponds to a project item with comprehensive metadata.
- **Editing**:  
  - Inline, cell-level editing in the table.
  - Changes are **immediately propagated to Google Sheets** via a Google Apps Script endpoint.
  - Local UI state is updated optimistically; errors revert changes and show a notification.
- **Sheet Column Mapping**:  
  - Robust mapping of item fields to sheet columns for precise updates.

---

### 4. **Table, Filtering, and Search**

- **Tabular Item View**:  
  - Large, scrollable table with columns for all task/item properties.
  - Supports inline-editing (role-restricted), clickable links, dates, currencies, and colored tags.
- **Custom Filter Controls**:  
  - Multi-faceted filter UI:
    - **Search**: Across all fields.
    - **Dropdown Filters**: Category, floor, vendor.
    - **Status Buttons**: "With Budget"/"Without Budget".
    - **Clear All**: Remove all active filters easily.
  - Filters and search can be freely combined.
- **Apply and Persist Filters**:  
  - Filters are re-applied after sheet data updates.
  - Statistics and active filter count shown with clear controls.

---

### 5. **User Experience and Visuals**

- **Feedback & Notifications**:  
  - Success/error toast notifications for all async actions (auth, cell updates, etc).
  - "Login success" animation when a user authenticates.
- **Polished UI Components**:  
  - Animated buttons, dropdowns, typing animations, and portal-based dropdown menus.
  - Responsive design with gradient backgrounds and blur effects.
  - Colorful icons, tags, and badges convey property state at a glance.
- **Performance**:  
  - Uses debounced, interval-based data polling.
  - Optimistic UI updates for edits with error fallback.

---

### 6. **Extensibility: Project Summary**

- If the user navigates to the "Project Summary" page, a separate component (`ProjectSummary`) is rendered, offering higher-level reporting and visualization (implementation not shown but is integrated).

---

## Key Technologies Used

- **React (function components + hooks)**
- **Google Sheets API & Google Apps Script for data persistence**
- **Lucide-react icon library**
- **TailwindCSS class utilities for modern, responsive styling**
- **LocalStorage for user/session state**

---

## Appropriate Use Cases

- Construction/property/project tracking and management for authenticated users, with shared, live Google Sheets as the "database".
- Modern dashboards requiring multi-user inline editing, quick status insights, and solid access controls.
- Scenarios where you need lightweight, extensible, role-sensitive data administration for structured sheet-backed data.

---

## Integration Points

- **Google Sheets**: Read-only via API key; write access via Google Apps Script endpoint.
- **LocalStorage**: Used for user authentication and persistence of session/profile data.

---

## Security Notes

- No backend other than Google Apps Script:  
  - **Sensitive use is limited by being a closed-group tool.**
  - Credentials are NOT hashed—**use only for trusted or demo purposes.**
- API keys/sheet IDs/CORS are exposed at the client; restrict shares and endpoint access as appropriate.

---

## Extending/Customizing

- Add summary visualization to Project Summary (charts, KPIs).
- Connect other sources or destinations for data (e.g., other spreadsheets, databases).
- Expand user roles and approval workflow.
- Enhance audit logging, permissions, or server-side authentication.

---

## TL;DR

**ConstructionTracker** is a _modern, auth-gated React dashboard_ for tracking, updating, and filtering detailed construction project data stored in Google Sheets, supporting inline live editing, role-based access, and rich, responsive UI/UX features.