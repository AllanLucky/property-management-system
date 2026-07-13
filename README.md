# 🏡 Estate Management System

A modern, secure, and scalable **Estate Management System** built with **Laravel 12**, **React 19**, **Redux Toolkit**, **Vite**, **Tailwind CSS**, and **MySQL**. The platform enables administrators, property managers, landlords, agents, tenants, accountants, maintenance staff, and customers to manage every aspect of a real estate business from a single dashboard.

---

# 🚀 Features

## 🔐 Authentication & Security

* Secure Login & Logout
* User Registration
* Email OTP Verification
* Forgot Password
* Reset Password
* Sanctum API Authentication
* Refresh Token Rotation
* Account Approval Workflow
* Account Status Management
* Role Based Access Control (RBAC)
* Permission Management
* Protected Routes
* Rate Limiting
* Activity Logging

---

# 👥 User Management

* User CRUD
* User Profiles
* Avatar Upload (Cloudinary)
* User Roles
* User Permissions
* Account Verification
* Account Approval
* Ban / Unban Users
* Search Users
* User Analytics
* User Reports

---

# 🏢 Property Management

* Property CRUD
* Property Categories
* Property Types
* Property Features
* Property Amenities
* Property Gallery
* Property Images
* Featured Properties
* Property Verification
* Property Publishing
* Property Statistics
* Property Reports
* Property Analytics

---

# 🏘 Property Categories

* Category CRUD
* Parent Categories
* Category Images
* Category Status
* Category Statistics
* Category Reports

---

# 🏠 Property Types

* Create Property Types
* Edit Property Types
* Delete Property Types
* Publish Property Types
* Statistics Dashboard

---

# ⭐ Property Reviews

* Review Management
* Review Details
* Edit Reviews
* Delete Reviews
* Publish / Unpublish
* Verify / Unverify
* Customer Ratings
* Like Reviews
* Review Analytics
* Review Reports
* Rating Distribution
* Sentiment Analysis
* Review Statistics

---

# 📅 Booking Management

* Booking Requests
* Booking Approval
* Booking Rejection
* Booking History
* Booking Reports
* Booking Analytics

---

# 📑 Lease Management

* Lease Creation
* Lease Renewal
* Lease Expiry Tracking
* Lease Reports
* Lease Analytics

---

# 👨‍💼 Tenant Management

* Tenant Registration
* Tenant Profiles
* Lease Assignment
* Payment Tracking
* Tenant Reports

---

# 🏠 Landlord Management

* Landlord Profiles
* Assigned Properties
* Revenue Reports
* Analytics Dashboard

---

# 💰 Payments

* Rent Payments
* Deposit Payments
* Payment History
* Payment Reports
* Financial Analytics

---

# 🛠 Maintenance

* Maintenance Requests
* Maintenance Tracking
* Technician Assignment
* Maintenance Reports
* Maintenance Analytics

---

# 📢 Communication

* Notifications
* Announcements
* Conversations
* Messages
* Campaigns

---

# 📊 Dashboard

* Overview Statistics
* Revenue Summary
* Occupancy Rate
* Monthly Reports
* Charts
* Graphs
* Analytics
* KPIs

---

# 📈 Reports

* Property Reports
* User Reports
* Booking Reports
* Review Reports
* Financial Reports
* Maintenance Reports
* Export Reports

---

# 🌍 Location Management

* Countries
* Regions
* Counties
* Cities
* Areas
* Streets

---

# 📂 Technologies

## Backend

* Laravel 12
* PHP 8.2+
* MySQL
* Laravel Sanctum
* Spatie Laravel Permission
* Cloudinary
* Laravel Queues
* REST API

---

## Frontend

* React 19
* Redux Toolkit
* React Router DOM
* Axios
* Tailwind CSS
* Lucide React
* Vite

---

# 📁 Project Structure

```
estate-management/
│
├── backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/
│   ├── routes/
│   ├── storage/
│   └── resources/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── store/
│   │   └── utils/
│   └── public/
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/estate-management.git
```

```bash
cd estate-management
```

---

# Backend Setup

```bash
cd backend
```

Install dependencies

```bash
composer install
```

Copy environment file

```bash
cp .env.example .env
```

Generate application key

```bash
php artisan key:generate
```

Configure your database inside `.env`.

Run migrations and seeders

```bash
php artisan migrate --seed
```

Create storage link

```bash
php artisan storage:link
```

Run the backend

```bash
php artisan serve
```

Backend URL

```
http://127.0.0.1:8000
```

---

# Frontend Setup

```bash
cd frontend
```

Install packages

```bash
npm install
```

Run development server

```bash
npm run dev
```

Frontend URL

```
http://localhost:5173
```

---

# Default Roles

* Super Admin
* Admin
* Property Manager
* Landlord
* Agent
* Accountant
* Maintenance
* Technician
* Lease Manager
* Support Staff
* Auditor
* Customer
* Tenant

---

# API Features

* RESTful API
* JSON Responses
* Pagination
* Search
* Filtering
* Sorting
* Validation
* Resources
* Error Handling
* Authentication Middleware

---

# Performance

* Lazy Loading
* Pagination
* Optimized Queries
* Redux State Management
* Vite Hot Reload
* Code Splitting

---

# Security

* Laravel Sanctum
* CSRF Protection
* Password Hashing
* Email Verification
* OTP Authentication
* Role & Permission Middleware
* Secure API Tokens
* Input Validation

---

# Future Enhancements

* Mobile Application
* Real-Time Notifications
* AI Property Recommendations
* AI Review Sentiment Detection
* Online Payments
* SMS Notifications
* Interactive Maps
* Advanced Business Intelligence
* Multi-language Support
* Multi-currency Support

---

# Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

# License

This project is released under the **MIT License**.

---

# Author

**Estate Management System**

Built with ❤️ using **Laravel**, **React**, **Redux Toolkit**, **Tailwind CSS**, and **Vite** to deliver a secure, modern, and scalable real estate management platform.
