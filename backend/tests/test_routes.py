import unittest
import json
from flask import Flask
from app.main import create_app
from app.models import db, Users, AttendanceRecords, Events
from datetime import datetime, timedelta
import os
from os import getenv
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv('FRONTEND_URL')

class APITestCase(unittest.TestCase):
    def setUp(self):
        """Set up"""
        test_config = {
            'SQLALCHEMY_DATABASE_URI': 'postgresql://{}:{}@{}:{}/{}'.format(
                os.getenv('DB_USER'),
                os.getenv('DB_PASSWORD'),
                os.getenv('DB_HOST'),
                os.getenv('DB_PORT'),
                os.getenv('TEST_DB_NAME')
            )
        }

        self.app = create_app(test_config)
        self.client = self.app.test_client
        
        # Test token Data
        self.admin_auth_header = {
            'Authorization': f'Bearer {os.getenv("ADMIN_TOKEN")}'
        }
        self.user_auth_header = {
            'Authorization': f'Bearer {os.getenv("USER_TOKEN")}'
        }
        self.invalid_auth_header = {
            'Authorization': 'Bearer invalid_token'
        }
        
        with self.app.app_context():
            db.create_all()
            self.setup_test_data()
    
    def setup_test_data(self):
        """Setup test data"""
        test_user = Users(
            username="testuser",
            email="test@example.com",
            auth0_id="auth0|test123",
            position="Test Position",
        )
        test_user.insert()
        self.test_user_id = test_user.id
        
        test_event = Events(
            name="Test Event",
            desc="Test Description",
            date=datetime.now()
        )
        test_event.insert()
        self.test_event_id = test_event.id
    
    def tearDown(self):
        """Run it when finished a test"""
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

    # Account Related Tests
    def test_check_auth_success(self):
        """Test Auth success"""
        res = self.client().get('/api/check-auth', headers=self.admin_auth_header)
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['message'], 'Authenticated')
    
    def test_check_auth_failure(self):
        """Test check auth failure, it will redirect to login page"""
        res = self.client().get('/api/check-auth')  # No JWT header
        
        self.assertEqual(res.status_code, 401)
    
    def test_check_auth_invalid_token(self):
        """Test check auth with invalid token"""
        res = self.client().get('/api/check-auth', headers=self.invalid_auth_header)
        
        self.assertEqual(res.status_code, 401)
    
    def test_request_login_success(self):
        """Test request login success with next URL"""
        res = self.client().get('/api/request-login?nextUrl=/dashboard')
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])
        self.assertTrue('login_url' in data)
    
    def test_login_callback_success(self):
        """Test login callback redirects correctly"""
        res = self.client().get('/api/login-callback?state=test_state')
        
        self.assertEqual(res.status_code, 302)  # HTTP redirect
        self.assertTrue(f"{FRONTEND_URL}/auth/callback?state=test_state" in res.location)
    
    def test_get_user_info_success(self):
        """Test get user info success"""
        res = self.client().get('/api/user-info', headers=self.admin_auth_header)
        data = json.loads(res.data)
        
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])
        self.assertTrue('user_info' in data)
    
    def test_get_user_info_failure(self):
        """Test get user info without auth token"""
        res = self.client().get('/api/user-info')
        
        self.assertEqual(res.status_code, 401)
    
    # Users Tests
    def test_get_users_success(self):
        """Test get users success"""
        res = self.client().get('/api/users', headers=self.admin_auth_header)
        
        self.assertEqual(res.status_code, 200)
        self.assertTrue(any(user['username'] == 'testuser' for user in json.loads(res.data)))
    
    def test_get_users_unauthorized(self):
        """Test user is unauthorized"""
        res = self.client().get('/api/users')  # No JWT header
        
        self.assertEqual(res.status_code, 401)
    
    def test_get_users_forbidden(self):
        """Test user with insufficient permissions"""
        # Assuming user token doesn't have 'get:users' permission
        res = self.client().get('/api/users', headers=self.user_auth_header)
        
        self.assertEqual(res.status_code, 403)
    
    # Attendance Tests
    def test_add_attendance_success(self):
        """Test add attendance records success"""
        attendance_data = {
            'user_id': self.test_user_id,
            'timestamp': datetime.now().isoformat()
        }
        
        res = self.client().post(
            '/api/attendance',
            json=attendance_data,
            headers=self.admin_auth_header
        )
        
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 201)
        self.assertEqual(data['user_id'], self.test_user_id)
    
    def test_add_attendance_missing_fields(self):
        """Test missing fields when adding attendance"""
        attendance_data = {
            'user_id': self.test_user_id
            # Missing timestamp
        }
        
        res = self.client().post(
            '/api/attendance',
            json=attendance_data,
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 400)
    
    def test_add_attendance_user_not_found(self):
        """Test adding attendance for non-existent user"""
        attendance_data = {
            'user_id': 9999,  # Non-existent user ID
            'timestamp': datetime.now().isoformat()
        }
        
        res = self.client().post(
            '/api/attendance',
            json=attendance_data,
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 404)
    
    def test_add_attendance_unauthorized(self):
        """Test adding attendance without proper auth"""
        attendance_data = {
            'user_id': self.test_user_id,
            'timestamp': datetime.now().isoformat()
        }
        
        res = self.client().post(
            '/api/attendance',
            json=attendance_data
        )
        
        self.assertEqual(res.status_code, 401)
    
    def test_get_attendance_success(self):
        """Test get the attendance success"""
        # Add a testing record
        attendance = AttendanceRecords(
            user_id=self.test_user_id,
            timestamp=datetime.now()
        )
        with self.app.app_context():
            attendance.insert()
        
        res = self.client().get(
            f'/api/attendance?user_id={self.test_user_id}',
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertTrue(len(data) > 0)
    
    def test_get_attendance_without_user_id(self):
        """Test get attendance records without user id"""
        res = self.client().get(
            '/api/attendance',
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 400)
    
    def test_get_attendance_with_date_range(self):
        """Test get attendance with date range"""
        # Add test attendance record
        attendance = AttendanceRecords(
            user_id=self.test_user_id,
            timestamp=datetime.now()
        )
        with self.app.app_context():
            attendance.insert()
        
        today = datetime.now().strftime('%Y-%m-%d')
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        res = self.client().get(
            f'/api/attendance?user_id={self.test_user_id}&start_date={today}&end_date={tomorrow}',
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 200)
    
    def test_get_attendance_unauthorized(self):
        """Test get attendance without auth"""
        res = self.client().get(
            f'/api/attendance?user_id={self.test_user_id}',
        )
        
        self.assertEqual(res.status_code, 401)
    
    # Events Tests
    def test_get_events_success(self):
        """Test get events success"""
        today = datetime.now().strftime('%Y-%m-%d')
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        
        res = self.client().get(
            f'/api/events?start_date={today}&end_date={tomorrow}',
            headers=self.admin_auth_header
        )
        
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue('events' in data)
    
    def test_get_events_with_year_month(self):
        """Test get events with year-month parameter"""
        current_month = datetime.now().strftime('%Y-%m')
        
        res = self.client().get(
            f'/api/events?year_month={current_month}',
            headers=self.admin_auth_header
        )
        
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue('events' in data)
    
    def test_get_events_unauthorized(self):
        """Test get events without auth"""
        res = self.client().get('/api/events')
        
        self.assertEqual(res.status_code, 401)
    
    def test_create_event_success(self):
        """Test create event success"""
        event_data = {
            'name': 'New Test Event',
            'description': 'New Test Description',
            'date': datetime.now().isoformat()
        }
        
        res = self.client().post(
            '/api/events',
            json=event_data,
            headers=self.admin_auth_header
        )
        
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 201)
        self.assertTrue('id' in data)
    
    def test_create_event_missing_fields(self):
        """Testing missing fields when creating event"""
        event_data = {
            'description': 'Missing Name Event'
            # Missing name and date
        }
        
        res = self.client().post(
            '/api/events',
            json=event_data,
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 400)
    
    def test_create_event_invalid_date(self):
        """Test creating event with invalid date format"""
        event_data = {
            'name': 'Invalid Date Event',
            'description': 'Event with invalid date',
            'date': 'not-a-date'
        }
        
        res = self.client().post(
            '/api/events',
            json=event_data,
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 400)
    
    def test_create_event_unauthorized(self):
        """Test creating event without auth"""
        event_data = {
            'name': 'New Test Event',
            'description': 'New Test Description',
            'date': datetime.now().isoformat()
        }
        
        res = self.client().post(
            '/api/events',
            json=event_data
        )
        
        self.assertEqual(res.status_code, 401)
    
    def test_update_event_success(self):
        """Test update success"""
        update_data = {
            'name': 'Updated Test Event'
        }
        
        res = self.client().patch(
            f'/api/events/{self.test_event_id}',
            json=update_data,
            headers=self.admin_auth_header
        )
        
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])
        self.assertTrue(data['updated'])
    
    def test_update_event_not_found(self):
        """Test updating non-existent event"""
        update_data = {
            'name': 'Updated Test Event'
        }
        
        res = self.client().patch(
            '/api/events/9999',  # Non-existent ID
            json=update_data,
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 404)
    
    def test_update_event_invalid_date(self):
        """Test updating event with invalid date"""
        update_data = {
            'date': 'not-a-date'
        }
        
        res = self.client().patch(
            f'/api/events/{self.test_event_id}',
            json=update_data,
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 400)
    
    def test_update_event_unauthorized(self):
        """Test updating event without auth"""
        update_data = {
            'name': 'Updated Test Event'
        }
        
        res = self.client().patch(
            f'/api/events/{self.test_event_id}',
            json=update_data
        )
        
        self.assertEqual(res.status_code, 401)
    
    def test_delete_event_success(self):
        """Test delete the event success"""
        res = self.client().delete(
            f'/api/events/{self.test_event_id}',
            headers=self.admin_auth_header
        )
        
        data = json.loads(res.data)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(data['success'])
        self.assertEqual(data['delete'], self.test_event_id)
    
    def test_delete_event_not_found(self):
        """Test if the event not found"""
        non_existent_id = 9999
        res = self.client().delete(
            f'/api/events/{non_existent_id}',
            headers=self.admin_auth_header
        )
        
        self.assertEqual(res.status_code, 404)
    
    def test_delete_event_unauthorized(self):
        """Test deleting event without auth"""
        res = self.client().delete(
            f'/api/events/{self.test_event_id}'
        )
        
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()