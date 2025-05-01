import pytest
import bcrypt
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app, db
from app import User  

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 'sqlite:///:memory:'
    )   
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

@pytest.fixture
def db_session():
    with app.app_context():
        yield db.session

@pytest.fixture
def access_token(client):
    # Register and log in a test user to get a token
    client.post('/api/signup', json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepassword123"
    })
    login_res = client.post('/api/login', json={
        "username": "testuser",
        "password": "securepassword123"
    })
    return login_res.get_json()["access_token"]

def test_signup_success(client):
    response = client.post('/api/signup', json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "securepassword123"
    })
    assert response.status_code == 201
    assert "access_token" in response.get_json()

def test_login_success(client, db_session):
    user = User(username="testlogin", email="testlogin@example.com",
                password=bcrypt.hashpw("password123".encode(), bcrypt.gensalt()).decode())
    db_session.add(user)
    db_session.commit()

    response = client.post('/api/login', json={
        "username": "testlogin",
        "password": "password123"
    })
    assert response.status_code == 201
    assert "access_token" in response.get_json()

def test_create_league(client, access_token):
    response = client.post('/api/league/create',
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "league_name": "Test League",
            "sport": "nfl",
            "team_name": "Test Team"
        }
    )
    assert response.status_code == 201
    assert "League successfully created" in response.get_json()["message"]

def test_scoreboard_missing_params(client):
    response = client.get('/api/scoreboard?sport=nfl')  # Missing dates
    assert response.status_code == 400
    assert "Missing required parameters" in response.get_json()["error"]

def test_protected_route_without_token(client):
    response = client.get('/api/me')
    assert response.status_code == 401
    assert "Missing Authorization Header" in response.get_json()["msg"]

def test_duplicate_signup(client):
    client.post('/api/signup', json={
        "username": "dupeuser",
        "email": "dupe@example.com",
        "password": "secure123"
    })
    response = client.post('/api/signup', json={
        "username": "dupeuser2",
        "email": "dupe@example.com",
        "password": "secure456"
    })
    assert response.status_code == 400
    assert "User already exists" in response.get_json()["error"]

def test_login_failure(client):
    response = client.post('/api/login', json={
        "username": "nonexistent",
        "password": "wrongpass"
    })
    assert response.status_code == 401

    client.post('/api/signup', json={
        "username": "newuser",
        "email": "test@example.com",
        "password": "secure456"
    })
    client.post('/api/logout')

    response2 = client.post('/api/login', json={
        "username": "newuser",
        "password": "wrongpass"
    })

    assert "Invalid username or password" in response.get_json()["error"]

    # assert that username enumeration is not possible
    assert response.get_json()["error"] == response2.get_json()["error"]

def test_create_league_missing_field(client, access_token):
    response = client.post('/api/league/create',
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "league_name": "League No Team",
            "sport": "nfl"
        }
    )
    assert response.status_code == 400
    assert "Missing" in response.get_json()["error"]

def test_get_me_success(client, access_token):
    response = client.get("/api/me", headers={"Authorization": f"Bearer {access_token}"})
    assert response.status_code == 200
    assert "id" in response.get_json()

def test_create_league_unauthorized(client):
    response = client.post('/api/league/create', json={
        "league_name": "Unauthorized League",
        "sport": "nfl",
        "team_name": "No Token Team"
    })
    assert response.status_code == 401