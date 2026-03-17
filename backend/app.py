from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

from routes.voice   import voice_bp
from routes.health  import health_bp

def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret")
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    app.register_blueprint(voice_bp,  url_prefix="/api/voice")
    app.register_blueprint(health_bp, url_prefix="/api")
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=True)