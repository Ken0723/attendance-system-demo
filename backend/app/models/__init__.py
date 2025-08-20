from .model import Users, AttendanceRecords, Events
from .database import db, setup_db, db_drop_and_create_all, database_path as default_path

def init_db(app, database_path=None):
    # create_tables_if_needed(app, db, [Users, AttendanceRecords, Events])
    try:
        db = setup_db(app, database_path or default_path)
        
        with app.app_context():
            db_drop_and_create_all(app)
            # default_value()
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
    
    return db

# def default_value():
#     try:
#         # Default admin

#         # A normal user, like staff/employee

#         # A default group
#         # normal_group = Groups.query.filter_by(id="1").first()
#         # if not normal_group:
#         #     normal_group = Groups (
#         #         id = '1',
#         #         name = 'Admin'
#         #     )

#         #     normal_group.insert()
        
#     except Exception as e:
#         print(f"Error creating default data: {str(e)}")