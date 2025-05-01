import pytest
import bcrypt
import sys
import os
import json
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app, db
from app import User, Team, League, TeamPlayer, TeamPlayerPerformance

@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///:memory:')
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()

@pytest.fixture
def user_token(client):
    client.post('/api/signup', json={
        "username": "user1",
        "email": "user1@example.com",
        "password": "password123"
    })
    login = client.post('/api/login', json={
        "username": "user1",
        "password": "password123"
    })
    return login.get_json()["access_token"]

def test_team_enrollment(client, user_token):
    league_res = client.post("/api/league/create", headers={"Authorization": f"Bearer {user_token}"}, json={
        "league_name": "Enroll League",
        "sport": "nfl",
        "team_name": "Enroll Team"
    })
    assert league_res.status_code == 201
    data = league_res.get_json()
    assert "League successfully created" in data["message"]

def test_concurrent_user_latency(client):
    def signup_and_login(i):
        username = f"user{i}"
        email = f"user{i}@example.com"
        client.post('/api/signup', json={
            "username": username,
            "email": email,
            "password": "pass123"
        })
        res = client.post('/api/login', json={
            "username": username,
            "password": "pass123"
        })
        return res.status_code

    with ThreadPoolExecutor(max_workers=1000) as executor:
        results = list(executor.map(signup_and_login, range(1000)))
        assert all(code == 201 for code in results)

def test_matchup_scoring_details(client, user_token):
    # Create a league and two teams
    client.post("/api/league/create", headers={"Authorization": f"Bearer {user_token}"}, json={
        "league_name": "Matchup League",
        "sport": "nfl",
        "team_name": "Team Alpha"
    })

    # Create a second user and join same league
    client.post('/api/signup', json={
        "username": "user2",
        "email": "user2@example.com",
        "password": "password123"
    })
    login2 = client.post('/api/login', json={
        "username": "user2",
        "password": "password123"
    })
    token2 = login2.get_json()["access_token"]

    # Join the league with second team
    leagues = client.post("/api/league/joinable", headers={"Authorization": f"Bearer {token2}"})
    print(leagues.get_json()["leagues"])
    id = leagues.get_json()["leagues"][0]["id"]
    url = client.post("/api/league/geturl", headers={"Authorization": f"Bearer {token2}"}, json={"league_id" : id}).get_json()["code"]
    code = client.post("/api/league/getcode", headers={"Authorization": f"Bearer {token2}"}, json={"url" : url}).get_json()["code"]
    client.post("/api/league/join", headers={"Authorization": f"Bearer {token2}"}, json={
        "code": code,
        "name": "Team Beta"
    })

    # Create a matchup manually
    from app import Team, Matchup, TeamPlayer, TeamPlayerPerformance, Player

    with app.app_context():
        teams = Team.query.all()
        print(f"Teams: {len(teams)}")
        home, away = teams[0], teams[1]
        matchup = Matchup(league_id=home.league_id, week_num=1, home_team_id=home.id, away_team_id=away.id,
                          home_team_score=120.5, away_team_score=98.7)
        db.session.add(matchup)
        db.session.commit()

        player = Player(id="1111", sport="NFL", position="QB", team_name="Los Angeles Rams", last_name="Player", first_name="Test")
        # Add synthetic players + performance to home team
        team_player = TeamPlayer(team_id=home.id, league_id = id, player_id=player.id, starting_position="QB")
        db.session.add(player)
        db.session.commit()

        perf = TeamPlayerPerformance(week_num=1, league_id=home.league_id, player_id=player.id,
                                     fantasy_points=25.3, starting_position="QB")
        db.session.add(perf)
        db.session.commit()

        matchup_id = matchup.id
    # Hit the scoring endpoint
    code = client.post("/api/matchup/getcode", headers={"Authorization": f"Bearer {user_token}"}, json={
        "matchup_id" : matchup_id
    }).get_json()["code"]
    res = client.post("/api/matchup/details", headers={"Authorization": f"Bearer {user_token}"}, json={
        "matchup_code": code
    })

    assert res.status_code == 200
    data = res.get_json()
    assert "matchup" in data
    assert data["matchup"]["home_score"] == 120.5