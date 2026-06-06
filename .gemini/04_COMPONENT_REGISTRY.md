# Component Registry

## Core Components
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **AppShell** | `src/components/AppShell.jsx` | Main application layout wrapper, providing navigation and layout structure. | `AuthContext`, `lucide-react`, `react-router-dom` |
| **AuthCard** | `src/components/AuthCard.jsx` | Standardized Google Sign-In card for both Student and Admin roles. | `AuthContext`, `GoogleIcon` |
| **Loading** | `src/components/Loading.jsx` | Reusable loading spinner and state indicator. | `lucide-react` |
| **StatusBadge** | `src/components/StatusBadge.jsx` | Visual indicator for registration statuses (Pending, Approved, On-Hold). | `lucide-react` |
| **Footer** | `src/components/Footer.jsx` | Standard application footer. | None |

## Pages / Views
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **StudentPage** | `src/pages/StudentPage.jsx` | The entire student workflow: Authentication, Dashboard, Status, Multi-step Form. | `framer-motion`, `firestore.js`, `registration.js` |
| **AdminPage** | `src/pages/AdminPage.jsx` | The admin command center: Stats, Data Table, Review Modal, Whitelist Management. | `firestore.js`, `registration.js`, `TashjeeAdminPanel` |
| **HomePage** | `src/pages/HomePage.jsx` | Landing view. | - |
| **UnauthorizedPage**| `src/pages/UnauthorizedPage.jsx`| Access denied fallback view. | - |
| **ProfileLink** | `src/pages/ProfileLink.jsx` | Prompts new students for their TR Number and Full Name during onboarding. | `firestore.js` |
| **TashjeeStudentTab**| `src/pages/TashjeeStudentTab.jsx`| Student interface for submitting Tashjee (academic proof) requests. | `tashjee.js`, `firebase.js` |
| **TashjeeAdminPanel**| `src/pages/TashjeeAdminPanel.jsx`| Admin interface for reviewing and managing Tashjee requests. | `tashjee.js`, `firebase.js` |

## Contexts
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **AuthContext** | `src/context/AuthContext.jsx` | Global state for Firebase Authentication, user profiles, and role (admin/student) verification. | `firebase.js`, `firestore.js` |

## Observations
- **Component Size:** `StudentPage.jsx` and `AdminPage.jsx` are oversized. They contain multiple sub-components (e.g., `RegistrationTab`, `StepContent`, `AdminAccessPanel`, `ReviewModal`) within the same file.
- **Technical Debt Indicator:** The logic inside `StudentPage.jsx` for managing form steps is robust but tightly coupled. Future updates to the form schema will require manual JSX modifications. Moving to a schema-driven form engine is recommended.