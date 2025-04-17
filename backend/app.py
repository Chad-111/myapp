import json
from time import sleep
from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager
from datetime import datetime, timedelta, timezone
import os
import bcrypt
from sqids import Sqids
from random import randint
from flask_mail import Mail, Message
from scraping import return_all_player_details  # Ensure scraping.py is in the same directory or in the Python path
sqids = Sqids(min_length=7)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

last_refresh = datetime.now() - timedelta(hours = 1)
# 🔐 Security settings (change for production)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False  # Set to False if testing locally, True in production

# 🔗 Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://admin:password@postgres:5432/draftempire")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1) # can edit at will
app.config['JWT_VERIFY_SUB'] = False # to fix problems w logout

app.config['MAIL_SERVER'] = 'in-v3.mailjet.com'  # Or your provider
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_USER", "1f82b8b334c0602b2171b756159205a8")
app.config['MAIL_PASSWORD'] = os.getenv("EMAIL_PASS", "b235065e0131153e7b292b88e6a0df74")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("EMAIL_USER", "donotreply@draftempire.win")

mail = Mail(app)

db = SQLAlchemy(app)   

migrate = Migrate(app, db)  # Add Migrate

jwt = JWTManager(app)

# 👤 User Model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # Hashed password


class League(db.Model):
    __tablename__ = 'leagues'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    commissioner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sport = db.Column(db.String(15), nullable=False)

class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    rank = db.Column(db.Integer, default=1)

class TeamPlayer(db.Model):
    __tablename__ = 'team_players'
    player_id = db.Column(db.Integer, db.ForeignKey("players.id"), primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey("leagues.id"), primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    starting_position = db.Column(db.String(3), default="BEN")  # bench default

class Matchup(db.Model):
    __tablename__ = 'matchups'
    id = db.Column(db.Integer, primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey("leagues.id"))
    week_num = db.Column(db.Integer, default=1)
    away_team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    away_team_score = db.Column(db.Float, default=0)
    home_team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    home_team_score = db.Column(db.Float, default=0)

class Ruleset(db.Model):
    __tablename__ = 'rulesets'
    league_id = db.Column(db.Integer, db.ForeignKey("leagues.id"), primary_key=True)
    points_passtd = db.Column(db.Float, default=4.0)  # Passing TD
    points_passyd = db.Column(db.Float, default=0.04)  # Passing yard
    points_int = db.Column(db.Float, default=-2.0)  # Interception
    points_rushtd = db.Column(db.Float, default=6.0)  # Rushing TD
    points_rushyd = db.Column(db.Float, default=0.1)  # Rushing yard
    points_rectd = db.Column(db.Float, default=6.0)  # Receiving TD
    points_recyd = db.Column(db.Float, default=0.1)  # Receiving yard
    points_reception = db.Column(db.Float, default=1.0)  # PPR (Points Per Reception)
    points_fumble = db.Column(db.Float, default=-2.0)  # Fumble lost
    points_sack = db.Column(db.Float, default=1.0)  # Sack
    points_int_def = db.Column(db.Float, default=2.0)  # Defensive interception
    points_fumble_def = db.Column(db.Float, default=2.0)  # Defensive fumble recovery
    points_safety = db.Column(db.Float, default=2.0)  # Safety
    points_def_td = db.Column(db.Float, default=6.0)  # Defensive TD
    points_block_kick = db.Column(db.Float, default=2.0)  # Blocked kick
    points_shutout = db.Column(db.Float, default=10.0)  # 0 points allowed
    points_1_6_pa = db.Column(db.Float, default=7.0)  # 1-6 points allowed
    points_7_13_pa = db.Column(db.Float, default=4.0)  # 7-13 points allowed
    points_14_20_pa = db.Column(db.Float, default=1.0)  # 14-20 points allowed
    points_21_27_pa = db.Column(db.Float, default=0.0)  # 21-27 points allowed
    points_28_34_pa = db.Column(db.Float, default=-1.0)  # 28-34 points allowed
    points_35plus_pa = db.Column(db.Float, default=-4.0)  # 35+ points allowed
    points_kick_return_td = db.Column(db.Float, default=6.0)  # Kick return TD
    points_punt_return_td = db.Column(db.Float, default=6.0)  # Punt return TD
    points_fg_0_39 = db.Column(db.Float, default=3.0)  # Field goal 0-39 yards
    points_fg_40_49 = db.Column(db.Float, default=4.0)  # Field goal 40-49 yards
    points_fg_50plus = db.Column(db.Float, default=5.0)  # Field goal 50+ yards
    points_fg_miss = db.Column(db.Float, default=-1.0)  # Missed FG
    points_xp = db.Column(db.Float, default=1.0)  # Extra point made
    points_xp_miss = db.Column(db.Float, default=-1.0)  # Missed extra point

class Player(db.Model):
    __tablename__ = 'players'
    id = db.Column(db.Integer, primary_key=True)
    sport = db.Column(db.String(15), nullable=False)
    position = db.Column(db.String(3), nullable=False)
    team_name = db.Column(db.String, default="FA")
    last_name = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)

class WeeklyStats(db.Model):
    __tablename__ = 'weekly_stats'
    week_num = db.Column(db.Integer, nullable=False, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.id"), nullable=False, primary_key=True)
    passing_tds = db.Column(db.Integer, default=0)
    passing_yds = db.Column(db.Integer, default=0)
    interceptions = db.Column(db.Integer, default=0)
    rushing_tds = db.Column(db.Integer, default=0)
    rushing_yds = db.Column(db.Integer, default=0)
    receiving_tds = db.Column(db.Integer, default=0)
    receiving_yds = db.Column(db.Integer, default=0)
    receptions = db.Column(db.Integer, default=0)
    fumbles_lost = db.Column(db.Integer, default=0)
    sacks = db.Column(db.Integer, default=0)
    interceptions_def = db.Column(db.Integer, default=0)
    fumbles_recovered = db.Column(db.Integer, default=0)
    safeties = db.Column(db.Integer, default=0)
    defensive_tds = db.Column(db.Integer, default=0)
    blocked_kicks = db.Column(db.Integer, default=0)
    points_allowed = db.Column(db.Integer, default=0)
    kick_return_tds = db.Column(db.Integer, default=0)
    punt_return_tds = db.Column(db.Integer, default=0)
    fg_made_0_39 = db.Column(db.Integer, default=0)
    fg_made_40_49 = db.Column(db.Integer, default=0)
    fg_made_50plus = db.Column(db.Integer, default=0)
    fg_missed = db.Column(db.Integer, default=0)
    xp_made = db.Column(db.Integer, default=0)
    xp_missed = db.Column(db.Integer, default=0)

class TeamPlayerPerformance(db.Model):
    __tablename__ = 'team_player_performances'
    week_num = db.Column(db.Integer, nullable=False, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey("players.id"), primary_key=True)
    league_id = db.Column(db.Integer, db.ForeignKey("leagues.id"), primary_key=True)
    starting_position = db.Column(db.String(3), default="BEN")
    fantasy_points = db.Column(db.Float, default=0)

class PasswordResetCode(db.Model):
    __tablename__ = 'password_reset_codes'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)


# ✅ API Routes
@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Flask Backend with PostgreSQL"})

@app.route("/api/", methods=["GET"])
def api_root():
    return jsonify({"message": "API Root - Available endpoints: /api/signup, /api/test"})

@app.route('/api/test', methods=['GET'])
def api_test():
    return jsonify({"message": "Hello from Flask!"})

# 🔹 User Signup Route (Improved)
@app.route("/api/signup", methods=["POST"])
@cross_origin(origin='*')
def signup():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "User already exists"}), 400

    # ✅ Hash the password before saving
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create new user
    new_user = User(username=username, email=email, password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully", "access_token" : create_access_token(identity=new_user.id)}), 201

@app.after_request
def refresh_expiring_jwts(response):
    try:
        exp_timestamp = get_jwt()["exp"]
        now = datetime.now(timezone.utc)
        target_timestamp = datetime.timestamp(now + timedelta(minutes=30))
        if target_timestamp > exp_timestamp:
            access_token = create_access_token(identity=get_jwt_identity())
            data = response.get_json()
            if type(data) is dict:
                data["access_token"] = access_token 
                response.data = json.dumps(data)
        return response
    except (RuntimeError, KeyError):
        # Case where there is not a valid JWT. Just return the original respone
        return response

# 🔹 User Login Route
@app.route("/api/login", methods=["POST"])
@cross_origin(origin='*')
def login():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Find user by email
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 400

    # Check if password matches
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 400

    # Give validated user token
    access_token = create_access_token(identity=user.id)
    response = {"access_token" : access_token, "message": "Login successful"}

    return response, 201

# user logout route
@app.route("/api/logout", methods = ["POST"])
@cross_origin(origin="*")
@jwt_required()
def logout():
    response = jsonify({"message": "Logout successful."})
    unset_jwt_cookies(response)
    return response, 201

# user search for league root
@app.route("/api/league/search", methods = ["POST"])
@cross_origin(origin="*")
@jwt_required()
def league_search():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    id = get_jwt_identity()
    return jsonify({"message" : [{"id": team.id, "name": team.name, "league_id": team.league_id, "league_rank" : team.rank, "league_name" : League.query.filter_by(id=team.league_id).one().name} for team in Team.query.filter_by(owner_id=id).all()]}), 201

@app.route("/api/league/create", methods=["POST"])
@cross_origin(origin='*')
@jwt_required()
def league_create():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    commissioner_id = get_jwt_identity()
    name = data.get("league_name")
    sport = data.get("sport")
    team_name = data.get("team_name")

    new_league = League(commissioner_id=commissioner_id, name=name, sport=sport)

    db.session.add(new_league)
    db.session.commit()

    league_id = new_league.id
    team = Team(owner_id=commissioner_id, league_id=league_id, name=team_name)
    db.session.add(team)
    db.session.commit()

    return jsonify({'message' : "League successfully created."}), 201


@app.route("/api/league/join", methods=["POST"])
@cross_origin(origin='*')
@jwt_required() 
def league_join():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    league_id, exptime = sqids.decode(data.get("code"))
    if (exptime < datetime.now().timestamp()):
        return jsonify({"error" : "Invite code expired."}), 403
    name = data.get("name")

    # Assume maximum 12 teams
    if Team.query.filter_by(league_id=league_id).count() >= 12:
        return jsonify({"error" : "This league is full."}), 403
    
    owner_id = get_jwt_identity()
    team = Team(owner_id = owner_id, league_id = league_id, name=name)
    db.session.add(team)
    db.session.commit()
    return jsonify({"message" : "League successfully joined."}), 201

@app.route("/api/league/geturl", methods=["POST"])
@cross_origin(origin='*')
@jwt_required()
def league_get_url():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    id = data.get("league_id")
    return jsonify({"message": "League URL successfully generated.", "code": sqids.encode([id])}), 201


@app.route("/api/league/getcode", methods=["POST"])
@cross_origin(origin='*')
@jwt_required()
def league_get_code():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    id = sqids.decode(data.get("url"))[0]
    exptime = int(datetime.now().timestamp()) + 7200
    code = sqids.encode([id, exptime])
    

    return jsonify({"message" : "League code generated.", "code" : code}), 201


@app.route("/api/league/getleague", methods=["POST"])
@cross_origin(origin='*')
@jwt_required()
def get_league():
    data = request.json
    print(data.get("code"))
    if not data:
        return jsonify({"error": "No data provided"}), 400

    id = sqids.decode(data.get("code"))[0]
    print(data.get("code"), id)
    team_data = [{"id": team.id, "name": team.name, "league_id": team.league_id, "league_rank" : team.rank} for team in Team.query.filter_by(league_id=id).order_by(Team.rank).all()]
    
    league = League.query.filter_by(id=id).one()
    league_data = {"name" : league.name, "sport" : league.sport, "num_teams" : Team.query.filter_by(league_id=id).count()}
    return jsonify({"teams" : team_data, "league": league_data}), 200

@app.route('/api/request-reset', methods=['POST'])
@cross_origin(origin='*')
def request_password_reset():
    data = request.json
    email = data.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No user found with that email"}), 404

    # delete any previous
    PasswordResetCode.query.filter_by(email=email).delete()
    code = f"{randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    db.session.add(PasswordResetCode(email=email, code=code, expires_at=expires_at))
    db.session.commit()

    # Send mail
    try:
        msg = Message(
    subject="Your DraftEmpire Password Reset Code",
    recipients=[email],
    html=f"""
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
        <h2 style="color: #5689f8;">Password Reset Requested</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your DraftEmpire account.</p>
        <p style="font-size: 20px; font-weight: bold; color: #333;">
            Your reset code is: <span style="color: #5689f8;">{code}</span>
        </p>
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 0.85rem; color: #888;">DraftEmpire Security Team</p>
    </div>
    """
    )
        mail.send(msg)
    except Exception as e:
        return jsonify({"error": "Failed to send email"}), 500

    return jsonify({"message": "Reset code sent to your email"}), 200


@app.route('/api/verify-reset-code', methods=['POST'])
@cross_origin(origin='*')
def verify_reset_code():
    data = request.json
    email = data.get('email')
    code = data.get('code')

    if not email or not code:
        return jsonify({"error": "Email and code are required"}), 400

    record = PasswordResetCode.query.filter_by(email=email, code=code).first()
    if not record:
        return jsonify({"error": "Invalid reset code"}), 400
    if datetime.utcnow() > record.expires_at:
        return jsonify({"error": "Reset code expired"}), 400

    return jsonify({"message": "Code verified"}), 200


@app.route('/api/reset-password', methods=['POST'])
@cross_origin(origin='*')
def reset_password():
    data = request.json
    email = data.get('email')
    new_password = data.get('new_password')

    if not email or not new_password:
        return jsonify({"error": "Email and new password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # update password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.password = hashed_password

    # cleanup
    PasswordResetCode.query.filter_by(email=email).delete()
    db.session.commit()

    return jsonify({"message": "Password updated successfully"}), 200

@app.route("/api/email/test", methods=["GET"])
def email_test():
    try:
        msg = Message(
            subject="Test from DraftEmpire",
            recipients=["chad.burkett@outlook.com"],  # change this to test
            body="✅ This is a test email from your Flask app via Mailjet!"
        )
        mail.send(msg)
        return jsonify({"message": "Test email sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def get_player_list(sport : str):
    if Player.query.filter_by(sport=sport).count() == 0:
        populate_player_table(sport)
    
    return [dict(player) for player in Player.query.filter_by(sport=sport).all()]

# Not applied now, but building general logic, will be ran on draft creation
# Draft objest should be dict with key as player_id and value as team_id.
def instantiate_players(league_id : int, sport : str, draft : dict):
    if Player.query.filter_by(sport=sport).count() == 0:
        populate_player_table(sport)
    
    if TeamPlayer.query.filter_by(league_id=league_id).count() != 0:
        raise Exception("League already has players.")

    # instantiate instance of all players
    for player in Player.query.filter_by(sport=sport).all():
        if player.id in draft.keys():
            new_player = TeamPlayer(player_id=player.id, league_id=league_id, team_id=draft[player.id])
        else:
            new_player = TeamPlayer(player_id=player.id, league_id=league_id)
        
        db.session.add(new_player)
    
    db.session.commit()

SPORTS = {"nhl": "hockey", "nfl": "football", "mlb": "baseball", "nba": "basketball"}

# Should populate the player table with all eligible players.
def populate_player_table(league : str):
    sport = SPORTS.get(league)
    if not sport:
        raise Exception("Invalid league specified.")

    player_data = return_all_player_details(sport, league)
    print(player_data)
    for player in player_data:
        if Player.query.filter_by(id=player.get('id')).count() == 0:
            new_player = Player(id=player.get('id'), position=player.get('position'), team_name=player.get('team'), last_name=player.get('last_name'), first_name=player.get('first_name'), sport=sport)
            db.session.add(new_player)
        else:
            existing_player = Player.query.filter_by(id=player.get('id')).first()
            db.session.delete(existing_player)
            db.session.commit()
            new_player = Player(id=player.get('id'), position=player.get('position'), team_name=player.get('team'), last_name=player.get('last_name'), first_name=player.get('first_name'), sport=sport)
            db.session.add(new_player)
        
    db.session.commit()







if __name__ == '__main__':
    # create_all does not update tables if they are already in the database, so this should be here for first run
    sleep(2)
    with app.app_context():
        db.create_all()
        print(get_player_list("nhl")) # for debug, for now
    app.run(host='0.0.0.0', port=5000)
