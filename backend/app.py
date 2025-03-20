from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
import bcrypt

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# 🔐 Security settings (change for production)
app.secret_key = os.getenv("SECRET_KEY", "your-secret-key")
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SECURE"] = False  # ❌ Set to False if testing locally, True in production

# 🔗 Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://admin:password@postgres:5432/draftempire")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)  # Add Migrate

# 👤 User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # Hashed password

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
