import json, os

from flask import request, abort
from functools import wraps
from jose import jwt
from urllib.request import urlopen
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv()

AUTH0_APP_DOMAIN = os.getenv('AUTH0_APP_DOMAIN')
ALGORITHMS = os.getenv('ALGORITHMS')
AUTH0_API_AUDIENCE = os.getenv('AUTH0_API_AUDIENCE')
AUTH0_APP_CLIENT_ID = os.getenv('AUTH0_APP_CLIENT_ID')
CALLBACK_URL = os.getenv('CALLBACK_URL')

# Handle Auth Error
class AuthError(Exception):
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code
        super().__init__(f"{error['description']} (code: {status_code})")

class AuthService:
    def __init__(self):
        pass

    # Base functions
    def build_login_link(self, next_url=''):
        base_url = f"https://{AUTH0_APP_DOMAIN}/authorize"
        params = {
            'audience': AUTH0_API_AUDIENCE,
            'response_type': 'token',
            'client_id': AUTH0_APP_CLIENT_ID,
            'redirect_uri': CALLBACK_URL,
            "state": next_url
        }
        return f"{base_url}?{urlencode(params)}"

    def check_token_is_existing(self):
        try:
            token = self.get_token_auth_header()
            self.verify_decode_jwt(token)
            print(token)
            return True
        except AuthError:
            return False

    def login(self, next_url=''):
        if self.check_token_is_existing():
            return {'success': True, 'message': 'Already logged in'}
        else:
            login_url = self.build_login_link(next_url=next_url)
            return {'success': True, 'login_url': login_url}

    # JWT Part:
    def get_token_auth_header(self):
        auth = request.headers.get('Authorization', None)

        if not auth:
            raise AuthError({
                'code': 'authorization_header_missing',
                'description': 'Authorization header is expected.'
            }, 401)

        parts = auth.split()
        if parts[0].lower() != 'bearer':
            raise AuthError({
                'code': 'invalid_header',
                'description': 'Authorization header must start with "Bearer".'
            }, 401)

        elif len(parts) == 1:
            raise AuthError({
                'code': 'invalid_header',
                'description': 'Token not found.'
            }, 401)

        elif len(parts) > 2:
            raise AuthError({
                'code': 'invalid_header',
                'description': 'Authorization header must be bearer token.'
            }, 401)

        token = parts[1]
        return token

    def verify_decode_jwt(self, token):
        jsonurl = urlopen(f'https://{AUTH0_APP_DOMAIN}/.well-known/jwks.json')
        jwks = json.loads(jsonurl.read())
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        if 'kid' not in unverified_header:
            raise AuthError({
                'code': 'invalid_header',
                'description': 'Authorization malformed.'
            }, 401)

        for key in jwks['keys']:
            if key['kid'] == unverified_header['kid']:
                rsa_key = {
                    'kty': key['kty'],
                    'kid': key['kid'],
                    'use': key['use'],
                    'n': key['n'],
                    'e': key['e']
                }
        if rsa_key:
            try:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=ALGORITHMS,
                    audience=AUTH0_API_AUDIENCE,
                    issuer='https://' + AUTH0_APP_DOMAIN + '/'
                )

                return payload

            except jwt.ExpiredSignatureError:
                raise AuthError({
                    'code': 'token_expired',
                    'description': 'Token expired.'
                }, 401)

            except jwt.JWTClaimsError:
                raise AuthError({
                    'code': 'invalid_claims',
                    'description': 'Incorrect claims. Please, check the audience and issuer.'
                }, 401)
            except Exception:
                raise AuthError({
                    'code': 'invalid_header',
                    'description': 'Unable to parse authentication token.'
                }, 400)
        raise AuthError({
            'code': 'invalid_header',
            'description': 'Unable to find the appropriate key.'
        }, 403)

    def check_permissions(self, permission, payload):
        if 'permissions' not in payload:
            raise AuthError({
                'code': 'invalid_claims',
                'description': 'Permissions not included in JWT.'
            }, 403)

        if permission not in payload['permissions']:
            raise AuthError({
                'code': 'unauthorized',
                'description': 'Permission not found.'
            }, 403)

        return True
    
def requires_auth(permission=''):
    def requires_auth_decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_service = AuthService()
            token = auth_service.get_token_auth_header()
            payload = auth_service.verify_decode_jwt(token)
            
            if permission:
                auth_service.check_permissions(permission, payload)
                
            return f(payload, *args, **kwargs)
        return wrapper
    return requires_auth_decorator