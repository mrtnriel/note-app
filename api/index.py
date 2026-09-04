import sys
import os

# Add root directory to sys.path so 'app' and other modules can be imported
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from app import app

# WSGI Middleware to fix Vercel rewrite PATH_INFO
class VercelPathFix:
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')
        # If Vercel rewrites to /api/index, strip the prefix so Flask gets the intended route
        if path.startswith('/api/index'):
            environ['PATH_INFO'] = path[len('/api/index'):] or '/'
        elif path.startswith('/api'):
            environ['PATH_INFO'] = path[len('/api'):] or '/'
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathFix(app.wsgi_app)

# Expose WSGI application for Vercel
handler = app
