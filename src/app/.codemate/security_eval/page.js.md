# Security Vulnerability Report for Provided React Code

Below is a **security-focused code review** of the provided React ("ConstructionTracker") code. All points pertain to security vulnerabilities or weaknesses.

---

## 1. **Insecure Credential Storage (Local Storage)**

**Problem:**  
User credentials, including passwords, are stored in `localStorage` with code such as:
```js
localStorage.setItem('shriji_users', JSON.stringify(users));
localStorage.setItem('shriji_currentUser', JSON.stringify(newUser));
```
Passwords are checked in plaintext during login.

**Risk:**  
- **localStorage** is accessible via JavaScript in the browser, making it vulnerable to XSS attacks.
- All user credentials (including the password) are stored in readable, modifiable form, making it easy for attackers to retrieve, impersonate, or manipulate users.

**Mitigation Suggestions:**  
- Do not store passwords in localStorage or even on the client.
- If using local accounts, **always hash passwords** before storage (ideally store on server, not in browser).
- Use a proper backend authentication mechanism with secure, **http-only cookies or tokens** sent from the server side only.

---

## 2. **Hard-Coded Credential Exposure**

**Problem:**  
The code creates a default "admin" user with the following line:
```js
const defaultAdmin = {
  ...
  email: 'admin@shriji.com',
  username: 'admin',
  password: 'admin123',
  ...
};
```
And logs the credentials to the console.

**Risk:**  
- **Well-known default admin credentials** are dangerous.
- Exposing this in the console could be leveraged by attackers via social engineering or through code leakage.

**Mitigation Suggestions:**  
- Never use guessable default credentials in production.
- Provide admin account creation via a secure, manual process, or force password change on first use.
- Remove any code that logs sensitive credentials to the console.

---

## 3. **Weak Password Policy / Invite Code**

**Problem:**  
- There is no password strength enforcement; any user can register a weak password.
- A public "invite code" (`SHRIJI`) is used for registration.

**Risk:**  
- Weak passwords are susceptible to brute-force attacks.
- Once (or if) "SHRIJI" becomes publicly known, anyone can register.

**Mitigation Suggestions:**  
- Enforce password complexity, length, and perhaps rate-limit or delay repeated login attempts.
- Use proper invitation/ticketing system for account creation instead of a single static invite code.
- Never expose invite codes in the client-side code for security through obscurity.

---

## 4. **Plaintext Password Storage and Transmission**

**Problem:**  
- Passwords are stored, compared, and transmitted in plaintext.
- The code expects the password field in plaintext both for registration and login.

**Risk:**  
- Users are at risk if any malicious script runs in the browser.
- Reuse of the same password elsewhere puts users at broader risk.

**Mitigation Suggestions:**  
- Use secure, salted hashing functions for password storage.
- Offload authentication to a backend using HTTPS, never send/store raw passwords on client.

---

## 5. **Exposure of Secrets (API Keys)**

**Problem:**  
Google Sheets API key is hardcoded:
```js
const API_KEY = 'AIzaSyDjGF92yTLtzhoaUHC_TwB69YT3QqtgJcA';
```
And an Apps Script endpoint is also public.

**Risk:**  
- Anyone with code access can extract and abuse API keys, potentially leading to API quota exhaustion or data exposure/alteration.
- The Apps Script endpoint could be abused for unauthorized writes if insufficient server-side validation is done.

**Mitigation Suggestions:**  
- Never hard-code API keys in frontend code; proxy API requests through a secure backend instead.
- Restrict API keys via Google Console.
- Ensure all Apps Script HTTP endpoints enforce strong server-side authentication and authorization.

---

## 6. **Lack of XSS Protections**

**Problem:**  
- User-generated input is rendered via various components.
- Example: notes, properties, comments, etc., may be injected and rendered without sanitization.

**Risk:**  
- If an attacker enters malicious `<script>` or event handler code in notes/fields, and the application ever renders it as HTML (e.g., with dangerouslySetInnerHTML or a future update), an XSS attack is possible.

**Mitigation Suggestions:**  
- Always sanitize user-generated content before rendering.
- Prefer rendering as plain text, and escape HTML when interpolation is used.

---

## 7. **Potential CSRF in Google Apps Script Update Interface**

**Problem:**  
The "updateSheetCellWithFallback" function submits a form to an Apps Script endpoint, e.g.:
```js
form.submit()
```
to:
```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
```

**Risk:**  
- Without anti-CSRF tokens on the backend, any site could craft a hidden form to write to the spreadsheet if the endpoint isn't properly protected.

**Mitigation Suggestions:**  
- Apps Script must enforce server-side authentication and/or anti-CSRF mechanism, not just accept any POST.
- Proxy requests through a backend, validate user credentials or session on each write.

---

## 8. **Direct Use of `document` & DOM Manipulation**

**Problem:**  
- Code uses `document.querySelector` and similar approaches.
- Example:  
```js
const searchInput = document.querySelector('input[placeholder="Search all fields..."]');
```

**Risk:**  
- Opens up to DOM clobbering attacks if attackers are able to inject malicious HTML.
- Not inherently a vulnerability, but using React state is preferred for safety and predictability.

**Mitigation Suggestions:**  
- Always use React state over direct DOM querying and manipulation.

---

## 9. **No Brute-Force Protections (Login, Register, Sheet Updates)**

**Problem:**  
- No rate limiting or throttling on authentication or sheet update attempts.

**Risk:**  
- Automated attacks (guessing passwords, spamming registration or API endpoints) could go undetected.

**Mitigation Suggestions:**  
- Implement rate limiting both client-side (with delays) and most importantly server-side.
- Lock out accounts or add CAPTCHA after repeated failures.

---

## 10. **Unprotected Sensitive User Data**

**Problem:**  
- The full users database is readable and modifiable via localStorage by any JS running on the client.

**Risk:**  
- Malicious code (via XSS or malicious browser extensions) can steal user data or elevate privileges.

**Mitigation Suggestions:**  
- Remove all sensitive storage from localStorage.
- Use secure, server-based databases for all PII and credential management.

---

# **Summary Table**

| Vulnerability                                   | Risk                                           | Recommendation                                 |
|-------------------------------------------------|------------------------------------------------|------------------------------------------------|
| Plaintext password storage in localStorage      | Credential theft, impersonation                | Use server-side authentication, hash passwords  |
| Hard-coded admin credentials                    | Account takeover, privilege escalation         | Remove/force-change default creds               |
| Weak/no password complexity, public invite code | Easy compromise, automated signups             | Enforce strong credentials and invitations      |
| Exposed API keys/app scripts endpoints          | Data manipulation, quotas attack, DDoS         | Move keys to backend, secure endpoints          |
| Lack of input sanitization                      | Cross-site scripting (XSS) attacks             | Sanitize and escape all user inputs             |
| Potential CSRF on Google Apps Script endpoints  | Unauthorized writes to Google Sheets           | Add server-side auth, CSRF tokens               |
| Unnecessary direct DOM manipulation             | Potential for DOM clobbering attacks           | Use React state only                            |
| No brute-force protection                       | Account/system compromise, flooding            | Add client/server rate-limiting & lockout       |
| Unprotected user data in browser                | Data theft, privilege abuse                    | Keep user data server-side                      |

---

# **Conclusions (Critical Points)**

- Move all authentication and sensitive storage OFF the client and into a secure backend.
- Never store or compare plaintext passwords in the client.
- Never use default or hard-coded admin credentials in production.
- Input/output sanitization is essential throughout.
- Secure all API endpoints and keys.

**Until these points are addressed, this app should be considered insecure and not suitable for production or sensitive use.**