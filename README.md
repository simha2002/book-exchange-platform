# 📚 BookXchange — Book Exchange Platform

A college book exchange platform for TRI College of Arts & Science.
Students can exchange Pass Papers and Notes between IT, English, and Accounts departments.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Laravel 12 (PHP) |
| Database | MySQL |
| Auth | Laravel Sanctum (Token) |
| Mail | Gmail SMTP |

## Setup Instructions

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL (XAMPP)

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api

### Admin Credentials
- Email: admin@gmail.com
- Password: admin123

## Features
- Email OTP verification on register
- Department-wise book browsing (IT / English / Accounts)
- Book exchange request system
- In-app chat after exchange accepted
- Meeting place & time proposal
- Star ratings & reviews
- Admin dashboard with full management
