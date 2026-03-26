# Product Marketing App

A modern, full-stack application for personal product marketing. It includes an Admin panel for managing products and a User-facing interface to browse products. 

## Project Structure
```text
marketing/
├── backend/    # FastAPI Python Backend + Static HTML/CSS/JS Frontend
└── README.md   # This documentation
```

## 1. Database Setup

We use MySQL for this app. Ensure you have MySQL Server installed and running.

1. Open your MySQL client (like MySQL Workbench, phpMyAdmin, or terminal).
2. Create a new database:
   ```sql
   CREATE DATABASE marketing_app_db;
   ```
3. Update the `MYSQL_URL` in `backend/.env` with your actual MySQL password.

> Note: The FastAPI backend will automatically create the `products` and `admin_users` tables when it starts.

---

## 2. Backend & Frontend Setup (Python + FastAPI)

The entire application (both the API and the beautiful web interface) is served by our Python backend!

### Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```

### Running the App
Start the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- **User View**: View the beautiful product catalog at [http://localhost:8000](http://localhost:8000)
- **Admin Panel**: Manage your products at [http://localhost:8000/admin](http://localhost:8000/admin)

> **Creating an Initial Admin User**:
> Before you can log in, you need an admin account. Open a new terminal and run:
> ```bash
> curl -X POST "http://localhost:8000/admin/create" -H "Content-Type: application/json" -d "{\"email\":\"admin@example.com\", \"password\":\"admin123\"}"
> ```
> Now you can log in to the Admin Panel using `admin@example.com` and `admin123`.

---
