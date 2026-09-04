# Imports
import os # used to read system environment variables (useful for cloud deployments)
from flask import Flask # core Flask class from the flask library. This class is the blueprint used to create your entire web application.
from flask_sqlalchemy import SQLAlchemy # database tool. this is what you will eventually use to connect to your MySQL database.
from flask import render_template # used to generate HTML pages
from flask import redirect # used to redirect the user to a different route/page
from flask import request # used to access incoming request data such as form inputs and query parameters
from flask import url_for # generates URLs for routes dynamically based on function names
from flask import flash # sends temporary notification/alert messages to the frontend
from flask import jsonify # sends JSON responses for smooth background/AJAX requests

from datetime import datetime, timezone, date # specific tools to format and manipulate dates and times in Python.

# My App
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "flask_task_app_secret_key") # secret key required to securely handle sessions and flash messages

# Configure the App (visit flask-sqlalchemy for setup)
# Uses DATABASE_URL environment variable if deployed to cloud, otherwise defaults to local MySQL
database_url = os.environ.get("DATABASE_URL", 'mysql+pymysql://root:Password@localhost/my_flask_db')
if database_url.startswith("postgres://"): # fixes compatibility for PostgreSQL cloud providers
    database_url = database_url.replace("postgres://", "postgresql://", 1)
elif database_url.startswith("mysql://") and not database_url.startswith("mysql+pymysql://"): # ensures PyMySQL driver is used
    database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False # Disables overhead tracking modifications

db = SQLAlchemy(app) # Create the database itself

# Creating a Model / Blueprint for a database table
class Task(db.Model): # Row of Data
    id = db.Column(db.Integer, primary_key=True) # Columns
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    priority = db.Column(db.String(20), default="Medium")
    status = db.Column(db.String(20), default="Pending") # 'Pending' or 'Completed'
    created = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"Task {self.id}"

    # Helper method to serialize task data into a Python dictionary (useful for JSON/AJAX)
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "due_date": self.due_date.strftime("%Y-%m-%d") if self.due_date else None,
            "due_date_formatted": self.due_date.strftime("%b %d") if self.due_date else None,
            "priority": self.priority,
            "status": self.status,
            "created": self.created.strftime("%Y-%m-%d %H:%M") if self.created else None
        }

# Inject today's date into all templates for accurate due date calculations
@app.context_processor
def inject_today():
    return {"today_date": date.today()}

# Routes to Webpage

# / homepage - See all current tasks (with filter support)
@app.route("/")
def index():
    # Filter tasks based on URL query parameter (e.g. /?filter=active or /?filter=completed)
    filter_type = request.args.get('filter', 'all')
    
    query = Task.query
    if filter_type == 'active':
        query = query.filter_by(status='Pending')
    elif filter_type == 'completed':
        query = query.filter_by(status='Completed')
    
    tasks = query.order_by(Task.created.desc()).all()

    # Calculate global task counts for the header statistics
    total_count = Task.query.count()
    completed_count = Task.query.filter_by(status='Completed').count()
    pending_count = total_count - completed_count

    return render_template(
        "index.html",
        tasks=tasks,
        current_filter=filter_type,
        total_count=total_count,
        completed_count=completed_count,
        pending_count=pending_count
    )

# Add Task / New Task Object (Handles both Quick Add on homepage and full form on add_task.html)
@app.route("/add", methods=['GET', 'POST'])
def add_task():
    if request.method == 'POST':
        # Retrieve form data sent by the user (supports both form data and JSON data)
        data = request.get_json(silent=True) if request.is_json else request.form
        title = data.get('title') if data else None

        if not title or not title.strip():
            if request.is_json:
                return jsonify({"success": False, "error": "Task title is required!"}), 400
            flash("Task title is required!", "error")
            return redirect(request.referrer or url_for('index'))

        description = (data.get('description') or '').strip()
        category = (data.get('category') or '').strip()
        priority = data.get('priority') or 'Medium'
        
        # Parse due date if provided
        due_date_str = data.get('due_date')
        due_date = None
        if due_date_str:
            try:
                due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except ValueError:
                due_date = None

        # Create new Task instance
        new_task = Task(
            title=title.strip(),
            description=description if description else None,
            category=category if category else None,
            due_date=due_date,
            priority=priority,
            status='Pending'
        )

        try:
            # Add and commit to database
            db.session.add(new_task)
            db.session.commit()

            if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                total_count = Task.query.count()
                completed_count = Task.query.filter_by(status='Completed').count()
                return jsonify({
                    "success": True,
                    "task": new_task.to_dict(),
                    "stats": {
                        "total": total_count,
                        "completed": completed_count,
                        "pending": total_count - completed_count
                    }
                })

            flash("Task added successfully!", "success")
        except Exception as e:
            db.session.rollback()
            if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({"success": False, "error": str(e)}), 500
            flash(f"Error adding task: {e}", "error")
            
        return redirect(url_for('index'))

    # If GET request, render the standalone add task page
    return render_template("add_task.html")

# Toggle Task Status (Pending <-> Completed)
@app.route("/toggle/<int:task_id>", methods=['POST'])
def toggle_task(task_id):
    task = db.get_or_404(Task, task_id)
    task.status = 'Completed' if task.status == 'Pending' else 'Pending'
    try:
        db.session.commit()

        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            total_count = Task.query.count()
            completed_count = Task.query.filter_by(status='Completed').count()
            return jsonify({
                "success": True,
                "task": task.to_dict(),
                "stats": {
                    "total": total_count,
                    "completed": completed_count,
                    "pending": total_count - completed_count
                }
            })

    except Exception as e:
        db.session.rollback()
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({"success": False, "error": str(e)}), 500
        flash(f"Error updating task status: {e}", "error")

    return redirect(request.referrer or url_for('index'))

# Edit Task (Load edit form and save updated task data)
@app.route("/edit/<int:task_id>", methods=['GET', 'POST'])
def edit_task(task_id):
    task = db.get_or_404(Task, task_id)

    if request.method == 'POST':
        title = request.form.get('title')
        if not title or not title.strip():
            flash("Task title is required!", "error")
            return render_template("edit_task.html", task=task)

        task.title = title.strip()
        task.description = request.form.get('description', '').strip() or None
        task.category = request.form.get('category', '').strip() or None
        task.priority = request.form.get('priority', task.priority)
        task.status = request.form.get('status', task.status)
        
        due_date_str = request.form.get('due_date')
        if due_date_str:
            try:
                task.due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            except ValueError:
                task.due_date = None
        else:
            task.due_date = None

        try:
            db.session.commit()
            flash("Task updated successfully!", "success")
            return redirect(url_for('index'))
        except Exception as e:
            db.session.rollback()
            flash(f"Error updating task: {e}", "error")

    return render_template("edit_task.html", task=task)

# Delete Task from database
@app.route("/delete/<int:task_id>", methods=['POST'])
def delete_task(task_id):
    task = db.get_or_404(Task, task_id)
    try:
        db.session.delete(task)
        db.session.commit()

        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            total_count = Task.query.count()
            completed_count = Task.query.filter_by(status='Completed').count()
            return jsonify({
                "success": True,
                "deleted_id": task_id,
                "stats": {
                    "total": total_count,
                    "completed": completed_count,
                    "pending": total_count - completed_count
                }
            })

        flash("Task deleted successfully!", "success")
    except Exception as e:
        db.session.rollback()
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({"success": False, "error": str(e)}), 500
        flash(f"Error deleting task: {e}", "error")

    return redirect(request.referrer or url_for('index'))

# Auto-create database tables on startup
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        print(f"Database setup notice: {e}")

# Runner & Debugger
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)