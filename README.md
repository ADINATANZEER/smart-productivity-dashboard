# 🚀 Smart Productivity & Reminder Dashboard

A lightweight and modern web application for managing daily tasks, tracking deadlines, and monitoring personal productivity.

The Smart Productivity & Reminder Dashboard provides a simple interface for creating and managing tasks while using Firebase Authentication and Cloud Firestore for user authentication and cloud data storage.

---

## ✨ Features

### 🔐 Authentication

- User registration
- User login
- User logout
- Firebase Authentication
- Authenticated user sessions

### 📝 Task Management

Users can:

- Create tasks
- Edit tasks
- Delete tasks
- Mark tasks as completed
- View pending tasks
- Filter tasks by status

### 🎯 Priority Management

Each task can have one of three priority levels:

- 🔴 High
- 🟡 Medium
- 🟢 Low

### 📅 Deadline Management

Every task can have a deadline containing:

- Date
- Time

Tasks can automatically be identified as overdue when their deadline has passed.

### 📊 Productivity Statistics

The dashboard displays:

- Total Tasks
- Completed Tasks
- Pending Tasks
- Overdue Tasks

These statistics update as tasks are created or completed.

### ⏰ Reminder System

The application can monitor task deadlines and provide on-screen reminders for tasks that are approaching their deadlines or have become overdue.

### 🎨 Responsive Dashboard

The application includes:

- Modern dark-themed interface
- Sidebar navigation
- Dashboard statistics
- Task cards
- Add/Edit task modal
- Responsive mobile layout

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling and responsive design |
| JavaScript ES6+ | Application logic |
| Firebase Authentication | User authentication |
| Cloud Firestore | Cloud task storage |
| Live Server | Local development |

---

## 📂 Project Structure

```text
smart-productivity-dashboard/
│
├── index.html
├── login.html
├── style.css
├── app.js
├── firebase-config.js
└── README.md
