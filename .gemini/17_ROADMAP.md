# Future Roadmap

This roadmap outlines the strategic progression of the Further Studies Portal from its current MVP state to a comprehensive, scalable platform.

## V1 (Current) - The MVP Baseline
- ✅ Google-First Identity & Authentication
- ✅ Multi-Step Registration Workflow
- ✅ Role-Based Access (Students vs. Admins)
- ✅ Admin Command Center (Search, Filter, Review)
- ✅ Real-time Status Tracking
- ✅ Tashjee Request Submission

## V1.1 - Technical Debt & Refactoring
- **Component Modularization:** Break down `StudentPage.jsx` into smaller, testable sub-components.
- **Role Management Security:** Migrate the hardcoded Super Admin (`idrislaheri72@gmail.com`) to a secure Firestore config or Firebase Custom Claims.
- **Performance:** Evaluate and potentially replace `framer-motion` with native CSS to reduce the initial JS payload.

## V2 - The Form Engine & Notifications
- **Schema-Driven Forms (Form Builder):** Replace the hardcoded React registration form with a dynamic JSON-driven renderer (see `13_FORM_ENGINE_STRATEGY.md`).
- **Admin Schema Editor:** Allow admins to update form questions, add new steps, or change validation rules without code deployment.
- **Notification System:** Integrate Firebase Extensions (e.g., Trigger Email) to send automated emails when a student's status changes from `Pending` to `Approved` or `On Hold`.

## V3 - Analytics & Enterprise Features
- **Data Export:** Allow admins to export filtered student records to CSV or PDF for offline processing.
- **Audit Logs:** Implement an immutable audit trail collection (`audit_logs`) tracking every status change, whitelist addition, and admin login.
- **Advanced Analytics:** Implement a dedicated analytics dashboard visualizing application trends, popular institutions, and historical data across academic years.
- **Role Expansion:** Introduce granular admin roles (e.g., "Reviewer" vs "Manager") to restrict destructive actions like "Clear Registration".