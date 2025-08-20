import logging, os, requests

from flask import Blueprint, request, redirect, jsonify
from ..models import Users, AttendanceRecords, Events, db
from ..services import *
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta


from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv('FRONTEND_URL')

api = Blueprint('api', __name__)

# API routes blue print

###########################
## -- Account Related -- ##
## --    Login-Auth   -- ##
###########################
@api.route('/check-auth')
@requires_auth()
def check_auth(payload):
    try:
        return {'success': True, 'message': 'Authenticated'}
    except AuthError as auth_e:
        return jsonify({'success': False, 'message': auth_e.error.get('description', 'Authorization error')}), auth_e.status_code
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': 'Internal server error', 'error': str(e)}), 500

# Request login, check is it existing valid jwt token, if not redirect to auth0
@api.route('/request-login')
def request_login():
    try:    
        next_url = request.args.get('nextUrl', '')
        
        auth_service = AuthService()

        try:
            token = auth_service.get_token_auth_header()
            payload = auth_service.verify_decode_jwt(token)
            auth0_id = payload.get('sub')
            
            if auth0_id:
                user = Users.query.filter_by(auth0_id=auth0_id).first()
                
                if user:
                    print(f"User found: {user.username}")
                    return {'success': True, 'message': 'Already logged in', 'user_id': user.id}
                else:
                    print(f"No user found with auth0_id: {auth0_id}")
            return {'success': True, 'message': 'Already logged in'}
            
        except AuthError:
            login_url = auth_service.build_login_link(next_url=next_url)
            return {'success': True, 'login_url': login_url}
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': 'Internal server error', 'error': str(e)}), 500
    finally:
        db.session.close()

# Handle the login callback, redirect to the next page
@api.route('/login-callback')
def login_callback():
    try:
        state = request.args.get('state', '')
        frontend_callback_url = f"{FRONTEND_URL}/auth/callback?state={state}"

        return redirect(frontend_callback_url)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': 'Internal server error', 'error': str(e)}), 500
    

# Get Individual User-Info
@api.route('/user-info')
@requires_auth()
def get_user_info(payload):
    try:
        auth0_id = payload.get('sub')
        
        user = None
        auth0_user_data = {}
        
        if auth0_id:
            user = Users.query.filter_by(auth0_id=auth0_id).first()

            domain = os.getenv('AUTH0_APP_DOMAIN')
            client_id = os.getenv('AUTH0_M2M_CLIENT_ID')
            client_secret = os.getenv('AUTH0_M2M_CLIENT_SECRET')
            
            token_url = f"https://{domain}/oauth/token"
            token_payload = {
                "client_id": client_id,
                "client_secret": client_secret,
                "audience": f"https://{domain}/api/v2/",
                "grant_type": "client_credentials",
                "scope": "read:users"
            }
            
            token_response = requests.post(token_url, json=token_payload)
            token_data = token_response.json()
            
            if 'access_token' in token_data:
                mgmt_api_token = token_data['access_token']
                
                headers = {
                    'Authorization': f'Bearer {mgmt_api_token}',
                    'Content-Type': 'application/json'
                }

                encoded_user_id = requests.utils.quote(auth0_id)
                user_url = f"https://{domain}/api/v2/users/{encoded_user_id}"
                
                user_response = requests.get(user_url, headers=headers)
                
                if user_response.status_code == 200:
                    auth0_user_data = user_response.json()
                else:
                    logging.error(f"Failed to get user from Auth0: {user_response.status_code} - {user_response.text}")
            else:
                logging.error(f"Failed to get management API token: {token_data}")
            
            if not user and auth0_id:
                try:
                    email = auth0_user_data.get('email') or payload.get('email')
                    name = auth0_user_data.get('name') or payload.get('name', '')
                    nickname = auth0_user_data.get('nickname') or payload.get('nickname', '')
                    
                    if not email and nickname:
                        email = f"{nickname}@example.com"
                    elif not email and auth0_id:
                        email = f"{auth0_id.replace('|', '_')}@example.com"
                    
                    username = nickname or (name.split()[0] if name else '') or (email.split('@')[0] if email else 'user')
                    
                    new_user = Users(
                        auth0_id=auth0_id,
                        email=email,
                        username=username,
                        position='',
                        department=''
                    )
                    
                    db.session.add(new_user)
                    db.session.commit()
                    
                    user = Users.query.filter_by(auth0_id=auth0_id).first()
                    
                    print(f"Created new user: {user.username} with auth0_id: {auth0_id}")
                except Exception as user_create_error:
                    print(f"Error creating new user: {user_create_error}")
                    logging.error(f"Error creating new user: {user_create_error}")
                    db.session.rollback()
        
        if user:
            user_data = {
                **payload,
                **auth0_user_data,
                'db_info': user.format()
            }
            
            if not user_data.get('email') and user.email:
                user_data['email'] = user.email
            
            return {'success': True, 'user_info': user_data}
        else:
            return {'success': True, 'user_info': {**payload, **auth0_user_data}}
    
    except Exception as e:
        print(f"Error: {e}")
        logging.error(f"Error in get_user_info: {e}")
        return jsonify({'success': False, 'message': 'Internal server error', 'error': str(e)}), 500
    finally:
        db.session.close()

@api.route('/user-info', methods=['POST'])
@requires_auth('post:user-info')
def update_user_info(payload):
    try:
        request_data = request.get_json()

        if 'user_id' not in request_data:
            return jsonify({
                'success': False,
                'message': f'Invalid date format: {str(e)}'
            }), 400

        user_id = request_data['user_id']

        logging.info(f'user_id: {user_id}')

        user = Users.query.filter_by(id = user_id).first()

        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        if 'department' in request_data:
            user.department = request_data['department']
        
        if 'position' in request_data:
            user.position = request_data['position']
    
        logging.info(f'user: {user}')

        user.update()
        
        return jsonify({
            'success': True,
            'id': user.id,
            'updated': True
        }), 200
    except Exception as e:
        print(f"Error: {e}")
        logging.error(f"Error in update_user_info: {e}")
        return jsonify({'success': False, 'message': 'Internal server error', 'error': str(e)}), 500
    finally:
        db.session.close()

@api.route('/users')
@requires_auth('get:users')
def get_users(payload):
    try:
        users = Users.query.filter(Users.is_active == True).order_by(Users.username).all()
        
        formatted_users = [user.format() for user in users]
        
        return jsonify(formatted_users), 200
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch users', 'error': str(e)}), 500
    finally:
        db.session.close()

#######################
##### -- Auth0 -- #####
#######################
@api.route('/auth0-user')
@requires_auth('read:auth0-users')
def get_auth0_user(payload):
    try:
        domain = os.getenv('AUTH0_APP_DOMAIN')
        app_client_id = os.getenv('AUTH0_APP_CLIENT_ID')
        client_id = os.getenv('AUTH0_M2M_CLIENT_ID')
        client_secret = os.getenv('AUTH0_M2M_CLIENT_SECRET')

        token_url = f"https://{domain}/oauth/token"
        token_payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "audience": f"https://{domain}/api/v2/",
            "grant_type": "client_credentials",
            "scope": "read:users update:users read:roles"
        }

        token_response = requests.post(token_url, json=token_payload)
        token_data = token_response.json()

        mgmt_api_token = token_data['access_token']

        headers = {
            'Authorization': f'Bearer {mgmt_api_token}',
            'Content-Type': 'application/json'
        }

        users_url = f"https://{domain}/api/v2/users"
        users_response = requests.get(users_url, headers=headers)
        auth0_users = users_response.json()

        formatted_users = []
        
        for index, user in enumerate(auth0_users):
            auth0_id = user.get('user_id')
            
            roles_url = f"https://{domain}/api/v2/users/{auth0_id}/roles"
            roles_response = requests.get(roles_url, headers=headers)
            
            roles = []
            if roles_response.status_code == 200:
                roles = roles_response.json()
            else:
                logging.error(f"Error fetching roles for user {auth0_id}: {roles_response.text}")

            db_user = Users.query.filter_by(auth0_id = auth0_id).first()

            # logging.error(f"roles data: {roles}")
            formatted_user = {
                'id': index,
                'auth0_id': auth0_id,
                'db_user_id': db_user.id,
                'email': user.get('email'),
                'name': user.get('name'),
                'nickname': user.get('nickname'),
                'picture': user.get('picture'),
                'created_at': user.get('created_at'),
                'last_login': user.get('last_login'),
                'logins_count': user.get('logins_count'),
                'department': db_user.department,
                'position': db_user.position,
                'roles': roles
            }

            logging.info(f'formatted_user: {formatted_user}')
            formatted_users.append(formatted_user)

        # logging.error(f"User data: {formatted_users}")
        return jsonify(formatted_users), 200
    except Exception as e:
        logging.error(f"Error fetching auth0 users: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetch auth0 users', 'error': str(e)}), 500
    finally:
        db.session.close()

@api.route('/auth0-user/<string:auth0_id>/roles', methods=['POST'])
@requires_auth('assign:permission')
def update_auth0_user_roles(payload, auth0_id):
    try:
        data = request.get_json()
        roles = data.get('roles', [])
            
        domain = os.getenv('AUTH0_APP_DOMAIN')
        client_id = os.getenv('AUTH0_M2M_CLIENT_ID')
        client_secret = os.getenv('AUTH0_M2M_CLIENT_SECRET')

        token_url = f"https://{domain}/oauth/token"
        token_payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "audience": f"https://{domain}/api/v2/",
            "grant_type": "client_credentials",
            "scope": "update:users read:roles"
        }

        token_response = requests.post(token_url, json=token_payload)
        
        if token_response.status_code != 200:
            return jsonify({'success': False, 'message': 'Failed to obtain management API token', 'error': token_response.text}), 500
        
        token_data = token_response.json()
        
        if 'access_token' not in token_data:
            return jsonify({'success': False, 'message': 'No access token in response', 'error': str(token_data)}), 500
        
        mgmt_api_token = token_data['access_token']

        headers = {
            'Authorization': f'Bearer {mgmt_api_token}',
            'Content-Type': 'application/json'
        }

        encoded_auth0_id = requests.utils.quote(auth0_id)
        roles_url = f"https://{domain}/api/v2/users/{encoded_auth0_id}/roles"
        
        current_roles_response = requests.get(roles_url, headers=headers)
        
        if current_roles_response.status_code == 200:
            current_roles = current_roles_response.json()
            
            if current_roles:
                current_role_ids = [role['id'] for role in current_roles]
                remove_payload = {"roles": current_role_ids}

                remove_response = requests.delete(roles_url, headers=headers, json=remove_payload)
                
                if remove_response.status_code != 204:
                    return jsonify({'success': False, 'message': 'Failed to remove existing roles', 'error': remove_response.text}), remove_response.status_code
        else:
            return jsonify({'success': False, 'message': 'Failed to get current roles', 'error': current_roles_response.text}), current_roles_response.status_code

        if roles:
            add_payload = {"roles": roles}
            add_response = requests.post(roles_url, headers=headers, json=add_payload)
            
            if add_response.status_code != 204:
                return jsonify({'success': False, 'message': 'Failed to add new roles', 'error': add_response.text}), add_response.status_code
        
        sessions_url = f"https://{domain}/api/v2/users/{encoded_auth0_id}/sessions"
        terminate_response = requests.delete(sessions_url, headers=headers)
        
        if roles:
            return jsonify({'success': True, 'message': 'Roles updated successfully and user sessions terminated'}), 200
        else:
            return jsonify({'success': True, 'message': 'All roles removed successfully and user sessions terminated'}), 200
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to update roles for user {auth0_id}', 'error': str(e)}), 500
    finally:
        db.session.close()

@api.route('/auth0-permission')
@requires_auth('read:auth0-permission')
def get_auth0_permission(payload):
    try:
        domain = os.getenv('AUTH0_APP_DOMAIN')
        app_client_id = os.getenv('AUTH0_APP_CLIENT_ID')
        client_id = os.getenv('AUTH0_M2M_CLIENT_ID')
        client_secret = os.getenv('AUTH0_M2M_CLIENT_SECRET')

        token_url = f"https://{domain}/oauth/token"
        token_payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "audience": f"https://{domain}/api/v2/",
            "grant_type": "client_credentials",
            "scope": "read:users update:users read:roles"
        }

        token_response = requests.post(token_url, json=token_payload)
        token_data = token_response.json()

        mgmt_api_token = token_data['access_token']

        headers = {
            'Authorization': f'Bearer {mgmt_api_token}',
            'Content-Type': 'application/json'
        }


        roles_url = f"https://{domain}/api/v2/roles"
        roles_response = requests.get(roles_url, headers=headers)
        roles_data = roles_response.json()

        formatted_permissions = [
            {
                "id": role["id"],
                "name": role["name"],
                "description": role.get("description", "")
            }
            for role in roles_data
        ]

        if not formatted_permissions:
            formatted_permissions = []

        return jsonify(formatted_permissions), 200
    except Exception as e:
        print(f"Error fetching auth0 permissions: {str(e)}")
        return jsonify({'success': False, 'message': 'Failed to fetching auth0 permissions', 'error': str(e)}), 500
    finally:
        db.session.close()


# @api.route('/groups')
# @requires_auth('get:group')
# def get_groups(payload):
#     try:
#         groups = Groups.query.order_by(Groups.name).all()
        
#         formatted_groups = [group.format() for group in groups]
        
#         return jsonify(formatted_groups), 200
#     except Exception as e:
#         print(f"Error fetching users: {str(e)}")
#         return jsonify({'success': False, 'message': 'Failed to fetch users', 'error': str(e)}), 500
#     finally:
#         db.session.close()

#######################
## -- Attendance  -- ##
#######################
@api.route('/attendance')
@requires_auth('get:attendance')
def get_latest_attendance(payload):
    try:
        user_id = request.args.get('user_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # If not user_id in url, return error
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400

        query = AttendanceRecords.query.filter_by(user_id=user_id)

        ## If start_date and end_date provided, add the filter to the query
        if start_date:
            query = query.filter(AttendanceRecords.timestamp >= f"{start_date}T00:00:00")
        if end_date:
            query = query.filter(AttendanceRecords.timestamp <= f"{end_date}T23:59:59")

        all_records = query.order_by(AttendanceRecords.timestamp).all()

        ## Grouping by day
        daily_records = {}
        for record in all_records:
            ## Convert to 'YYYY-MM-DD'
            date_str = record.timestamp.strftime('%Y-%m-%d')
            if date_str not in daily_records:
                daily_records[date_str] = []
            daily_records[date_str].append(record)

        summary = []
        for date, records in daily_records.items():
            if records:                
                ## sort the timestamp
                sorted_records = sorted(records, key=lambda x: x.timestamp)
                
                ## get the first and last records as check-in and check-out date time
                check_in = sorted_records[0]
                check_out = sorted_records[-1]
                
                ## Cal the work duration
                work_duration = (check_out.timestamp - check_in.timestamp).total_seconds() / 3600
                
                ## Try to convert the datetime to ISO format(For front-end display)
                summary.append({
                    'date': date,
                    'checkInTime': check_in.timestamp.isoformat() + 'Z',
                    'checkOutTime': check_out.timestamp.isoformat() + 'Z',
                    'workDuration': round(work_duration, 2)
                })
        
        summary.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify(summary), 200
    except Exception as e:
        print(e)
        return jsonify({'success': False, 'message': 'Failed to get attendance records', 'error': str(e)}), 500
    finally:
        db.session.close()

@api.route('/attendance', methods=['POST'])
@requires_auth('post:attendance')
def add_attendance_record(payload):
    try:
        request_data = request.get_json()
        
        if not all(key in request_data for key in ['user_id', 'timestamp']):
            return jsonify({
                'message': 'Missing required fields: user_id, timestamp'
            }), 400
            
        user_id = request_data.get('user_id')
        timestamp_str = request_data.get('timestamp')
        
        # try:
        #     timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        # except ValueError as e:
        #     return jsonify({
        #         'message': f'Invalid timestamp format: {str(e)}'
        #     }), 400
            
        user = db.session.get(Users, user_id)
        
        if not user:
            return jsonify({
                'message': f'User with ID {user_id} not found'
            }), 404
            
        new_record = AttendanceRecords(
            user_id=user_id,
            timestamp=timestamp_str
        )
        
        new_record.insert()
        
        return jsonify({
            'id': new_record.id,
            'user_id': new_record.user_id,
            'timestamp': new_record.timestamp.isoformat()
        }), 201
        
    except Exception as e:
        print(f"Error creating attendance record: {str(e)}")
        db.session.rollback()
        return jsonify({
            'message': 'An error occurred while creating the attendance record',
            'error': str(e)
        }), 500
    finally:
        db.session.close()

###################
## -- Events  -- ##
###################
@api.route('/events')
@requires_auth('get:events')
def get_events(payload):
    try:
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        year_month = request.args.get('year_month')

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            
            events = Events.query.filter(
                Events.date >= start_date,
                Events.date < end_date
            ).all()

        elif year_month:
            year, month = year_month.split('-')
            year = int(year)
            month = int(month)

            start_date = datetime(year, month, 1)
            
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
        
            events = Events.query.filter(
                Events.date >= start_date,
                Events.date < end_date
            ).all()

        if events:
            formatted_events = [event.format() for event in events]
        else:
            formatted_events = []

        return jsonify({
            'events': formatted_events
        }), 200
    except Exception as e:
        print(e)
        return jsonify({'success': False, 'message': 'Failed to get events', 'error': str(e)}), 500
    finally:
        db.session.close()

@api.route('/events', methods=['POST'])
@requires_auth('post:events')
def create_events(payload):
    try:
        request_data = request.get_json()
        
        if not all(key in request_data for key in ['name', 'date']):
            return jsonify({
                'message': 'Missing required fields: name, date'
            }), 400
        
        name = request_data.get('name')
        description = request_data.get('description', '')
        event_date_str = request_data.get('date')
        
        try:
            event_date = datetime.fromisoformat(event_date_str)
        
        except ValueError as e:
            return jsonify({
                'message': f'Invalid date format: {str(e)}'
            }), 400
        
        new_event = Events(
            name=name,
            desc=description,
            date=event_date
        )

        new_event.insert()
        
        return jsonify({
            'id': new_event.id,
        }), 201
        
    except Exception as e:
        print(f"Error creating event: {str(e)}")
        db.session.rollback()
        return jsonify({
            'message': 'An error occurred while creating the event',
            'error': str(e)
        }), 500
    finally:
        db.session.close()

@api.route('/events/<int:event_id>', methods=['DELETE'])
@requires_auth('delete:events')
def delete_events(payload, event_id):
    try:
        event_id = int(event_id)
        event = db.session.get(Events, event_id)
        if not event:
            return jsonify({
                'success': False,
                'message': f'Event with ID {event_id} not found'
            }), 404
        
        event.delete()
        return jsonify({
            'success': True,
            'delete': event.id
        })
    except Exception as e:
        print(f"Error deleting event: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False, 
            'message': 'An error occurred while deleting the event',
            'error': str(e)
        }), 500
    finally:
        db.session.close()

@api.route('/events/<int:event_id>', methods=['PATCH'])
@requires_auth('patch:events')
def patch_events(payload, event_id):
    try:
        event = db.session.get(Events, event_id)
        
        if not event:
            return jsonify({
                'success': False,
                'message': 'Event not found'
            }), 404
        
        request_data = request.get_json()
        
        if 'name' in request_data:
            event.name = request_data['name']
        
        if 'description' in request_data:
            event.desc = request_data['description']
        
        if 'date' in request_data:
            try:
                event_date = datetime.fromisoformat(request_data['date'])
                event.date = event_date
            except ValueError as e:
                return jsonify({
                    'success': False,
                    'message': f'Invalid date format: {str(e)}'
                }), 400
        
        event.update()
        
        return jsonify({
            'success': True,
            'id': event.id,
            'updated': True
        }), 200
        
    except Exception as e:
        print(f"Error patching event: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'An error occurred while updating the event',
            'error': str(e)
        }), 500
    finally:
        db.session.close()

###########################
##### --   Leave   -- #####
###########################
# @api.route('/leave')
# @requires_auth('get:leave')
# def get_leaves(payload):
#     try:

#         return jsonify({
#             'success': True,
#             'id': event.id,
#             'updated': True
#         }), 200
#     except Exception as e:
#         print(f"Error patching event: {str(e)}")
#         db.session.rollback()
#         return jsonify({
#             'success': False,
#             'message': 'An error occurred while updating the event',
#             'error': str(e)
#         }), 500
#     finally:
#         db.session.close()

# @api.route('/leave')
# @requires_auth('get:leave-list')
# def get_leaves_list(payload):
#     try:

#         return jsonify({
#             'success': True,
#             'id': event.id,
#             'updated': True
#         }), 200
#     except Exception as e:
#         print(f"Error patching event: {str(e)}")
#         db.session.rollback()
#         return jsonify({
#             'success': False,
#             'message': 'An error occurred while updating the event',
#             'error': str(e)
#         }), 500
#     finally:
#         db.session.close()

# @api.route('/leave', methods=['POST'])
# @requires_auth('post:leave')
# def create_leaves(payload):
#     try:

#         return jsonify({
#             'success': True,
#             'id': event.id,
#             'updated': True
#         }), 200
#     except Exception as e:
#         print(f"Error patching event: {str(e)}")
#         db.session.rollback()
#         return jsonify({
#             'success': False,
#             'message': 'An error occurred while updating the event',
#             'error': str(e)
#         }), 500
#     finally:
#         db.session.close()

# @api.route('/leave', methods=['DELETE'])
# @requires_auth('delete:leave')
# def delete_leaves(payload):
#     try:

#         return jsonify({
#             'success': True,
#             'id': event.id,
#             'updated': True
#         }), 200
#     except Exception as e:
#         print(f"Error patching event: {str(e)}")
#         db.session.rollback()
#         return jsonify({
#             'success': False,
#             'message': 'An error occurred while updating the event',
#             'error': str(e)
#         }), 500
#     finally:
#         db.session.close()

# @api.route('/leave', methods=['PATCH'])
# @requires_auth('patch:leave')
# def patch_leaves(payload):
#     try:

#         return jsonify({
#             'success': True,
#             'id': event.id,
#             'updated': True
#         }), 200
#     except Exception as e:
#         print(f"Error patching event: {str(e)}")
#         db.session.rollback()
#         return jsonify({
#             'success': False,
#             'message': 'An error occurred while updating the event',
#             'error': str(e)
#         }), 500
#     finally:
#         db.session.close()