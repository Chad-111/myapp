import json
from time import sleep
from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import create_access_token,get_jwt,get_jwt_identity, \
                               unset_jwt_cookies, jwt_required, JWTManager
from datetime import datetime, timedelta, timezone
from apscheduler.schedulers.background import BackgroundScheduler
import os
import bcrypt
import requests
from sqids import Sqids
from random import randint
from flask_mail import Mail, Message
from scraping import get_daily_stats, return_all_player_details, get_week_number, get_daily_games  # Ensure scraping.py is in the same directory or in the Python path
import requests
sqids = Sqids(min_length=7)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
first_request = True

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




def update_player_stats():
    with app.app_context():
        print("Updating player stats...")
        print(f"Task executed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        hockey_stats = get_daily_stats("hockey", "nhl")
        basketball_stats = get_daily_stats("basketball", "nba")
        football_stats = get_daily_stats("football", "nfl")
        baseball_stats = get_daily_stats("baseball", "mlb")  
        hockey_populated = False
        basketball_populated = False
        football_populated = False
        baseball_populated = False

        # Hockey handler
        count = 0
        if hockey_stats is not None:
            for player_id, stats in hockey_stats["stats"].items():
                player = Player.query.filter_by(id=player_id).first()
                if player:
                    daily_stats = DailyStatsHockey.query.filter_by(player_id=player_id, date=datetime.now().date()).first()
                    if not daily_stats:
                        daily_stats = DailyStatsHockey(player_id=player_id, date=datetime.now().date(), **stats)
                        db.session.add(daily_stats)
                    for key, value in stats.items():
                        setattr(daily_stats, key, value)
                    db.session.commit()
                else:
                    count += 1
                    print(f"Player with ID {player_id} not found in the database: count: {count}")
                    
                    if not hockey_populated:
                        populate_player_table("nhl")

                    hockey_populated = True
                    player = Player.query.filter_by(id=player_id).first()
                    # redo insertion
                    if player:
                        daily_stats = DailyStatsHockey.query.filter_by(player_id=player_id, date=datetime.now().date()).first()
                        if not daily_stats:
                            daily_stats = DailyStatsHockey(player_id=player_id, date=(datetime.now() - timedelta(days=1)).date(), **stats)
                            db.session.add(daily_stats)
                        for key, value in stats.items():
                            setattr(daily_stats, key, value)
                        db.session.commit()
        if basketball_stats is not None:
            for player_id, stats in basketball_stats["stats"].items():
                print(player_id)
                player = Player.query.filter_by(id=player_id).first()
                if player:
                    daily_stats = DailyStatsBasketball.query.filter_by(player_id=player_id, date=datetime.now().date()).first()
                    if not daily_stats:
                        daily_stats = DailyStatsBasketball(player_id=player_id, date=(datetime.now()).date(), **stats)
                        db.session.add(daily_stats)
                    for key, value in stats.items():
                        setattr(daily_stats, key, value)
                    db.session.commit()
                else:
                    count += 1
                    print(f"Player with ID {player_id} not found in the database: count: {count}")
                    if not basketball_populated:
                        populate_player_table("nba")
                    
                    basketball_populated = True
                    player = Player.query.filter_by(id=player_id).first()
                    # redo insertion
                    if player:
                        daily_stats = DailyStatsBasketball.query.filter_by(player_id=player_id, date=(datetime.now()).date()).first()
                        if not daily_stats:
                            daily_stats = DailyStatsBasketball(player_id=player_id, date=datetime.now().date(), **stats)
                            db.session.add(daily_stats)
                        for key, value in stats.items():
                            setattr(daily_stats, key, value)
                        db.session.commit()
        if football_stats is not None:
            for player_id, stats in football_stats["stats"].items():
                player = Player.query.filter_by(id=player_id).first()
                if player:
                    weekly_stats = WeeklyStatsFootball.query.filter_by(player_id=player_id, week_num=get_week_number(2025, "football", "nfl")).first()
                    if not weekly_stats:
                        weekly_stats = WeeklyStatsFootball(player_id=player_id, week_num=get_week_number(2025, "football", "nfl"), **stats)
                        db.session.add(weekly_stats)
                    for key, value in stats.items():
                        setattr(weekly_stats, key, value)
                    db.session.commit()
                else:
                    count += 1
                    print(f"Player with ID {player_id} not found in the database: count: {count}")
                    if not football_populated:
                        populate_player_table("nfl")
                    
                    football_populated = True
                    player = Player.query.filter_by(id=player_id).first()
                    # redo insertion
                    if player:
                        weekly_stats = WeeklyStatsFootball.query.filter_by(player_id=player_id, week_num=get_week_number()).first()
                        if not weekly_stats:
                            weekly_stats = WeeklyStatsFootball(player_id=player_id, week_num=get_week_number(), **stats)
                            db.session.add(weekly_stats)
                        for key, value in stats.items():
                            setattr(weekly_stats, key, value)
                        db.session.commit()
        if baseball_stats is not None:
            for player_id, stats in baseball_stats["stats"].items():
                player = Player.query.filter_by(id=player_id).first()
                if player:
                    daily_stats = DailyStatsBaseball.query.filter_by(player_id=player_id, date=datetime.now().date()).first()
                    if not daily_stats:
                        daily_stats = DailyStatsBaseball(player_id=player_id, date=datetime.now().date(), **stats)
                        db.session.add(daily_stats)
                    for key, value in stats.items():
                        setattr(daily_stats, key, value)
                    db.session.commit()
                else:
                    count += 1
                    print(f"Player with ID {player_id} not found in the database: count: {count}")
                    if not baseball_populated:
                        populate_player_table("mlb")
                    
                    baseball_populated = True
                    player = Player.query.filter_by(id=player_id).first()
                    # redo insertion
                    if player:
                        daily_stats = DailyStatsBaseball.query.filter_by(player_id=player_id, date=datetime.now().date()).first()
                        if not daily_stats:
                            daily_stats = DailyStatsBaseball(player_id=player_id, date=datetime.now().date(), **stats)
                            db.session.add(daily_stats)
                        for key, value in stats.items():
                            setattr(daily_stats, key, value)
                        db.session.commit()
    
    print(f"Count of players not found in the database: {count}")
        
def clean_up_daily_data():
    pass

scheduler = BackgroundScheduler()
scheduler.add_job(func=update_player_stats, trigger="interval", minutes=20)
scheduler.add_job(func=clean_up_daily_data, trigger="interval", days=1)

@app.before_request
def start_scheduler():
    global first_request
    if first_request:
        # Code to be executed before the first request
        print("Scheduler started")
        first_request = False
        scheduler.start()
    

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
    football_ruleset_id = db.Column(db.Integer, db.ForeignKey('rulesets_football.id'), nullable=True)
    basketball_ruleset_id = db.Column(db.Integer, db.ForeignKey('rulesets_basketball.id'), nullable=True)
    baseball_ruleset_id = db.Column(db.Integer, db.ForeignKey('rulesets_baseball.id'), nullable=True)
    hockey_ruleset_id = db.Column(db.Integer, db.ForeignKey('rulesets_hockey.id'), nullable=True)
    draft_time = db.Column(db.DateTime, nullable=True)  # Draft time for the league

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
    player_id = db.Column(db.String(20), db.ForeignKey("players.id"), primary_key=True)
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

class RulesetFootball(db.Model):
    __tablename__ = 'rulesets_football'
    id = db.Column(db.Integer, primary_key=True)
    points_passtd = db.Column(db.Float, default=4.0)  # Passing TD
    points_passyd = db.Column(db.Float, default=0.04)  # Passing yard
    points_2pt_passtd = db.Column(db.Float, default=2.0)  # 2-point conversion (pass)
    points_2pt_rushtd = db.Column(db.Float, default=2.0)  # 2-point conversion (rush)
    points_2pt_rectd = db.Column(db.Float, default=2.0)  # 2-point conversion (rec)
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
    points_2pt_rushtd = db.Column(db.Float, default=2.0)  # 2-point conversion (rush)
    points_2pt_rectd = db.Column(db.Float, default=2.0)  # 2-point conversion (rec)
    points_2pt_passtd = db.Column(db.Float, default=2.0)  # 2-point conversion (pass)

class RulesetBasketball(db.Model):
    __tablename__ = 'rulesets_basketball'
    id = db.Column(db.Integer, primary_key=True)
    points_point = db.Column(db.Float, default=1.0)  # Points scored
    points_rebound = db.Column(db.Float, default=1.2)  # Rebound
    points_assist = db.Column(db.Float, default=1.5)  # Assist
    points_steal = db.Column(db.Float, default=3.0)  # Steal
    points_block = db.Column(db.Float, default=3.0)  # Block
    points_turnover = db.Column(db.Float, default=-1.0)  # Turnover
    points_three_pointer = db.Column(db.Float, default=0.5)  # 3PT bonus
    points_double_double = db.Column(db.Float, default=1.5)  # Double-double bonus
    points_triple_double = db.Column(db.Float, default=3.0)  # Triple-double bonus

class RulesetBaseball(db.Model):
    __tablename__ = 'rulesets_baseball'
    id = db.Column(db.Integer, primary_key=True)
    points_hit = db.Column(db.Float, default=1.0)  # Single
    points_home_run = db.Column(db.Float, default=4.0)  # Home run
    points_rbi = db.Column(db.Float, default=1.0)  # Run Batted In
    points_run = db.Column(db.Float, default=1.0)  # Run scored
    points_walk = db.Column(db.Float, default=0.5)  # Walk (BB)
    points_strikeout = db.Column(db.Float, default=-0.5)  # Batter strikeout
    points_sb = db.Column(db.Float, default=2.0)  # Stolen base
    points_cs = db.Column(db.Float, default=-1.0)  # Caught stealing
    points_ip = db.Column(db.Float, default=1.0)  # Inning pitched
    points_pitcher_strikeout = db.Column(db.Float, default=1.0)  # Pitcher strikeout
    points_win = db.Column(db.Float, default=5.0)  # Pitching win
    points_save = db.Column(db.Float, default=5.0)  # Save
    points_earned_run = db.Column(db.Float, default=-2.0)  # Earned run allowed

class RulesetHockey(db.Model):
    __tablename__ = 'rulesets_hockey'
    id = db.Column(db.Integer, primary_key=True)
    points_goal = db.Column(db.Float, default=3.0)  # Goal
    points_assist = db.Column(db.Float, default=2.0)  # Assist
    points_shot = db.Column(db.Float, default=0.5)  # Shot on goal
    points_hit = db.Column(db.Float, default=0.5)  # Hit
    points_block = db.Column(db.Float, default=0.5)  # Blocked shot
    points_pp_point = db.Column(db.Float, default=0.5)  # Power Play point
    points_sh_point = db.Column(db.Float, default=1.0)  # Short-handed point
    points_shutout = db.Column(db.Float, default=4.0)  # Goalie shutout
    points_goal_against = db.Column(db.Float, default=-1.0)  # Goal allowed
    points_save = db.Column(db.Float, default=0.2)  # Goalie save


class Player(db.Model):
    __tablename__ = 'players'
    id = db.Column(db.String(20), primary_key=True)
    sport = db.Column(db.String(15), nullable=False)
    position = db.Column(db.String(3), nullable=False)
    team_name = db.Column(db.String, default="FA")
    last_name = db.Column(db.String, nullable=False)
    first_name = db.Column(db.String, nullable=False)

class WeeklyStatsFootball(db.Model):
    __tablename__ = 'weekly_stats_football'
    week_num = db.Column(db.Integer, nullable=False, primary_key=True)
    player_id = db.Column(db.String(20), db.ForeignKey("players.id"), nullable=False, primary_key=True)
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
    rushing_2pt = db.Column(db.Integer, default=0)
    receiving_2pt = db.Column(db.Integer, default=0)
    passing_2pt = db.Column(db.Integer, default=0)

    def calculate_fantasy_points(self, ruleset: dict):
        points_allowed = self.points_allowed or 0
        if points_allowed == 0:
            pa_score = ruleset.get('points_shutout', 0)
        elif 1 <= points_allowed <= 6:
            pa_score = ruleset.get('points_1_6_pa', 0)
        elif 7 <= points_allowed <= 13:
            pa_score = ruleset.get('points_7_13_pa', 0)
        elif 14 <= points_allowed <= 20:
            pa_score = ruleset.get('points_14_20_pa', 0)
        elif 21 <= points_allowed <= 27:
            pa_score = ruleset.get('points_21_27_pa', 0)
        elif 28 <= points_allowed <= 34:
            pa_score = ruleset.get('points_28_34_pa', 0)
        else:
            pa_score = ruleset.get('points_35plus_pa', 0)

        return (
            self.passing_tds * ruleset.get('points_passtd', 0) +
            self.passing_yds * ruleset.get('points_passyd', 0) +
            self.interceptions * ruleset.get('points_int', 0) +
            self.rushing_tds * ruleset.get('points_rushtd', 0) +
            self.rushing_yds * ruleset.get('points_rushyd', 0) +
            self.receiving_tds * ruleset.get('points_rectd', 0) +
            self.receiving_yds * ruleset.get('points_recyd', 0) +
            self.receptions * ruleset.get('points_reception', 0) +
            self.fumbles_lost * ruleset.get('points_fumble', 0) +
            self.sacks * ruleset.get('points_sack', 0) +
            self.interceptions_def * ruleset.get('points_int_def', 0) +
            self.fumbles_recovered * ruleset.get('points_fumble_def', 0) +
            self.safeties * ruleset.get('points_safety', 0) +
            self.defensive_tds * ruleset.get('points_def_td', 0) +
            self.blocked_kicks * ruleset.get('points_block_kick', 0) +
            pa_score +
            self.kick_return_tds * ruleset.get('points_kick_return_td', 0) +
            self.punt_return_tds * ruleset.get('points_punt_return_td', 0) +
            self.fg_made_0_39 * ruleset.get('points_fg_0_39', 0) +
            self.fg_made_40_49 * ruleset.get('points_fg_40_49', 0) +
            self.fg_made_50plus * ruleset.get('points_fg_50plus', 0) +
            self.fg_missed * ruleset.get('points_fg_miss', 0) +
            self.xp_made * ruleset.get('points_xp', 0) +
            self.xp_missed * ruleset.get('points_xp_miss', 0) + 
            self.rushing_2pt * ruleset.get('points_2pt_rushtd', 0) +
            self.receiving_2pt * ruleset.get('points_2pt_rectd', 0) +
            self.passing_2pt * ruleset.get('points_2pt_passtd', 0)
        )


class DailyStatsHockey(db.Model):
    __tablename__ = 'daily_stats_hockey'
    date = db.Column(db.Date, nullable=False, primary_key=True)
    player_id = db.Column(db.String(20), db.ForeignKey("players.id"), nullable=False, primary_key=True)

    goals = db.Column(db.Integer, default=0)
    assists = db.Column(db.Integer, default=0)
    shots_on_goal = db.Column(db.Integer, default=0)
    blocks = db.Column(db.Integer, default=0)
    hits = db.Column(db.Integer, default=0)
    power_play_points = db.Column(db.Integer, default=0)
    short_handed_points = db.Column(db.Integer, default=0)
    saves = db.Column(db.Integer, default=0)
    goals_against = db.Column(db.Integer, default=0)
    shutouts = db.Column(db.Integer, default=0)
    wins = db.Column(db.Integer, default=0)

    def calculate_fantasy_points(self, ruleset: dict):
        return (
            self.goals * ruleset.get('points_goal', 0) +
            self.assists * ruleset.get('points_assist', 0) +
            self.shots_on_goal * ruleset.get('points_sog', 0) +
            self.blocks * ruleset.get('points_block', 0) +
            self.hits * ruleset.get('points_hit', 0) +
            self.power_play_points * ruleset.get('points_ppp', 0) +
            self.short_handed_points * ruleset.get('points_shp', 0) +
            self.saves * ruleset.get('points_save', 0) +
            self.goals_against * ruleset.get('points_goal_against', 0) +
            self.shutouts * ruleset.get('points_shutout', 0)
        )


class DailyStatsBasketball(db.Model):
    __tablename__ = 'daily_stats_basketball'
    date = db.Column(db.Date, nullable=False, primary_key=True)
    player_id = db.Column(db.String(20), db.ForeignKey("players.id"), nullable=False, primary_key=True)

    points = db.Column(db.Integer, default=0)
    rebounds = db.Column(db.Integer, default=0)
    assists = db.Column(db.Integer, default=0)
    steals = db.Column(db.Integer, default=0)
    blocks = db.Column(db.Integer, default=0)
    turnovers = db.Column(db.Integer, default=0)
    three_pointers_made = db.Column(db.Integer, default=0)
    double_doubles = db.Column(db.Integer, default=0)
    triple_doubles = db.Column(db.Integer, default=0)

    def calculate_fantasy_points(self, ruleset: dict):
        return (
            self.points * ruleset.get('points_point', 0) +
            self.rebounds * ruleset.get('points_rebound', 0) +
            self.assists * ruleset.get('points_assist', 0) +
            self.steals * ruleset.get('points_steal', 0) +
            self.blocks * ruleset.get('points_block', 0) +
            self.turnovers * ruleset.get('points_turnover', 0) +
            self.three_pointers_made * ruleset.get('points_three_pm', 0) +
            self.double_doubles * ruleset.get('points_double_double', 0) +
            self.triple_doubles * ruleset.get('points_triple_double', 0)
        )


class DailyStatsBaseball(db.Model):
    __tablename__ = 'daily_stats_baseball'
    date = db.Column(db.Date, nullable=False, primary_key=True)
    player_id = db.Column(db.String(20), db.ForeignKey("players.id"), nullable=False, primary_key=True)

    runs = db.Column(db.Integer, default=0)
    hits = db.Column(db.Integer, default=0)
    home_runs = db.Column(db.Integer, default=0)
    rbis = db.Column(db.Integer, default=0)
    walks = db.Column(db.Integer, default=0)
    strikeouts = db.Column(db.Integer, default=0)
    stolen_bases = db.Column(db.Integer, default=0)
    caught_stealing = db.Column(db.Integer, default=0)
    wins = db.Column(db.Integer, default=0)
    quality_starts = db.Column(db.Integer, default=0)
    saves = db.Column(db.Integer, default=0)
    innings_pitched = db.Column(db.Float, default=0.0)
    earned_runs = db.Column(db.Integer, default=0)
    pitching_strikeouts = db.Column(db.Integer, default=0)

    def calculate_fantasy_points(self, ruleset: dict):
        return (
            self.runs * ruleset.get('points_run', 0) +
            self.hits * ruleset.get('points_hit', 0) +
            self.home_runs * ruleset.get('points_home_run', 0) +
            self.rbis * ruleset.get('points_rbi', 0) +
            self.walks * ruleset.get('points_walk', 0) +
            self.strikeouts * ruleset.get('points_strikeout', 0) +
            self.stolen_bases * ruleset.get('points_sb', 0) +
            self.caught_stealing * ruleset.get('points_cs', 0) +
            self.wins * ruleset.get('points_win', 0) +
            self.quality_starts * ruleset.get('points_quality_start', 0) +
            self.saves * ruleset.get('points_save', 0) +
            self.innings_pitched * ruleset.get('points_inning_pitched', 0) +
            self.earned_runs * ruleset.get('points_earned_run', 0) +
            self.pitching_strikeouts * ruleset.get('points_pitching_strikeout', 0)
        )



class TeamPlayerPerformance(db.Model):
    __tablename__ = 'team_player_performances'
    week_num = db.Column(db.Integer, nullable=False, primary_key=True)
    player_id = db.Column(db.String(20), db.ForeignKey("players.id"), primary_key=True)
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

SPORTS_PATHS = {
    "nhl": "hockey/nhl",
    "nba": "basketball/nba",
    "nfl": "football/nfl",
    "mlb": "baseball/mlb",
    "golf": "golf/pga",
    "ncaaf": "football/college-football",
    "ncaa_mbb": "basketball/mens-college-basketball",
}

@app.route("/api/auth/me", methods=["GET"])
@cross_origin(origin="*")
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    return jsonify({"id": user_id}), 200


@app.route("/api/scoreboard")
def get_scoreboard():
    sport_key = request.args.get("sport")
    dates = request.args.get("dates")

    if not sport_key or not dates:
        return jsonify({"error": "Missing required parameters"}), 400

    sport_path = SPORTS_PATHS.get(sport_key)
    if not sport_path:
        return jsonify({"error": "Invalid sport key"}), 400

    url = f"https://site.api.espn.com/apis/site/v2/sports/{sport_path}/scoreboard?dates={dates}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/news")
def get_news():
    sport_key = request.args.get("sport")
    sport_path = SPORTS_PATHS.get(sport_key)

    if not sport_path:
        return jsonify({"error": "Invalid sport key"}), 400

    url = f"https://site.api.espn.com/apis/site/v2/sports/{sport_path}/news"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/summary")
def get_game_summary():
    sport_key = request.args.get("sport")
    game_id = request.args.get("gameId")

    if not sport_key or not game_id:
        return jsonify({"error": "Missing required parameters"}), 400

    sport_path = SPORTS_PATHS.get(sport_key)
    if not sport_path:
        return jsonify({"error": "Invalid sport key"}), 400

    url = f"https://site.api.espn.com/apis/site/v2/sports/{sport_path}/summary?event={game_id}"
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# user search for league root
@app.route("/api/league/search", methods=["POST"])
@cross_origin(origin="*")
@jwt_required()
def league_search():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    id = get_jwt_identity()

    teams = Team.query.filter_by(owner_id=id).all()
    response = []
    for team in teams:
        league = League.query.filter_by(id=team.league_id).first()
        if league:
            response.append({
                "id": team.id,
                "name": team.name,
                "league_id": team.league_id,
                "league_rank": team.rank,
                "wins": team.wins,
                "losses": team.losses,
                "sport": league.sport,
                "league_name": league.name
            })

    return jsonify({"message": response}), 200


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

@app.route("/api/league/joinable", methods=["POST"])
@cross_origin(origin="*")
@jwt_required()
def get_joinable_leagues():
    user_id = get_jwt_identity()

    # Leagues the user already joined
    user_team_league_ids = db.session.query(Team.league_id).filter_by(owner_id=user_id).subquery()

    # Leagues user is not already in
    joinable_leagues = League.query.filter(~League.id.in_(user_team_league_ids)).all()

    response = [
        {
            "id": league.id,
            "name": league.name,
            "sport": league.sport,
            "commissioner": User.query.get(league.commissioner_id).username
        }
        for league in joinable_leagues
    ]

    return jsonify({"leagues": response}), 200


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
    team_data = [{"id": team.id, "name": team.name, "league_id": team.league_id, "league_rank" : team.rank, "owner_id": User.query.get(team.owner_id).username, "wins" : team.wins, "losses" : team.losses} for team in Team.query.filter_by(league_id=id).order_by(Team.rank).all()]
    
    league = League.query.filter_by(id=id).one()
    league_data = {"name" : league.name, "sport" : league.sport, "num_teams" : Team.query.filter_by(league_id=id).count(), "commissioner" : league.commissioner_id}
    return jsonify({"teams" : team_data, "league": league_data}), 200

@app.route("/api/league/verify_commissioner", methods=["POST"])
@cross_origin(origin='*')
@jwt_required()
def verify_commissioner():
    data = request.json
    if not data or "code" not in data:
        return jsonify({"error": "Missing code"}), 400

    user_id = get_jwt_identity()
    league_id = sqids.decode(data["code"])[0]

    league = League.query.filter_by(id=league_id).first()
    if not league:
        return jsonify({"error": "League not found"}), 404

    if league.commissioner_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    return jsonify({"message": "Authorized"}), 200


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

# def get_player_list(sport : str):
#     if Player.query.filter_by(sport=sport).count() == 0:
#         populate_player_table(sport)
    
#     return [dict(player) for player in Player.query.filter_by(sport=sport).all()]

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
            new_player = Player(id=player.get('id'), position=player.get('position'), team_name=player.get('team'), last_name=player.get('last_name'), first_name=player.get('first_name'), sport=sport)
            existing_player.position = new_player.position
            existing_player.team_name = new_player.team_name
            existing_player.last_name = new_player.last_name
            existing_player.first_name = new_player.first_name
            existing_player.sport = new_player.sport
        
    db.session.commit()

if __name__ == '__main__':
    # create_all does not update tables if they are already in the database, so this should be here for first run
    sleep(2)
    with app.app_context():
        db.create_all()
        update_player_stats()
    app.run(host='0.0.0.0', port=5000)
    
