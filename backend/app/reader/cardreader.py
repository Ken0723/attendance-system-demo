import os, json, requests, signal

from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

API_ENDPOINT = os.getenv('API_ENDPOINT') + "/api/attendance"
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN')

running = True

# Print it if the program cancel
def signal_handler(sig, frame):
    global running
    print("Stopping...")
    running = False

# Once read a card, then send the id to db as raw data
def handle_card_read(user_input):
    current_time = datetime.now()
    print("ID:", user_input, ", DateStamp:", current_time)
    
    timestamp_str = current_time.isoformat()
    
    payload = json.dumps({
        "user_id": user_input, 
        "timestamp": timestamp_str
    })

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {ADMIN_TOKEN}'
    }
    
    try:
        response = requests.post(API_ENDPOINT, data=payload, headers=headers)
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text}")
        if response.status_code == 200 or response.status_code == 201:
            print("Successfully")
        else:
            print(f"Failed to send to server. Status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error sending request: {e}")

# Detect the user signal input, also "quit" is acceptable
signal.signal(signal.SIGINT, signal_handler)
try:
    while running:
        user_input = input("ID Card: ")
        if user_input.lower() == 'quit':
            break
        if user_input:
            handle_card_read(user_input)

except Exception as e:
    print(f"Error: {e}")
finally:
    print("Program exit. Close connection.")

print("End of program.")