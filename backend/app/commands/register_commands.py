import click, random
from flask.cli import with_appcontext
from datetime import datetime, timedelta
from ..models import db, AttendanceRecords, Events
from faker import Faker

def register_commands(app):
    @app.cli.command("seed_attendance_data")
    @click.option('--records', default=100, help='Len of the data')
    @with_appcontext
    def seed_attendance_data(records):
        """Generate sample attendance records data for testing."""

        # Clear up the AttendanceRecords table
        db.session.query(AttendanceRecords).delete()
        
        user_count = 5
        users = list(range(1, user_count + 1))
        created_records = []
        
        # The day range is current day +- 30
        for day in range(30):
            date = datetime.now() - timedelta(days=day)
            
            for user_id in users:
                if random.random() < 0.7:
                    # Work on time
                    clock_in = datetime.combine(
                        date.date(), 
                        datetime.strptime(f"{random.randint(8, 9)}:{random.randint(0, 59):02d}", "%H:%M").time()
                    )
                    created_records.append(AttendanceRecords(
                        user_id=user_id,
                        timestamp=clock_in
                    ))
                    
                    # Work off time
                    clock_out = datetime.combine(
                        date.date(),
                        datetime.strptime(f"{random.randint(17, 18)}:{random.randint(0, 59):02d}", "%H:%M").time()
                    )
                    created_records.append(AttendanceRecords(
                        user_id=user_id,
                        timestamp=clock_out
                    ))
        
        # Insert all data to db
        db.session.add_all(created_records)
        db.session.commit()
        
        click.echo(f"Success to insert {len(created_records)} attendance records")
    
    @app.cli.command("seed_events_data")
    @click.option('--records', default=20, help='Number of event records to generate')
    @with_appcontext
    def seed_events_data(records):
        """Generate sample event data for testing."""
        
        fake = Faker()
        
        db.session.query(Events).delete()
        db.session.commit()
        
        print(f"Generating {records} event records...")
        
        # Fake Event Types
        event_types = [
            "Testing 1", "Testing 2", "Testing 3",
        ]
        
        # Fake Events Locaiton
        event_locations = [
            "Conference Room A", "Conference Room B", "Conference Room C",
        ]
        
        created_events = []
        today = datetime.now()
        
        # To gen last 1 month data
        past_count = int(records * 0.3)
        for i in range(past_count):
            days_ago = random.randint(1, 30)
            event_date = today - timedelta(days=days_ago)
            
            # Events Name
            event_name = f"Passed Events {random.choice(event_types)}"
            if i > 0:
                event_name += f"{i}"
                
            # Events desc
            location = random.choice(event_locations)
            duration = random.choice([1, 1.5, 2, 3, 4])
            event_desc = (
                f"Location: {location}\n"
                f"Duration: {duration} hours\n\n"
                f"Organizer: {fake.name()}"
            )
            
            # Events time
            hour = random.randint(9, 17)
            minute = random.choice([0, 15, 30, 45])
            event_date = event_date.replace(hour=hour, minute=minute)
            
            event = Events(name=event_name, desc=event_desc)
            event.date = event_date
            
            created_events.append(event)
    
        # Gen today event
        today_count = int(records * 0.2)
        for i in range(today_count):
            event_date = today
            
            # Events time
            hour = random.randint(8, 20)  # 8 AM - 8 PM
            minute = random.choice([0, 15, 30, 45])
            event_date = event_date.replace(hour=hour, minute=minute)
            
            # Events Name
            event_name = f"Today's {random.choice(event_types)}"
            if i > 0:
                event_name += f" ({i})"
                
            # Events desc
            location = random.choice(event_locations)
            duration = random.choice([1, 1.5, 2, 3, 4])
            event_desc = (
                f"Location: {location}\n"
                f"Duration: {duration} hours\n\n"
                f"Organizer: {fake.name()}"
            )

            event = Events(name=event_name, desc=event_desc)
            event.date = event_date
            
            created_events.append(event)
    
        # Gen future event
        future_count = records - past_count - today_count
        for i in range(future_count):
            days_ahead = random.randint(1, 60)
            event_date = today + timedelta(days=days_ahead)
            
            # Events time
            hour = random.randint(8, 19)  # 8 AM - 7 PM
            minute = random.choice([0, 15, 30, 45])
            event_date = event_date.replace(hour=hour, minute=minute)
            
            # Events Name
            type_name = random.choice(event_types)
            event_name = f"Upcoming {type_name}"
            
            # Events desc
            location = random.choice(event_locations)
            duration = random.choice([1, 1.5, 2, 3, 4])
            event_desc = (
                f"Location: {location}\n"
                f"Duration: {duration} hours\n\n"
                f"Organizer: {fake.name()}"
            )
            
            event = Events(name=event_name, desc=event_desc)
            event.date = event_date
            
            created_events.append(event)
    
        # Add all fake data to db
        for event in created_events:
            db.session.add(event)
        
        db.session.commit()
        
        print(f"Successfully created {len(created_events)} events.")

        return created_events