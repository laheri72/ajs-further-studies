# Project Overview

## Executive Summary
The **Further Studies Portal** is a secure, elegant web application designed for Jamea’s students to register academic plans beyond Jamea, coordinate their 'raza' (permission/guidance) process, and track their application statuses. It serves as a unified digital platform replacing fragmented manual processes. 

## Why it Exists
The manual coordination of further studies and raza requests was difficult to track for both students and Idara (administrative) staff. The system provides a reliable, single source of truth for structured data capture and application tracking.

## Who Uses It
1. **Students:** Existing Jamea students exploring further studies, applying for raza or istirshaad araz, and coordinating exam/event clashes.
2. **Admins (Idara Staff):** Authorized administrative staff who review student records, update statuses, leave notes, and manage the system.

## Business Goals
- Replace manual tracking with structured digital records.
- Reduce back-and-forth communication for status checks.
- Tie each student record to a verified, authenticated Google account.
- Improve clarity, visibility, and coordination for both students and Idara staff.

## Core Features
- **Google-First Identity:** Students and Admins authenticate seamlessly via Google Sign-In.
- **Role-Based Workflows:** Distinct, isolated experiences for students and whitelisted admins.
- **Guided Multi-Step Registration:** A robust wizard for students to submit academic details, intent, and clash-related information.
- **Real-Time Status Tracking:** Students have a dashboard reflecting their current standing (Pending, Approved, On-Hold) and any notes from the Idara.
- **Admin Command Center:** A unified dashboard for admins to search, filter, review, and act upon student submissions.
- **Tashjee Requests:** Additional workflow for specific academic success/proof submissions and reviews.

## Current Maturity Level
- **Version:** V1 MVP
- **Tech Stack:** React (Vite), Firebase (Auth, Firestore)
- **Deployment:** Single-page frontend architecture. The system is functional and meets the MVP success criteria (authentication, profile linking, form submission, status display, admin whitelist, and record management).

## Future Direction
- Expanding into a fully schema-driven **Form Builder V2** to handle dynamic forms.
- Introducing notifications (email/SMS) for status changes.
- Enabling PDF/CSV export capabilities.
- Adding deeper analytics, audit trails, and expanded role management.