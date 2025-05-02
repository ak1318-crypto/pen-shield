import os, logging, json, requests, re
from datetime import datetime
from flask import Flask, request, jsonify, make_response, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret-key")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///users.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

CORS(app,
     resources={r"/*": {"origins": os.environ.get("FRONTEND_URL", "http://127.0.0.1:5500")}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)

class ScanResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    url = db.Column(db.String(2083), nullable=False)
    status_code = db.Column(db.Integer, nullable=False)
    response_time = db.Column(db.Float, nullable=False)
    risk = db.Column(db.String(20), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    headers = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

with app.app_context():
    db.create_all()

def is_valid_url(url):
    pattern = re.compile(r'^https?://[^\s/$.?#].[^\s]*$')
    return bool(pattern.match(url))

@app.route("/")
def index():
    return render_template("home.html")

@app.route("/login.html")
def login_page():
    return render_template("login.html")

@app.route("/register.html")
def register_page():
    return render_template("register.html")

@app.route("/scanner.html")
@jwt_required(optional=True)
def scanner_page():
    return render_template("scanner.html")

@app.route("/hub.html")
@jwt_required(optional=True)
def hub_page():
    return render_template("hub.html")

@app.route("/management.html")
@jwt_required(optional=True)
def management_page():
    return render_template("management.html")

@app.route("/dashboard.html")
@jwt_required(optional=True)
def dashboard_page():
    return render_template("dashboard.html")

@app.route("/help.html")
def help_page():
    return render_template("help.html")

@app.route("/cookies.html")
def cookies_page():
    return render_template("cookies.html")

@app.route("/graph.html")
@jwt_required(optional=True)
def graph_page():
    return render_template("graph.html")

@app.route("/register", methods=["OPTIONS", "POST"])
def register():
    if request.method == "OPTIONS": return make_response(), 200
    data = request.json or {}
    u, p = data.get("username", "").strip(), data.get("password", "").strip()
    if not u or not p:
        return jsonify(msg="Username & password required"), 400
    if User.query.filter_by(username=u).first():
        return jsonify(msg="Username already exists"), 400
    hashed = bcrypt.generate_password_hash(p).decode()
    db.session.add(User(username=u, password=hashed))
    db.session.commit()
    return jsonify(msg="Registered!"), 201

@app.route("/login", methods=["OPTIONS", "POST"])
def login():
    if request.method == "OPTIONS": return make_response(), 200
    data = request.json or {}
    user = User.query.filter_by(username=data.get("username")).first()
    if not user or not bcrypt.check_password_hash(user.password, data.get("password", "")):
        return jsonify(msg="Bad credentials"), 401
    token = create_access_token(identity=str(user.id))
    return jsonify(access_token=token), 200

@app.route("/profile", methods=["OPTIONS", "PUT", "DELETE"])
@jwt_required()
def profile():
    if request.method == "OPTIONS": return make_response(), 200
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user: return jsonify(msg="User not found"), 404

    if request.method == "DELETE":
        ScanResult.query.filter_by(user_id=uid).delete()
        db.session.delete(user)
        db.session.commit()
        return jsonify(msg="Account deleted"), 200

    data = request.json or {}
    new_u, new_p = data.get("username", "").strip(), data.get("password", "").strip()
    if not new_u and not new_p:
        return jsonify(msg="Nothing to update"), 400
    if new_u:
        if User.query.filter_by(username=new_u).first():
            return jsonify(msg="Username taken"), 400
        user.username = new_u
    if new_p:
        user.password = bcrypt.generate_password_hash(new_p).decode()
    db.session.commit()
    return jsonify(msg="Profile updated"), 200

@app.route("/scan", methods=["OPTIONS", "POST"])
@jwt_required()
def scan():
    if request.method == "OPTIONS": return make_response(), 200
    raw = (request.json or {}).get("url", "").strip()
    if not raw:
        return jsonify(msg="No URL provided"), 400
    if not raw.startswith(("http://", "https://")):
        raw = "http://" + raw
    if not is_valid_url(raw):
        return jsonify(msg="Invalid URL format"), 400

    try:
        resp = requests.get(raw, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        return jsonify(msg=f"Request failed: {e}"), 502

    scode = resp.status_code
    rtime = round(resp.elapsed.total_seconds(), 3)
    notes = "OK" if scode < 400 else "Error"

    CHECK_HEADERS = [
        "Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options",
        "Strict-Transport-Security", "Referrer-Policy", "Permissions-Policy", "X-XSS-Protection"
    ]
    present = [h for h in CHECK_HEADERS if any(k.lower() == h.lower() for k in resp.headers)]
    missing = len(CHECK_HEADERS) - len(present)
    risk = "Low" if missing == 0 else ("Medium" if missing <= 3 else "High")

    scan = ScanResult(
        user_id=int(get_jwt_identity()),
        url=raw, status_code=scode, response_time=rtime,
        risk=risk, notes=notes,
        headers=json.dumps({k: str(v) for k, v in resp.headers.items()})
    )
    db.session.add(scan)
    db.session.commit()

    return jsonify(scan_result={
        "url": raw, "status_code": scode, "response_time": rtime,
        "risk": risk, "notes": notes,
        "security_headers": {"checked": CHECK_HEADERS, "present": present}
    }), 200

@app.route("/save_scan", methods=["OPTIONS", "POST"])
@jwt_required()
def save_scan():
    if request.method == "OPTIONS": return make_response(), 200
    data = request.json or {}
    required_fields = ["url", "status_code", "response_time", "risk", "notes", "headers"]
    for field in required_fields:
        if field not in data:
            return jsonify(msg=f"Missing required field: {field}"), 400

    try:
        scan = ScanResult(
            user_id=int(get_jwt_identity()),
            url=data["url"],
            status_code=int(data["status_code"]),
            response_time=float(data["response_time"]),
            risk=data["risk"],
            notes=data["notes"],
            headers=json.dumps(data["headers"])
        )
        db.session.add(scan)
        db.session.commit()
        return jsonify(msg="Scan saved successfully"), 200
    except Exception as e:
        return jsonify(msg=f"Failed to save scan: {e}"), 500

@app.route("/my_scans", methods=["OPTIONS", "GET"])
@jwt_required()
def my_scans():
    if request.method == "OPTIONS": return make_response(), 200
    uid = int(get_jwt_identity())
    rows = ScanResult.query.filter_by(user_id=uid).order_by(ScanResult.timestamp.desc()).all()
    return jsonify([{
        "id": r.id, "url": r.url, "status_code": r.status_code,
        "response_time": r.response_time, "risk": r.risk,
        "notes": r.notes, "timestamp": r.timestamp.isoformat()
    } for r in rows]), 200

@app.route("/scan/<int:scan_id>", methods=["OPTIONS", "DELETE"])
@jwt_required()
def delete_scan(scan_id):
    if request.method == "OPTIONS": return make_response(), 200
    uid = int(get_jwt_identity())
    r = ScanResult.query.filter_by(id=scan_id, user_id=uid).first()
    if not r: return jsonify(msg="Not found"), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify(msg="Deleted"), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
