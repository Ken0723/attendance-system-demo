from flask import Blueprint, jsonify
from ..services import AuthError
from jose.exceptions import JWTError

errors = Blueprint('errors', __name__)

# Errors blue print

# 400
@errors.app_errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 400,
        'message': 'Bad request'
    }), 400

# 404
@errors.app_errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 404,
        'message': 'Resource not found'
    }), 404

# 422
@errors.app_errorhandler(422)
def unprocessable(error):
    return jsonify({
        'success': False,
        'error': 422,
        'message': 'Unprocessable'
    }), 422

# 500
@errors.app_errorhandler(500)
def server_error(error):
    return jsonify({
        'success': False,
        'error': 500,
        'message': 'Internal server error'
    }), 500

@errors.app_errorhandler(AuthError)
def handle_auth_error(ex):
    response = jsonify(ex.error)
    response.status_code = ex.status_code
    return response

@errors.app_errorhandler(JWTError)
def handle_jwt_error(ex):
    response = jsonify({
        'code': 'invalid_token',
        'description': f'JWT Error: {str(ex)}'
    })
    response.status_code = 401
    return response