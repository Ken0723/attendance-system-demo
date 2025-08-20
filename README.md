# 📋 Attendance System

This project is a comprehensive attendance management system built with a React frontend and Flask backend. The system is currently deployed locally using Docker containers rather than on a cloud platform.

## 🎯 Project Highlights
- Real-time card reader integration for seamless check-in/out
- Role-based access control system (RBAC)
- Comprehensive API testing suite
- Auth0 integration for secure authentication

## 📌 Overview

The Attendance System provides a streamlined solution for tracking employee attendance, managing events, and maintaining attendance records. It features role-based access control with different capabilities for employers and employees.

### 🛠️ Technical Stack

- Frontend: React
- Backend: Flask (Python)
- Deployment: Docker
- Card Reader Integration: Custom Python module

### 🔐 User Roles

Employee
- View daily attendance status
- View company events
- Access personal attendance history
- Manage personal profile  
  
Employer
- All employee privileges
- Create and manage events
- Add attendance records for employees
- Access comprehensive attendance reporting

## 💳 Card Reader Integration

The system includes a dedicated card reader module located at backend/app/reader/cardreader.py. This module interfaces with physical card readers to automatically record employee check-ins by storing the scanned card numbers directly in the database. It allowed to input a user id manualy.  
There is a video provided, that demonstration how this work.  

### 🎴 Two Demo Card

Employee
- 7404696
  
Employer  
- 7595700

## 🧪 Testing
- Comprehensive API test suite in `/backend/app/tests/`

## 🌳 System Architecture
```plaintext
├── frontend/                  # React frontend application
│   └── Dockerfile             # Front-end Docker setup
│   └── .env                   # Front-end Environment variables
│   └── App.js                 # Front-end main
│   └── src/                   
│       ├── components/        # Front-end components
│       ├── error-page/        # Front-end error pages
│       ├── pages/             # Front-end pages
│       ├── utils/             # Front-end Route and API protection
│
├── backend/                   # Flask backend API
│   └── Dockerfile             # Back-end Docker setup
│   └── requirements.txt       # All necessary lib
│   └── run_seed.py            # Used for run commands
│   └── .env                   # Back-end Environment variables
│   └── app/
│       ├── commands/          # Commands, use for generate some records
│       ├── errors/            # Error handling and exceptions
│       ├── models/            # Database models
│       ├── routes/            # API endpoints
│       ├── services/          # Auth Services
│       ├── tests/             # Testing all API
│       └── reader/            # Card reader integration
│           └── cardreader.py  # Card reader implementation
│       ├── main.py            # Back-end main
│
├── .gitignore                 # Github ignore file
├── .env                       # Global Environment variables
├── API_Document.md            # API Documentation
├── docker-compose.yml         # Docker deployment configuration
└── README.md                  # This documentation file
```

## 📸 Screenshots & Demo

### 🎥 Live Demo
**[► Watch Card Reader Integration Video](https://drive.google.com/file/d/12uzH094ImmDu8WkvOUDvAhVA38wi2kVl/view?usp=sharing)**

### 🖼️ System Screenshots

#### Login & Authentication
![Login Page](/images/login.png)
![Auth0 Login](/images/auth0-login.png)
> Secure Auth0-powered authentication system

#### Layout
![Layout](/images/layout.png)
> Overall the system layout

#### Attendance Record
![Attendance Record](/images/attendance-record.png)
> Showing the attendance record of the account owner

#### Mobile Responsive View
![Mobile Responsive View](/images/mobile-responsive-view.png)
> Showing the attendance record of the account owner

#### Admin - Permission Control
![Admin - Permission Control](/images/permission-control.png)
> Control each user's permission