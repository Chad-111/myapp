from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager

import os
import bcrypt

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# 🔐 Security settings (change for production)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False  # Set to False if testing locally, True in production

# 🔗 Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://admin:password@postgres:5432/draftempire")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "please-remember-to-change-me"

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
    users = db.relationship('User', backref=db.backref('leagues', lazy='dynamic'))

class Team(db.Model):
    __tablename__ = 'teams'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)

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

    return jsonify({"message": "User created successfully"}), 201

# 🔹 User Login Route
@app.route("/api/login", methods=["POST"])
@cross_origin(origin='*')
def login():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Find user by email
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 400

    # Check if password matches
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({"error": "Invalid credentials"}), 400

    # Give validated user token
    access_token = create_access_token(identity=email)
    response = {"access_token" : access_token, "message": "Login successful"}

    return response, 201

@app.route("/api/logout", methods = ["POST"])
@cross_origin(origin="*")
def logout():
    response = jsonify({"message": "Logout successful."})
    unset_jwt_cookies(response)
    return response, 201

if __name__ == '__main__':

    app.run(host='0.0.0.0', port=5000)
