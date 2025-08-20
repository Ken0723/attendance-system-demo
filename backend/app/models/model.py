import jwt

from datetime import datetime, timezone

from .database import db
from sqlalchemy import Column, String, Integer, DateTime, Boolean

# Attendance records, once the card reader read a id then store it to this table as raw data
class AttendanceRecords(db.Model):
    __tablename__ = 'attendance_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))

    def __init__(self, user_id, timestamp):
        self.user_id = user_id
        self.timestamp = timestamp or datetime.now(timezone.utc)
    
    def insert(self):
        db.session.add(self)
        db.session.commit()
    
    def update(self):
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()

    def format(self):
        return ({
            'id': self.id,
            'user_id': self.user_id,
            'timestamp': self.timestamp,
        })
    
# Events, used to store event's info
class Events(db.Model):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    desc = Column(String(250), nullable=True)
    date = Column(DateTime(timezone=True), nullable=False)

    def __init__(self, name, desc, date):
        self.name = name
        self.desc = desc
        self.date = date

    def insert(self):
        db.session.add(self)
        db.session.commit()
    
    def update(self):
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    
    def format(self):
        return {
            "id": self.id,
            "name": self.name,
            "desc": self.desc,
            "date": self.date
        }
        
# Users modal, used to store some base info
class Users(db.Model):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    auth0_id = Column(String(50), unique=True, nullable=False)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    position = Column(String(100), nullable=False)
    department = Column(String(50))
    is_active = Column(Boolean, default=True) 

    attendance_records = db.relationship('AttendanceRecords', backref='user', lazy=True)

    def __init__(self, auth0_id, username, email, position='', department=None, id=None, is_active=True):
        if id is not None:
            self.id = id
        self.auth0_id = auth0_id
        self.username = username
        self.email = email
        self.department = department
        self.position = position

    def insert(self):
        db.session.add(self)
        db.session.commit()
    
    def update(self):
        db.session.commit()
    
    def delete(self):
        db.session.delete(self)
        db.session.commit()
    
    def format(self):
        return ({
            'id': self.id,
            'auth0_id': self.auth0_id,
            'username': self.username,
            'email': self.email,
            'position': self.position,
            'department': self.department,
            'isActive': self.is_active,
        })
    
# Group model, used to store group's data
# class Groups(db.Model):
#     __tablename__ = 'groups'

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     auth0_group_id = Column(String(50), unique=True, nullable=False)
#     name = Column(String(50), unique=True, nullable=False)

#     def __init__(self, id, auth0_group_id, name):
#         self.id = id
#         self.auth0_group_id = auth0_group_id
#         self.name = name
    
#     def insert(self):
#         db.session.add(self)
#         db.session.commit()
    
#     def update(self):
#         db.session.commit()
    
#     def delete(self):
#         db.session.delete(self)
#         db.session.commit()

#     def format(self):
#         return ({
#             'id': self.id,
#             'auth0_group_id': self.auth0_group_id,
#             'name': self.name,
#         })
    
# User Group model, used to store user and group relationship
# class UserGroup(db.Model):
#     __tablename__ = 'user_groups'

#     id = Column(Integer, primary_key=True, autoincrement=True)
#     user_id = Column(Integer, db.ForeignKey('users.id'), nullable=False)
#     group_id = Column(Integer, db.ForeignKey('groups.id'), nullable=False)

#     user = db.relationship('Users', backref=db.backref('groups_assoc', lazy=True))
#     group = db.relationship('Groups', backref=db.backref('users_assoc', lazy=True))

#     __table_args__ = (db.UniqueConstraint('user_id', 'group_id', name='uq_user_group'),)

#     def __init__(self, id, user_id, group_id):
#         self.id = id
#         self.user_id = user_id
#         self.group_id = group_id
    
#     def insert(self):
#         db.session.add(self)
#         db.session.commit()
    
#     def update(self):
#         db.session.commit()
    
#     def delete(self):
#         db.session.delete(self)
#         db.session.commit()

#     def format(self):
#         return ({
#             'id': self.id,
#             'user_id': self.user_id,
#             'group_id': self.group_id,
#         })