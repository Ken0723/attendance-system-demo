import os

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
from sqlalchemy import inspect

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()

# Database path formatting
database_path = 'postgresql://{}:{}@{}:{}/{}'.format(
    os.getenv('DB_USER'),
    os.getenv('DB_PASSWORD'),
    os.getenv('DB_HOST'),
    os.getenv('DB_PORT'),
    os.getenv('DB_NAME')
)

# Database init
def setup_db(app, database_path=database_path):
    app.config['SQLALCHEMY_DATABASE_URI'] = database_path
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    # migrate.init_app(app, db)

    return db

# Database create
def db_drop_and_create_all(app):
    with app.app_context():
        inspector = inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if not existing_tables:
            print("Creating tables...")
            try:
                db.create_all()
                print("Tables created successfully")
                return True
            except Exception as e:
                print(f"Error creating tables: {e}")
                db.session.rollback()
                raise
        else:
            print("Tables already exist, skipping initialization")
            return False