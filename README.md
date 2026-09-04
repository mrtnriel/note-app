# 📋 Flask Task Manager

A clean, modern, and responsive full-stack task management web application built with **Python (Flask)**, **SQLAlchemy**, and **MySQL / TiDB Cloud**, featuring progressive enhancement, auto-expanding UI, smart date tracking, and seamless deployment on **Vercel**.

---

## ✨ Features

- **⚡ Instant Micro-Interactions**: Optimistic UI updates for checkmark toggles and deletions with zero full-page flickering.
- **📂 Unified Auto-Expanding Creation**: Click into the input to automatically expand fields for description, category, due date presets, and priority.
- **📅 Smart Date Tracking**:
  - Dynamic urgency badges (**Overdue**, **Today**, **Tomorrow**).
  - One-click date presets (*Today*, *Tomorrow*, *Next Week*, *Clear*).
- **🔍 Filter-Aware Views**: Filter by **All**, **Active**, and **Completed** with context-aware empty states and real-time pending/done statistics.
- **🎨 Modern Dark & Light Mode**: Clean, minimalist UI design that automatically adapts to the user's system preferences.
- **⌨️ Keyboard Shortcuts**:
  - Press `/` or `N` to jump straight to task creation.
  - Press `Esc` to collapse the drawer.
- **🔔 Auto-Dismissing Alerts**: Toast notifications with smooth exit animations and manual dismiss controls.
- **🌐 Serverless & Cloud Ready**: Fully configured for instant deployment on **Vercel** with **TiDB Cloud (Serverless MySQL)**.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, Flask 3.x, Flask-SQLAlchemy 3.x, SQLAlchemy 2.0
- **Database**: MySQL / TiDB Cloud (Serverless MySQL) / PostgreSQL / SQLite
- **Database Driver**: PyMySQL & Cryptography
- **Frontend**: HTML5, Jinja2 Templates, Vanilla CSS3 (CSS Variables), Vanilla JavaScript (Fetch API)
- **Deployment**: Vercel (`@vercel/python`), Gunicorn

---

## 📁 Project Structure

```text
Flask Practice/
├── static/
│   ├── app.js            # Client-side progressive enhancement & UI interactions
│   └── style.css         # Minimalist responsive styling (dark & light themes)
├── templates/
│   ├── base.html         # Base layout with toast notifications & meta tags
│   ├── index.html        # Main dashboard with auto-expanding form & filters
│   ├── add_task.html     # Dedicated add task page
│   └── edit_task.html    # Dedicated task edit page with date presets
├── app.py                # Flask application routes, database model & configuration
├── vercel.json           # Vercel serverless routing configuration
├── requirements.txt      # Production Python dependencies
├── .gitignore            # Git exclusion rules
└── README.md             # Project documentation
```

---

## 🚀 Getting Started Locally

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd "Flask Practice"
```

### 2. Create and Activate a Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  python -m venv env
  .\env\Scripts\activate
  ```
- **macOS / Linux**:
  ```bash
  python3 -m venv env
  source env/bin/activate
  ```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Database
By default, the app connects to a local MySQL instance or TiDB Cloud via the `DATABASE_URL` environment variable.

- **Option A (Local MySQL)**: Ensure your local MySQL server is running and create the database:
  ```sql
  CREATE DATABASE my_flask_db;
  ```
- **Option B (SQLite for Quick Testing)**: Set `DATABASE_URL=sqlite:///tasks.db` in your environment.

### 5. Run the Application
```bash
python app.py
```
Open your browser and navigate to: **`http://127.0.0.1:5000`**

---

## 🌐 Deploying to Vercel

This repository includes a pre-configured `vercel.json` file for single-click serverless deployment on **Vercel**.

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project in Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New Project**.
   - Select your GitHub repository.

3. **Set Environment Variables**:
   Under **Settings** → **Environment Variables**, add:
   - `DATABASE_URL`: `mysql+pymysql://<USER>:<PASSWORD>@<HOST>:4000/<DB_NAME>?ssl_verify_cert=true&ssl_verify_identity=true`
   - `SECRET_KEY`: *[Any random secret string]*

4. **Deploy**:
   - Click **Deploy**. Vercel will build the serverless functions and host your app with global CDN caching for static files.

---

## 📡 API & Route Overview

| Route | Method | Description |
| :--- | :--- | :--- |
| `/` | `GET` | Main task dashboard with filter support (`?filter=all\|active\|completed`) |
| `/add` | `GET`, `POST` | Create a new task (supports both standard form submissions & JSON requests) |
| `/toggle/<id>` | `POST` | Toggles task status between `Pending` and `Completed` |
| `/edit/<id>` | `GET`, `POST` | Edit existing task details and due date |
| `/delete/<id>` | `POST` | Remove task from the database |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
