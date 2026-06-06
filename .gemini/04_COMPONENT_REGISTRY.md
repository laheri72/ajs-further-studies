# Component Registry

## Core Components
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **AppShell** | `src/components/AppShell.jsx` | Main application layout wrapper, providing navigation and layout structure. | `AuthContext`, `lucide-react`, `react-router-dom` |
| **AuthCard** | `src/components/AuthCard.jsx` | Standardized Google Sign-In card for both Student and Admin roles. | `AuthContext`, `GoogleIcon` |
| **Loading** | `src/components/Loading.jsx` | Reusable loading spinner and state indicator. | `lucide-react` |
| **StatusBadge** | `src/components/StatusBadge.jsx` | Visual indicator for registration statuses (Pending, Approved, On-Hold). | `lucide-react` |
| **Footer** | `src/components/Footer.jsx` | Standard application footer. | None |

## Student Components
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **StatusLanding** | `src/components/student/StatusLanding.jsx` | Displays the current registration status and admin notes to the student. | `lucide-react`, `StatusBadge` |
| **RegistrationFlow**| `src/components/student/RegistrationFlow.jsx` | Contains the multi-step registration form logic, rendering, and summary. | `framer-motion`, `lucide-react` |

## Admin Components
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **AdminAccessPanel** | `src/components/admin/AdminAccessPanel.jsx` | Super Admin panel to add/remove admins and manage the student whitelist. | `lucide-react`, `firestore.js` |
| **ReviewModal** | `src/components/admin/ReviewModal.jsx` | Modal for admins to review a student's submission, change status, and add notes. | `lucide-react`, `firestore.js` |

## Pages / Views
| Component | Location | Purpose | Dependencies |
| :--- | :--- | :--- | :--- |
| **StudentPage** | `src/pages/StudentPage.jsx` | The student workflow wrapper and dashboard state management. | `StatusLanding`, `RegistrationFlow`, `firestore.js` |
| **AdminPage** | `src/pages/AdminPage.jsx` | The admin command center layout, stats, and data table. | `AdminAccessPanel`, `ReviewModal`, `firestore.js` |
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
- **Component Modularity:** Following the V1.1 stabilization pass, `StudentPage.jsx` and `AdminPage.jsx` were successfully refactored. Inline sub-components were extracted into dedicated `src/components/student/` and `src/components/admin/` directories, vastly improving testability and readability.
- **Technical Debt Indicator:** While components are modular, the registration form logic inside `RegistrationFlow.jsx` remains hardcoded. Future updates to the form schema will require manual JSX modifications. Moving to a schema-driven form engine is recommended for V2.