import json

from flask import Flask, request, jsonify, abort
from flask_cors import CORS
from sqlalchemy import exc
from werkzeug.exceptions import HTTPException
from app.models import init_db
from app.routes.api_routes import api
from app.errors.handlers import errors
from app.commands import *

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__)

    if test_config is None:
        init_db(app)
    else:
        database_path = test_config.get('SQLALCHEMY_DATABASE_URI')
        init_db(app, database_path=database_path)

    CORS(app, resources={r"/*": {"origins": "*"}})

    # Allowed request's method config
    @app.after_request
    def after_request(response):
        response.headers.add(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization')
        response.headers.add(
            'Access-Control-Allow-Methods',
            'GET, POST, PATCH, DELETE')
        return response
    
    # Blue print register
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(errors)

    # Commands Register
    register_commands(app)

    return app


APP = create_app()

if __name__ == '__main__':
    APP.run(host='0.0.0.0', port=8080)
