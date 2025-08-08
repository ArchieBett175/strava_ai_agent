import webbrowser
import json
import os

from dotenv import load_dotenv
from stravalib.client import Client


load_dotenv()
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CLIENT_ID = os.getenv("CLIENT_ID")

client = Client()

# This is the begining of the authetication process, to retreive a refresh token
# You must open the url and follow the instructions on initial lauch

redirect_url = "http://127.0.0.1:5000/authorization"

request_scope = ["read_all", "profile:read_all", "activity:read_all"]

url = client.authorization_url(
    client_id=CLIENT_ID,
    redirect_uri=redirect_url,
    scope=request_scope,
)

webbrowser.open(url)

print(
    """You will see a URL that looks like this:
    http://127.0.0.1:5000/authorization?state=&code=12323423423423423423423550&scope=read,activity:read_all,profile:read_all,read_all
    Copy the values between code= and & in the URL that you see in the browser."""
)

code = input("Enter the code you see")
print(
    f"Great! Your code is {code}\n"
    "Next, I will exchange that code for a token.\n"
    "I only have to do this once."
)

# this is saving the access and refresh token to a json file

token_response = client.exchange_code_for_token(
    client_id=CLIENT_ID, client_secret=CLIENT_SECRET, code=code
)

json_path = "token_response.json"

with open(json_path, "w") as f:
    json.dump(token_response, f)

# saving it as local variables for convience

access_token = token_response["access_token"]
refresh_token = token_response["refresh_token"]

# reads our refresh token from the json file
with open(json_path, "r") as f:
    token_response_refresh = json.load(f)

print(token_response_refresh)

# this code is used to refresh the access token once it has expired
# the .refresh_access_token will only return a fresh token if the current is expired
# or has less that an hour left on the duration

refresh_response = client.refresh_access_token(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    refresh_token=refresh_token,
)

# because we are authenticated we can retrieve athelete data from the client
# without authentication this would return a 404, so ensure the application is
# Authenticated before trying to run this

athlete = client.get_athlete()

print(client.access_token)

f"Hi {athlete.firstname} you are authenticated"

# to-do play about and get familiar with strava api, create file to retrive authenticaton and different functions
