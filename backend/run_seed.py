from app.main import APP
from flask.cli import FlaskGroup

cli = FlaskGroup(create_app=lambda: APP)

if __name__ == '__main__':
    cli()
