# Campus Event Scheduling and Space Management System

A comprehensive web-based platform for managing campus events, venue bookings, and space allocation at Multimedia University (MMU). This system streamlines the process of event organization, venue requests, and administrative approvals.

## 📋 Table of Contents
- [Features](#features)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Installation](#manual-installation)
- [User Roles & Permissions](#user-roles--permissions)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Technologies Used](#technologies-used)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## ✨ Features

### For Students
- **Booking Management**: Create, edit, and withdraw venue booking requests
- **Booking Calendar**: Visual calendar view of all bookings
- **Request Tracking**: Monitor booking request status (Pending/Approved/Rejected/Cancelled)
- **Email Notifications**: Receive updates on booking approvals/rejections

### For Event Organizers
- **Event Management**: Create, edit, and withdraw event requests
- **Venue Request System**: Request specific venues for approved events
- **Event Calendar**: Comprehensive calendar view of events
- **Multi-step Workflow**: Event approval → Venue request → Booking confirmation

### For Administrators
- **Centralized Dashboard**: Overview of all system activities
- **Approval Workflows**: 
  - Event request approvals
  - Booking request approvals
  - Venue request approvals
- **User Management**: Create, activate/deactivate user accounts
- **Venue Management**: Add, edit, and manage venue availability
- **Audit Logging**: Complete audit trail of all system actions
- **Schedule Calendar**: Combined view of all events and bookings

### Core Functionality
- **Real-time Availability Checking**: Prevents double-booking conflicts
- **Status Badge System**: Visual indicators (Pending/Approved/Rejected/Cancelled)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Role-based Access Control**: Secure access based on user roles
- **Modal-based Workflows**: Intuitive popup forms for create/edit/withdraw operations

---

## 🏗 System Architecture

### Frontend (React + Vite)
- **Framework**: React 19.2.0 with React Router for navigation
- **Build Tool**: Vite for fast development and optimized production builds
- **Calendar**: React Big Calendar for event/booking visualization
- **State Management**: React hooks (useState, useEffect)
- **Styling**: Custom CSS with component-based architecture

### Backend (Flask + PostgreSQL)
- **Framework**: Flask 3.0.0 with Blueprint architecture
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Flask-Migrate (Alembic) for database version control
- **API**: RESTful API with JSON responses
- **Authentication**: Session-based authentication with secure password hashing

### Database
- **Primary**: PostgreSQL (production)
- **Development**: SQLite (fallback for local development)
- **ORM**: SQLAlchemy 2.0.25

---

## 📦 Prerequisites

Before installation, ensure you have:

- **Python 3.8+** ([Download](https://www.python.org/downloads/))
- **Node.js 16+** and npm ([Download](https://nodejs.org/))
- **PostgreSQL 12+** ([Download](https://www.postgresql.org/download/)) *(optional for production)*
- **Git** ([Download](https://git-scm.com/downloads))

---

## 🚀 Quick Start

### Option 1: One-Click Setup (Windows)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Campus_Event_Scheduling_and_Space_Management_System
   ```

2. **Run setup** (first time only)
   ```bash
   setup.bat
   ```
   This will:
   - Create Python virtual environment
   - Install all backend dependencies
   - Install all frontend dependencies
   - Initialize the database

3. **Start the application**
   ```bash
   start.bat
   ```
   This will launch both frontend and backend servers automatically.

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

---

## 🛠 Manual Installation

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure environment** (optional)
   Create `.env` file in backend directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/campus_scheduler
   SECRET_KEY=your-secret-key-here
   FLASK_ENV=development
   ```

6. **Initialize database**
   ```bash
   flask db upgrade
   ```

7. **Run backend server**
   ```bash
   python run.py
   ```
   Backend will run on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd vite-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint** (if needed)
   Edit `vite.config.js` to update proxy settings

4. **Run development server**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

---

## 👥 User Roles & Permissions

### Student
- ✅ Create/Edit/Withdraw booking requests
- ✅ View personal bookings
- ✅ View booking calendar
- ❌ Cannot approve requests
- ❌ Cannot create events

### Event Organizer
- ✅ Create/Edit/Withdraw event requests
- ✅ Create/Edit/Withdraw venue requests (for approved events)
- ✅ View events and venue requests
- ✅ View event calendar
- ❌ Cannot approve own requests
- ❌ Cannot manage users

### Administrator
- ✅ Approve/Reject all requests (events, bookings, venues)
- ✅ Manage users (create, activate, deactivate)
- ✅ Manage venues and availability
- ✅ View audit logs
- ✅ Access combined schedule calendar
- ✅ Full system oversight

---

## 📁 Project Structure

```
Campus_Event_Scheduling_and_Space_Management_System/
│
├── backend/                          # Flask backend
│   ├── app/
│   │   ├── blueprints/              # Feature modules
│   │   │   ├── admin/               # User management
│   │   │   ├── audit/               # Audit logging
│   │   │   ├── auth/                # Authentication
│   │   │   ├── availability/        # Venue availability
│   │   │   ├── booking_request/     # Booking requests
│   │   │   ├── calendar/            # Calendar views
│   │   │   ├── event_request/       # Event requests
│   │   │   ├── notifications/       # Notifications
│   │   │   ├── venue_requests/      # Venue requests
│   │   │   └── venues/              # Venue management
│   │   ├── models/                  # Database models
│   │   │   ├── audit_log.py
│   │   │   ├── booking_request.py
│   │   │   ├── event_request.py
│   │   │   ├── notification.py
│   │   │   ├── user.py
│   │   │   ├── venue.py
│   │   │   ├── venue_availability.py
│   │   │   └── venue_request.py
│   │   ├── __init__.py              # App factory
│   │   ├── config.py                # Configuration
│   │   └── extensions.py            # Flask extensions
│   ├── migrations/                  # Database migrations
│   ├── instance/                    # Instance-specific files
│   ├── requirements.txt             # Python dependencies
│   └── run.py                       # Application entry point
│
├── vite-project/                    # React frontend
│   ├── src/
│   │   ├── component/               # React components
│   │   │   ├── AddBookingForm.jsx
│   │   │   ├── AddEventForm.jsx
│   │   │   ├── Approval.jsx
│   │   │   ├── AuditLog.jsx
│   │   │   ├── BookingCalendar.jsx
│   │   │   ├── Bookings.jsx
│   │   │   ├── DashboardContent.jsx
│   │   │   ├── EditBooking.jsx
│   │   │   ├── EditEvent.jsx
│   │   │   ├── EventCalendar.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── login.jsx
│   │   │   ├── register.jsx
│   │   │   ├── ScheduleCalendar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   ├── Venue.jsx
│   │   │   ├── VenueAvailability.jsx
│   │   │   ├── VenueRequestCreate.jsx
│   │   │   ├── VenueRequestEdit.jsx
│   │   │   ├── VenueRequestManage.jsx
│   │   │   ├── VenueRequestWithdraw.jsx
│   │   │   ├── WithdrawBooking.jsx
│   │   │   └── WithdrawEvent.jsx
│   │   ├── App.jsx                  # Main app component
│   │   ├── App.css                  # Global styles
│   │   ├── main.jsx                 # React entry point
│   │   └── Multimedia_University_logo_2020.png
│   ├── public/                      # Static assets
│   ├── package.json                 # Node dependencies
│   └── vite.config.js              # Vite configuration
│
├── requirements.txt                 # Root Python dependencies
├── setup.bat                        # Windows setup script
├── start.bat                        # Windows startup script
└── README.md                        # This file
```

---

## 🗄 Database Schema

### Core Tables

**Users**
- user_id (PK)
- email (unique)
- password_hash
- name
- user_role (Admin/Event Organizer/Student)
- phone_number
- is_active
- created_at

**Venues**
- venue_id (PK)
- venue_name
- location
- capacity
- venue_type (Lecture Hall/Lab/Auditorium/etc.)
- created_at

**Events**
- event_id (PK)
- organizer_id (FK → Users)
- event_name
- event_date
- start_time
- end_time
- purpose
- status (Pending/Approved/Rejected/Cancelled)
- created_at

**Venue Requests**
- venue_request_id (PK)
- event_id (FK → Events)
- organiser_id (FK → Users)
- venue_available_id (FK → Venue Availability)
- resources_needed
- status (Pending/Approved/Rejected/Cancelled)
- created_at

**Booking Requests**
- booking_id (PK)
- user_id (FK → Users)
- venue_available_id (FK → Venue Availability)
- booking_date
- status (Pending/Approved/Rejected/Cancelled)
- created_at

**Venue Availability**
- venue_available_id (PK)
- venue_id (FK → Venues)
- date
- start_time
- end_time
- status (Available/On-Hold/Unavailable/Maintenance)

**Audit Logs**
- audit_id (PK)
- user_id (FK → Users)
- action_type (Create/Update/Delete/Approve/Reject)
- entity_type (Event/Booking/Venue/User)
- entity_id
- old_value (JSON)
- new_value (JSON)
- timestamp

---

## 🔌 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/logout` - User logout

### Events
- `GET /api/event-requests` - List events
- `POST /api/event-requests` - Create event
- `GET /api/event-requests/<id>` - Get event details
- `PATCH /api/event-requests/<id>` - Update event
- `PATCH /api/event-requests/<id>/withdraw` - Withdraw event
- `PATCH /api/event-requests/<id>/approve` - Approve event (Admin)
- `PATCH /api/event-requests/<id>/reject` - Reject event (Admin)

### Bookings
- `GET /api/booking-requests` - List bookings
- `POST /api/booking-requests` - Create booking
- `GET /api/booking-requests/<id>` - Get booking details
- `PATCH /api/booking-requests/<id>` - Update booking
- `PATCH /api/booking-requests/<id>/withdraw` - Withdraw booking
- `PATCH /api/booking-requests/<id>/approve` - Approve booking (Admin)
- `PATCH /api/booking-requests/<id>/reject` - Reject booking (Admin)

### Venue Requests
- `GET /api/venue-requests` - List venue requests
- `POST /api/venue-requests` - Create venue request
- `GET /api/venue-requests/<id>` - Get venue request details
- `PATCH /api/venue-requests/<id>` - Update venue request
- `PATCH /api/venue-requests/<id>/withdraw` - Withdraw venue request
- `PATCH /api/venue-requests/<id>/approve` - Approve venue request (Admin)
- `PATCH /api/venue-requests/<id>/reject` - Reject venue request (Admin)

### Venues
- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue (Admin)
- `GET /api/venues/<id>` - Get venue details
- `PATCH /api/venues/<id>` - Update venue (Admin)

### Availability
- `GET /api/availability` - List venue availability
- `POST /api/availability/check` - Check if venue is available

### Users (Admin)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PATCH /api/admin/users/<id>` - Update user
- `PATCH /api/admin/users/<id>/activate` - Activate user
- `PATCH /api/admin/users/<id>/deactivate` - Deactivate user

### Audit
- `GET /api/audit` - Get audit logs (Admin)

---

## 💻 Technologies Used

### Frontend
- **React** 19.2.0 - UI framework
- **React Router DOM** 7.12.0 - Client-side routing
- **React Big Calendar** 1.19.4 - Calendar component
- **Vite** 7.2.4 - Build tool and dev server
- **date-fns** 4.1.0 - Date manipulation

### Backend
- **Flask** 3.0.0 - Python web framework
- **SQLAlchemy** 2.0.25 - ORM
- **Flask-SQLAlchemy** 3.1.1 - Flask integration
- **Flask-Migrate** 4.0.5 - Database migrations
- **Flask-CORS** 4.0.0 - Cross-origin resource sharing
- **PostgreSQL** - Production database
- **Werkzeug** 3.0.1 - Security utilities

### Development Tools
- **ESLint** - JavaScript linting
- **Python dotenv** - Environment variable management

---

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
# Windows: services.msc → PostgreSQL service
# Update DATABASE_URL in backend/.env
```

### Port Already in Use
```bash
# Backend (Port 5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (Port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Virtual Environment Issues
```bash
# Remove and recreate venv
rmdir /s venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Migration Errors
```bash
cd backend
flask db stamp head
flask db migrate -m "Reset migrations"
flask db upgrade
```

### Frontend Build Issues
```bash
cd vite-project
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is developed as part of CSE6214 Software Engineering Fundamentals coursework at Multimedia University.

---

## 📞 Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Contact the system administrator
- Review audit logs for error tracking

---

**Developed by**: MMU Students  
**Course**: CSE6214 Software Engineering Fundamentals  
**Year**: 2025/2026