import webbrowser
import json
import os
from dotenv import load_dotenv
from stravalib.client import Client

load_dotenv()
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
CLIENT_ID = os.getenv("CLIENT_ID")


def getInitialToken():
    # Handles initial auth flow to get access and refresh tokens, only run once
    client = Client()

    # This is the begining of the authetication process, to retreive a refresh token
    # You must open the url and follow the instructions on initial lauch

    redirect_url = "http://127.0.0.1:5000/authorization"

    request_scope = ["read_all", "profile:read_all", "activity:read_all"]

    url = client.authorization_url(
        client_id=CLIENT_ID, redirect_uri=redirect_url, scope=request_scope
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

    return token_response


def get_code_for_tokens(auth_code):
    try:
        client = Client()

        token_response = client.exchange_code_for_token(
            client_id=CLIENT_ID, client_secret=CLIENT_SECRET, code=auth_code
        )

        json_path = "token_response.json"

        with open(json_path, "w") as f:
            json.dump(token_response, f)

        print("Tokens saved successfully ")
        return token_response
    except Exception as e:
        print(f"Error exchanging code for token: {e}")
        raise e


def loadTokens():
    # Loads tokens from the saved file
    try:
        with open("token_response.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print("No token file found. Run get_initial_token() first.")
        return None


def getAuthenticatedUser():
    # Will return an authenticated strava client
    # will auto refresh access token if needed

    # loading existing tokens
    token_data = loadTokens()
    if not token_data:
        print("No Tokens found. Getting initial token...")

    client = Client()
    client.access_token = token_data["access_token"]

    # this code is used to refresh the access token once it has expired
    # the .refresh_access_token will only return a fresh token if the current is expired
    # or has less that an hour left on the duration

    try:
        refresh_response = client.refresh_access_token(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            refresh_token=token_data["refresh_token"],
        )

        if refresh_response != token_data:
            with open("token_response.json", "w") as f:
                json.dump(refresh_response, f)
            client.access_token = refresh_response["access_token"]
    except Exception as e:
        print(f"Error refreshing token: {e}")

    return client


def getAthleteinfo(client):
    """
    Returns basic athlete info, as we are now an authenticated user ensure the application
    is authenticated before attempting to run this function.
    """

    try:
        athlete = client.get_athlete()
        return {
            "id": athlete.id,
            "firstname": athlete.firstname,
            "lastname": athlete.lastname,
            "email": athlete.email,
        }
    except Exception as e:
        print(f"Error getting athlete info: {e}")
        return None
