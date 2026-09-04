import sys
import os

# Ensure the root directory is on Python's search path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app

# Vercel serverless WSGI entry point
app = app
handler = app
