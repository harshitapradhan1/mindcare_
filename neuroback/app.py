from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import joblib
import numpy as np
import os
from datetime import datetime, timedelta
import logging
from werkzeug.utils import secure_filename
from werkzeug.middleware.proxy_fix import ProxyFix
import io
import base64
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.metrics.pairwise import cosine_similarity
import json
from functools import wraps
from cryptography.fernet import Fernet
import hashlib
import uuid

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gemini integration
try:
    import google.generativeai as genai
    genai.configure(api_key="AIzaSyDMCx9x2_Ddc7hViF4B_YOYa7GqSS2LtL0")
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed")

# PDF generation
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import inch
    import qrcode
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logger.warning("PDF generation libraries not installed")

# Optional heavy imports - app runs with fallbacks if missing
try:
    import onnxruntime as ort
    ONNXRUNTIME_AVAILABLE = True
except ImportError:
    ort = None
    ONNXRUNTIME_AVAILABLE = False
    logger.warning("onnxruntime not installed, speech model disabled")
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    librosa = None
    LIBROSA_AVAILABLE = False
    logger.warning("librosa not installed, audio analysis limited")
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    cv2 = None
    CV2_AVAILABLE = False
    logger.warning("opencv not installed, facial analysis limited")
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    Image = None
    PIL_AVAILABLE = False
    logger.warning("Pillow not installed, image processing limited")
# Report text extraction (PDF, DOCX)
try:
    import PyPDF2
    PDF_EXTRACT_AVAILABLE = True
except ImportError:
    PDF_EXTRACT_AVAILABLE = False
    logger.warning("PyPDF2 not installed, PDF upload disabled for Simplify Report")
try:
    from docx import Document as DocxDocument
    DOCX_EXTRACT_AVAILABLE = True
except ImportError:
    DocxDocument = None
    DOCX_EXTRACT_AVAILABLE = False
    logger.warning("python-docx not installed, DOCX upload disabled for Simplify Report")
# Speech recognition
try:
    import speech_recognition as sr
    SPEECH_REC_AVAILABLE = True
except ImportError:
    SPEECH_REC_AVAILABLE = False
    logger.warning("SpeechRecognition not installed")

# MongoDB setup (optional - falls back to in-memory if not available)
try:
    from pymongo import MongoClient
    MONGO_AVAILABLE = True
    try:
        mongo_client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'), serverSelectionTimeoutMS=2000)
        mongo_client.server_info()  # Test connection
        db = mongo_client['neuro nest']
        logger.info("MongoDB connected successfully")
    except Exception as e:
        logger.warning(f"MongoDB not available, using in-memory storage: {e}")
        MONGO_AVAILABLE = False
        db = None
except ImportError:
    logger.warning("pymongo not installed, using in-memory storage")
    MONGO_AVAILABLE = False
    db = None

# Stripe setup
try:
    import stripe
    STRIPE_AVAILABLE = True
    stripe.api_key = os.getenv('STRIPE_SECRET_KEY', '')
    if not stripe.api_key:
        logger.warning("Stripe API key not set. Payment features will be disabled.")
        STRIPE_AVAILABLE = False
    else:
        logger.info("Stripe initialized successfully")
except ImportError:
    logger.warning("stripe not installed. Install with: pip install stripe")
    STRIPE_AVAILABLE = False
    stripe = None

app = Flask(__name__, static_folder='build', static_url_path='')

# Enhanced CORS configuration - explicitly allow localhost:3000 for Next.js dev
allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,*').split(',')
CORS(app, resources={
    r"/api/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-ID"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
}, supports_credentials=True)

# Rate limiting - more lenient for development
# In production, you may want stricter limits
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["1000 per day", "200 per hour", "30 per minute"],
    storage_uri="memory://"  # Use in-memory storage for development
)

# HTTPS redirect (in production)
if os.getenv('ENFORCE_HTTPS', 'false').lower() == 'true':
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Encryption setup
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', Fernet.generate_key().decode())
try:
    cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
except Exception as e:
    logger.warning(f"Encryption setup failed: {e}")
    cipher_suite = None

# Audit logging
audit_log = []

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'flac', 'm4a', 'webm', 'jpg', 'jpeg', 'png'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# In-memory storage for analysis history
analysis_history = []

# In-memory storage for NeuroTwin profiles
# Structure: {user_id: {history: [...], predictions: {...}}}
neurotwin_profiles = {}

# File-based persistence for NeuroTwin profiles (fallback when MongoDB unavailable)
NEUROTWIN_DATA_FILE = os.path.join(os.path.dirname(__file__), 'neurotwin_data.json')

def load_neurotwin_from_file():
    """Load NeuroTwin profiles from JSON file"""
    global neurotwin_profiles
    if os.path.exists(NEUROTWIN_DATA_FILE):
        try:
            with open(NEUROTWIN_DATA_FILE, 'r') as f:
                data = json.load(f)
                neurotwin_profiles = data
                logger.info(f"Loaded {len(neurotwin_profiles)} NeuroTwin profiles from file")
        except Exception as e:
            logger.warning(f"Error loading NeuroTwin data from file: {e}")
            neurotwin_profiles = {}

def save_neurotwin_to_file():
    """Save NeuroTwin profiles to JSON file"""
    try:
        # Convert numpy types and other non-serializable types to native Python types
        def convert_to_serializable(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.bool_, bool)):
                return bool(obj)
            elif isinstance(obj, dict):
                return {key: convert_to_serializable(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [convert_to_serializable(item) for item in obj]
            elif isinstance(obj, (datetime,)):
                return obj.isoformat()
            else:
                return obj
        
        serializable_data = convert_to_serializable(neurotwin_profiles)
        
        with open(NEUROTWIN_DATA_FILE, 'w') as f:
            json.dump(serializable_data, f, indent=2, default=str)
        logger.info(f"Saved {len(neurotwin_profiles)} NeuroTwin profiles to file")
    except Exception as e:
        logger.error(f"Error saving NeuroTwin data to file: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")

# Load existing data on startup
load_neurotwin_from_file()

# Journal entries when MongoDB is unavailable: { user_id: [ { entry_id, user_id, text, tags, timestamp }, ... ] }
JOURNAL_DATA_FILE = os.path.join(os.path.dirname(__file__), 'journal_data.json')
journal_by_user = {}


def load_journal_from_file():
    """Load journal entries from JSON (fallback when MongoDB is not used)."""
    global journal_by_user
    if os.path.exists(JOURNAL_DATA_FILE):
        try:
            with open(JOURNAL_DATA_FILE, 'r', encoding='utf-8') as f:
                journal_by_user = json.load(f)
            if not isinstance(journal_by_user, dict):
                journal_by_user = {}
            logger.info(f"Loaded journal entries for {len(journal_by_user)} user(s) from file")
        except Exception as e:
            logger.warning(f"Error loading journal data from file: {e}")
            journal_by_user = {}
    else:
        journal_by_user = {}


def save_journal_to_file():
    """Persist journal entries to disk."""
    try:
        with open(JOURNAL_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(journal_by_user, f, indent=2, ensure_ascii=False, default=str)
    except Exception as e:
        logger.error(f"Error saving journal data to file: {e}")


load_journal_from_file()

# In-memory storage for user records (signup data for analysis)
user_records = {}  # {user_id: {user_record data}}
user_profiles = {}  # {user_id: {profile data}}

# In-memory storage for subscriptions and credits (fallback if MongoDB unavailable)
user_subscriptions = {}  # {user_id: {plan, expiry, status, stripe_customer_id}}
user_credits = {}  # {user_id: {balance, last_refill}}
credit_history_storage = []  # [{user_id, timestamp, action, amount, feature}]

# In-memory storage for game scores and streaks
game_scores = {}  # {user_id: {games: {...}, streak: int, badges: [...]}}
leaderboard_data = {}  # {region: [{user_id, score, rank}]}
cognitive_fingerprints = {}  # {user_id: {voice_embedding: [...], face_embedding: [...]}}

# CareNetwork storage
care_networks = {}  # {patient_id: {family_members: [...], doctors: [...], baseline_metrics: {...}}}
notifications = []  # {patient_id, type, message, timestamp, sent_to: [...]}

# Risk analysis model
risk_classifier = None
try:
    # Train a simple risk classifier if model doesn't exist
    from sklearn.linear_model import LogisticRegression
    # This would be trained on actual data in production
    risk_classifier = LogisticRegression(random_state=42)
    # Mock training data for initialization
    X_mock = np.random.rand(100, 5)  # 5 features: latency, pause, tremor, eye_movement_x, eye_movement_y
    y_mock = (X_mock.sum(axis=1) > 2.5).astype(int)  # Binary risk
    risk_classifier.fit(X_mock, y_mock)
    logger.info("Risk classifier initialized")
except Exception as e:
    logger.warning(f"Risk classifier not available: {e}")

# Role-based access control
user_roles = {}  # {user_id: 'patient'|'family'|'doctor'|'admin'}

# === Load Models ===
cognitive_model = None
try:
    COGNITIVE_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'cognitive_risk_model.pkl')
    if os.path.exists(COGNITIVE_MODEL_PATH):
        try:
            cognitive_model = joblib.load(COGNITIVE_MODEL_PATH)
            logger.info("Cognitive model loaded successfully")
        except Exception as load_error:
            # Handle XGBoost/OpenMP errors gracefully
            error_msg = str(load_error)
            if 'xgboost' in error_msg.lower() or 'libomp' in error_msg.lower() or 'openmp' in error_msg.lower():
                logger.warning("Cognitive model requires XGBoost/OpenMP which is not available. Using fallback predictions.")
                logger.warning("To fix: Install OpenMP with 'brew install libomp' (macOS) or install XGBoost dependencies")
            else:
                logger.warning(f"Error loading cognitive model: {load_error}")
            cognitive_model = None
    else:
        logger.warning(f"Cognitive model file not found at {COGNITIVE_MODEL_PATH}, using fallback predictions")
        cognitive_model = None
except Exception as e:
    logger.warning(f"Error loading cognitive model (using fallback): {e}")
    cognitive_model = None

speech_session = None
if ONNXRUNTIME_AVAILABLE and ort:
    try:
        SPEECH_MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'speech_model.onnx')
        if os.path.exists(SPEECH_MODEL_PATH):
            speech_session = ort.InferenceSession(SPEECH_MODEL_PATH)
            logger.info("Speech model loaded successfully")
        else:
            logger.warning(f"Speech model file not found at {SPEECH_MODEL_PATH}, using fallback analysis")
    except Exception as e:
        logger.warning(f"Error loading speech model (using fallback): {e}")

# === Helper Functions ===
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def calculate_confidence_score(prediction, features=None):
    """Calculate a confidence score based on prediction and features"""
    base_confidence = 0.75
    
    if features:
        if 'accuracy' in features:
            accuracy_factor = features['accuracy'] * 0.15
            base_confidence += accuracy_factor
        
        if 'reaction_time' in features:
            rt_factor = max(0, (2.0 - features['reaction_time']) / 2.0) * 0.1
            base_confidence += rt_factor
    
    confidence = base_confidence + np.random.uniform(-0.05, 0.05)
    return min(0.99, max(0.65, confidence))

def extract_facial_features(image_data=None):
    """Extract facial features from image"""
    try:
        if image_data is None:
            # Simulate webcam capture
            cap = cv2.VideoCapture(0)
            ret, frame = cap.read()
            cap.release()
            
            if not ret:
                return None
            
            image_data = frame
        
        # Convert to grayscale
        gray = cv2.cvtColor(image_data, cv2.COLOR_BGR2GRAY)
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
        
        if len(faces) == 0:
            return None
        
        # Get the first face
        x, y, w, h = faces[0]
        
        # Calculate features
        img_height, img_width = image_data.shape[:2]
        
        features = [
            float(w),  # face width
            float(h),  # face height
            float(x + w/2) / img_width,  # normalized x position
            float(y + h/2) / img_height  # normalized y position
        ]
        
        return features
        
    except Exception as e:
        logger.error(f"Error extracting facial features: {e}")
        return None

def analyze_face(features):
    """Analyze facial features and return risk assessment"""
    if not features or len(features) < 4:
        return "Unknown", ["Insufficient data for analysis"]
    
    width, height, x_pos, y_pos = features
    reasons = []
    risk_score = 0
    
    # Face size analysis
    if width < 150 or height < 150:
        reasons.append(f"⚠️ Small facial region detected ({int(width)}x{int(height)}px) - may indicate positioning issues")
        risk_score += 1
    elif width < 200 or height < 200:
        reasons.append(f"📏 Moderate facial region ({int(width)}x{int(height)}px) - acceptable for analysis")
    else:
        reasons.append(f"✅ Good facial region size ({int(width)}x{int(height)}px) - optimal for analysis")
    
    # Aspect ratio analysis
    aspect_ratio = width / height if height > 0 else 1
    if aspect_ratio < 0.7 or aspect_ratio > 1.3:
        reasons.append(f"⚠️ Unusual facial aspect ratio ({aspect_ratio:.2f}) - may indicate angle issues")
        risk_score += 1
    else:
        reasons.append(f"✅ Normal facial proportions (ratio: {aspect_ratio:.2f})")
    
    # Position analysis
    if x_pos < 0.3 or x_pos > 0.7:
        reasons.append(f"📍 Face positioned off-center horizontally ({x_pos:.2f})")
        risk_score += 0.5
    else:
        reasons.append(f"✅ Face well-centered horizontally ({x_pos:.2f})")
    
    if y_pos < 0.3 or y_pos > 0.7:
        reasons.append(f"📍 Face positioned off-center vertically ({y_pos:.2f})")
        risk_score += 0.5
    else:
        reasons.append(f"✅ Face well-centered vertically ({y_pos:.2f})")
    
    # Determine risk level
    if risk_score <= 1:
        risk = "Low"
        reasons.append("🎯 Overall assessment: Normal facial positioning and features")
    elif risk_score <= 2:
        risk = "Medium"
        reasons.append("⚡ Overall assessment: Some indicators suggest attention needed")
    else:
        risk = "High"
        reasons.append("🔴 Overall assessment: Multiple indicators suggest review needed")
    
    return risk, reasons

def extract_audio_features(y, sr):
    """Extract comprehensive audio features"""
    features = {}
    
    try:
        # MFCCs
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        features['mfcc_mean'] = np.mean(mfccs, axis=1).tolist()
        features['mfcc_std'] = np.std(mfccs, axis=1).tolist()
        
        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(y)
        features['zcr_mean'] = float(np.mean(zcr))
        features['zcr_std'] = float(np.std(zcr))
        
        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)
        features['spectral_centroid_mean'] = float(np.mean(spectral_centroids))
        
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        features['spectral_rolloff_mean'] = float(np.mean(spectral_rolloff))
        
        # Energy/RMS
        rms = librosa.feature.rms(y=y)
        features['rms_mean'] = float(np.mean(rms))
        
        # Duration
        features['duration'] = float(len(y) / sr)
        
    except Exception as e:
        logger.error(f"Error extracting audio features: {e}")
    
    return features

def get_risk_insights(label, features=None):
    """Provide insights based on risk classification"""
    insights = {
        "Normal": {
            "message": "Cognitive function appears to be within normal range",
            "recommendations": [
                "Maintain regular cognitive exercises",
                "Continue healthy lifestyle habits",
                "Consider periodic reassessment"
            ],
            "severity": "low"
        },
        "Low": {
            "message": "Facial analysis shows normal indicators",
            "recommendations": [
                "Continue regular monitoring",
                "Maintain healthy lifestyle",
                "Schedule periodic check-ups"
            ],
            "severity": "low"
        },
        "Medium": {
            "message": "Some indicators suggest attention needed",
            "recommendations": [
                "Consider professional consultation",
                "Increase monitoring frequency",
                "Review lifestyle factors"
            ],
            "severity": "medium"
        },
        "At Risk": {
            "message": "Some indicators suggest potential cognitive decline",
            "recommendations": [
                "Consult with a healthcare professional",
                "Increase cognitive stimulation activities",
                "Monitor progress with regular assessments",
                "Consider lifestyle modifications"
            ],
            "severity": "medium"
        },
        "High": {
            "message": "Multiple indicators suggest review needed",
            "recommendations": [
                "Seek professional medical evaluation",
                "Comprehensive assessment recommended",
                "Discuss findings with healthcare provider"
            ],
            "severity": "high"
        },
        "Impaired": {
            "message": "Multiple indicators suggest cognitive impairment",
            "recommendations": [
                "Seek immediate medical evaluation",
                "Comprehensive cognitive assessment recommended",
                "Discuss treatment options with healthcare provider",
                "Consider support resources for daily activities"
            ],
            "severity": "high"
        }
    }
    
    return insights.get(label, insights["Normal"])

# === Security & Access Control Functions ===

def encrypt_data(data):
    """Encrypt sensitive data"""
    if cipher_suite and data:
        try:
            if isinstance(data, str):
                return cipher_suite.encrypt(data.encode()).decode()
            elif isinstance(data, (list, dict)):
                json_str = json.dumps(data)
                return cipher_suite.encrypt(json_str.encode()).decode()
        except Exception as e:
            logger.error(f"Encryption error: {e}")
    return data

def decrypt_data(encrypted_data):
    """Decrypt sensitive data"""
    if cipher_suite and encrypted_data:
        try:
            decrypted = cipher_suite.decrypt(encrypted_data.encode() if isinstance(encrypted_data, str) else encrypted_data)
            try:
                return json.loads(decrypted.decode())
            except:
                return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
    return encrypted_data

def audit_log_request(endpoint, user_id, method, status_code, details=None):
    """Log API call for audit"""
    audit_entry = {
        'id': str(uuid.uuid4()),
        'timestamp': datetime.now().isoformat(),
        'endpoint': endpoint,
        'user_id': user_id,
        'method': method,
        'status_code': status_code,
        'ip_address': request.remote_addr if request else None,
        'details': details
    }
    audit_log.append(audit_entry)
    
    # Keep only last 10000 entries
    if len(audit_log) > 10000:
        audit_log.pop(0)
    
    # Save to MongoDB if available
    if MONGO_AVAILABLE and db:
        try:
            db['audit_logs'].insert_one(audit_entry)
        except Exception as e:
            logger.error(f"Error saving audit log: {e}")

def require_role(*allowed_roles):
    """Decorator for role-based access control"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = request.json.get('user_id') if request.is_json else request.args.get('user_id')
            if not user_id:
                user_id = request.headers.get('X-User-ID')
            
            user_role = user_roles.get(user_id, 'patient')
            
            if user_role not in allowed_roles and 'admin' not in allowed_roles:
                audit_log_request(request.path, user_id, request.method, 403, 'Access denied')
                return jsonify({"error": "Insufficient permissions"}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# === NeuroTwin Helper Functions ===

def extract_cognitive_metrics(test_results):
    """Extract cognitive metrics from test results - comprehensive analysis for all test types"""
    metrics = {
        'attention': 0.0,
        'memory': 0.0,
        'speed': 0.0,
        'verbal_fluency': 0.0,
        'executive_function': 0.0,
        'processing_speed': 0.0
    }
    
    test_type = test_results.get('test_type', '')
    
    # Go-No-Go Test: Attention and Response Inhibition
    if test_type == 'go-no-go':
        hit_rate = test_results.get('hit_rate', 0)
        false_alarm_rate = test_results.get('false_alarm_rate', 0)
        avg_rt = test_results.get('avg_reaction_time', 2000) / 1000  # Convert to seconds
        
        metrics['attention'] = hit_rate * (1 - false_alarm_rate)
        metrics['speed'] = max(0.0, min(1.0, 1.0 - (avg_rt / 2.0)))
        metrics['executive_function'] = (1 - false_alarm_rate) * 0.8  # Response inhibition
    
    # Symbol-Digit Test: Processing Speed and Attention
    elif test_type == 'symbol-digit':
        accuracy = test_results.get('accuracy', 0)
        symbols_per_min = test_results.get('symbols_per_minute', 0)
        
        metrics['processing_speed'] = min(1.0, symbols_per_min / 60.0)  # Normalize to 60 symbols/min
        metrics['attention'] = accuracy
        metrics['speed'] = metrics['processing_speed']
    
    # Trail-Making Test: Executive Function and Processing Speed
    elif test_type == 'trail-making':
        part_a_time = test_results.get('part_a_time', 60)  # seconds
        part_b_time = test_results.get('part_b_time', 120)  # seconds
        b_minus_a = test_results.get('b_minus_a', 60)
        
        # Normalize times (good performance: Part A < 30s, Part B < 75s)
        metrics['processing_speed'] = max(0.0, min(1.0, 1.0 - (part_a_time / 60.0)))
        metrics['executive_function'] = max(0.0, min(1.0, 1.0 - (b_minus_a / 90.0)))
        metrics['speed'] = metrics['processing_speed']
    
    # N-Back Test: Working Memory
    elif test_type == 'n-back':
        accuracy = test_results.get('accuracy', 0)
        n_level = test_results.get('n_level', 1)
        false_alarms = test_results.get('false_alarms', 0)
        rounds = test_results.get('rounds', 20)
        
        metrics['memory'] = accuracy * (n_level / 3.0)  # Higher n = better memory
        metrics['attention'] = accuracy * (1 - (false_alarms / rounds))
        metrics['executive_function'] = accuracy * 0.7
    
    # Flanker Task: Attention and Cognitive Control
    elif test_type == 'flanker-task':
        accuracy = test_results.get('accuracy', 0)
        congruent_rt = test_results.get('congruent_rt', 500) / 1000
        incongruent_rt = test_results.get('incongruent_rt', 700) / 1000
        interference = (incongruent_rt - congruent_rt) / congruent_rt
        
        metrics['attention'] = accuracy
        metrics['executive_function'] = accuracy * (1 - min(1.0, interference))
        metrics['speed'] = max(0.0, min(1.0, 1.0 - (congruent_rt / 1.0)))
    
    # Stroop Test: Executive Function and Attention
    elif test_type == 'stroop':
        accuracy = test_results.get('accuracy', 0)
        avg_rt = test_results.get('avg_reaction_time', 1000) / 1000
        stroop_effect = test_results.get('stroop_effect', 0.2)
        
        metrics['executive_function'] = accuracy * (1 - min(1.0, stroop_effect))
        metrics['attention'] = accuracy
        metrics['speed'] = max(0.0, min(1.0, 1.0 - (avg_rt / 1.5)))
    
    # Digit Span: Working Memory
    elif test_type == 'digit-span':
        max_span = test_results.get('max_span', 5)
        accuracy = test_results.get('accuracy', 0)
        
        metrics['memory'] = (max_span / 9.0) * accuracy  # Normalize to max span of 9
        metrics['attention'] = accuracy
    
    # Reaction Time: Processing Speed
    elif test_type == 'reaction-time':
        avg_rt = test_results.get('avg_reaction_time', 300) / 1000  # Convert to seconds
        consistency = test_results.get('consistency', 1.0)
        
        metrics['speed'] = max(0.0, min(1.0, 1.0 - (avg_rt / 0.5)))  # Good RT < 250ms
        metrics['processing_speed'] = metrics['speed'] * consistency
        metrics['attention'] = consistency
    
    # Visual Search: Attention and Processing Speed
    elif test_type == 'visual-search':
        accuracy = test_results.get('accuracy', 0)
        avg_rt = test_results.get('avg_reaction_time', 2000) / 1000
        
        metrics['attention'] = accuracy
        metrics['processing_speed'] = max(0.0, min(1.0, 1.0 - (avg_rt / 3.0)))
        metrics['speed'] = metrics['processing_speed']
    
    # Dual Task: Executive Function and Attention
    elif test_type == 'dual-task':
        accuracy = test_results.get('accuracy', 0)
        reaction_time = test_results.get('reaction_time', 1.0)
        
        metrics['executive_function'] = accuracy
        metrics['attention'] = accuracy * 0.8
        metrics['speed'] = max(0.0, min(1.0, 1.0 - (reaction_time / 2.0)))
    
    # Memory Match: Working Memory
    elif test_type == 'memory-match':
        score = test_results.get('score', 0)
        moves = test_results.get('moves', 50)
        time = test_results.get('time', 120)  # seconds
        pairs = test_results.get('pairs', 8)
        
        # Efficiency: fewer moves and less time = better memory
        efficiency = (pairs / max(moves, 1)) * (1 - min(1.0, time / 300))
        metrics['memory'] = min(1.0, efficiency)
        metrics['attention'] = min(1.0, score / 200)
    
    # Speech Analysis: Verbal Fluency
    elif test_type == 'speech' or 'audio_features' in test_results:
        audio_features = test_results.get('audio_features', {})
        label = test_results.get('label', 'Normal')
        
        if 'duration' in audio_features:
            duration = float(audio_features['duration'])
            metrics['verbal_fluency'] = min(1.0, max(0.0, (duration - 2.0) / 28.0))
        
        if label == 'Normal':
            metrics['verbal_fluency'] = max(metrics['verbal_fluency'], 0.7)
        elif label == 'At Risk':
            metrics['verbal_fluency'] = metrics['verbal_fluency'] * 0.8
        elif label == 'Impaired':
            metrics['verbal_fluency'] = metrics['verbal_fluency'] * 0.5
    
    # Facial Analysis: Can indicate cognitive load/stress
    elif test_type == 'facial' or 'risk' in test_results:
        risk = test_results.get('risk', 'Low')
        confidence = test_results.get('confidence', 0.5)
        
        if risk == 'Low':
            metrics['attention'] = 0.8 * confidence
        elif risk == 'Medium':
            metrics['attention'] = 0.5 * confidence
        else:
            metrics['attention'] = 0.3 * confidence
    
    # Delayed Recall: Long-term episodic memory and consolidation
    elif test_type == 'delayed-recall':
        accuracy = float(test_results.get('accuracy', 0.0))
        delayed_score = float(test_results.get('delayed_recall_score', accuracy))
        intrusions = int(test_results.get('intrusions', 0))
        
        # Memory primarily driven by delayed recall score (more sensitive than immediate recall)
        metrics['memory'] = max(0.0, min(1.0, delayed_score))
        # Attention slightly penalized by intrusions (false recalls indicate attention/executive issues)
        metrics['attention'] = max(0.0, min(1.0, accuracy * (1.0 - min(0.3, intrusions * 0.05))))
        metrics['executive_function'] = metrics['attention'] * 0.7
    
    # Verbal Fluency: Language processing, executive retrieval, semantic memory
    elif test_type == 'verbal-fluency':
        unique_words = float(test_results.get('unique_words', 0))
        repetitions = float(test_results.get('repetitions', 0))
        speech_rate = float(test_results.get('speech_rate_wpm', 0))
        
        # Normalize: 0-30 unique words typical range for 60 seconds
        fluency_raw = min(1.0, unique_words / 30.0)
        repetition_penalty = max(0.0, 1.0 - min(0.3, repetitions * 0.03))
        rate_factor = min(1.0, speech_rate / 120.0)  # 120 wpm-ish upper bound
        
        metrics['verbal_fluency'] = fluency_raw * repetition_penalty
        metrics['executive_function'] = metrics['verbal_fluency'] * 0.8
        metrics['attention'] = rate_factor * 0.6
    
    # Clock Drawing: Executive planning, visuospatial ability, working memory
    elif test_type == 'clock-drawing':
        drawing_score = float(test_results.get('drawing_score', 0.0))
        hour_angle = float(test_results.get('hour_angle', 0))
        minute_angle = float(test_results.get('minute_angle', 0))
        
        # Executive function primarily driven by overall drawing accuracy
        metrics['executive_function'] = max(0.0, min(1.0, drawing_score))
        # Memory contributes if hour placement is reasonable (indicates working memory for time concept)
        # Visuospatial ability reflected in hand placement accuracy
        metrics['memory'] = max(0.0, min(1.0, drawing_score * 0.6))
        metrics['attention'] = (metrics['executive_function'] + metrics['memory']) / 2.0
        metrics['processing_speed'] = 0.0  # Not primarily speed-dependent
    
    # Quick Cognitive Check: Orientation, memory, attention
    elif test_type == 'quick-check':
        accuracy = test_results.get('accuracy', 0)
        score = test_results.get('score', 0) / 100.0 if test_results.get('score') else accuracy
        memory_pts = test_results.get('memory_points', 0)
        orientation_pts = test_results.get('orientation_points', 0)
        attention_pts = test_results.get('attention_points', 0)
        metrics['memory'] = max(0.0, min(1.0, memory_pts / 3.0))
        metrics['attention'] = max(0.0, min(1.0, (orientation_pts / 3.0 + attention_pts / 4.0) / 2.0))
        metrics['executive_function'] = score * 0.8
        metrics['speed'] = 0.5  # Not speed-focused

    # Generic cognitive game results
    elif 'accuracy' in test_results and 'reaction_time' in test_results:
        metrics['attention'] = float(test_results['accuracy'])
        reaction_time = float(test_results.get('reaction_time', 2.0))
        metrics['speed'] = max(0.0, min(1.0, 1.0 - (reaction_time / 5.0)))
        level = int(test_results.get('level', 3))
        metrics['memory'] = float(test_results['accuracy']) * (level / 5.0)
    
    return metrics

def predict_future_metrics(history, days=7):
    """Predict future metrics for next N days using Linear Regression"""
    if len(history) < 2:
        # Not enough data, return current metrics as prediction
        if len(history) == 0:
            return None
        current = history[-1]['metrics']
        return {
            day: {k: v for k, v in current.items()} 
            for day in range(1, days + 1)
        }
    
    predictions = {}
    metrics_keys = ['attention', 'memory', 'speed', 'verbal_fluency']
    
    # Prepare data: extract timestamps and metric values
    timestamps = []
    metric_values = {key: [] for key in metrics_keys}
    base_time = None
    
    for entry in history:
        # Convert timestamp to days since first entry
        if not entry.get('timestamp'):
            logger.warning(f"Entry missing timestamp, skipping: {entry}")
            continue
        if not entry.get('metrics'):
            logger.warning(f"Entry missing metrics, skipping: {entry}")
            continue
            
        try:
            entry_time = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
            if base_time is None:
                base_time = entry_time
            days_since_start = (entry_time - base_time).total_seconds() / 86400.0
            timestamps.append(days_since_start)
            
            for key in metrics_keys:
                metric_values[key].append(entry['metrics'].get(key, 0.0))
        except (ValueError, KeyError, AttributeError, TypeError) as e:
            logger.warning(f"Error processing history entry: {e}, skipping entry")
            continue
    
    # Check if we have valid data after filtering
    if len(timestamps) == 0:
        logger.warning("No valid history entries after filtering, returning None")
        return None
    
    # Predict each metric
    X = np.array(timestamps).reshape(-1, 1)
    future_days = np.array([timestamps[-1] + i for i in range(1, days + 1)]).reshape(-1, 1)
    
    predicted_metrics = {}
    for key in metrics_keys:
        if len(metric_values[key]) < 2:
            # Use last value if not enough data
            last_value = metric_values[key][-1] if metric_values[key] else 0.5
            predicted_metrics[key] = [last_value] * days
        else:
            y = np.array(metric_values[key])
            model = LinearRegression()
            model.fit(X, y)
            predictions_array = model.predict(future_days)
            # Clamp values between 0 and 1
            predictions_array = np.clip(predictions_array, 0.0, 1.0)
            predicted_metrics[key] = predictions_array.tolist()
    
    # Format predictions by day
    result = {}
    for day in range(1, days + 1):
        result[day] = {
            key: predicted_metrics[key][day - 1] 
            for key in metrics_keys
        }
    
    return result

# === Middleware for Audit Logging ===
@app.before_request
def log_request():
    """Log all API requests for audit"""
    if request.path.startswith('/api/'):
        # Don't try to parse JSON for GET requests
        user_id = None
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                if request.is_json and request.json:
                    user_id = request.json.get('user_id')
            except Exception:
                pass
        if not user_id:
            user_id = request.args.get('user_id')
        if not user_id:
            user_id = request.headers.get('X-User-ID', 'anonymous')
        # Will be logged after response in after_request

@app.before_request
def prevent_json_parsing_for_get():
    """Prevent Flask from trying to parse JSON for GET requests"""
    if request.method == 'GET':
        # Remove Content-Type header if it's application/json for GET requests
        # This prevents Flask from trying to parse JSON
        if request.content_type and 'application/json' in request.content_type:
            # Flask will handle this, but we can prevent errors by not accessing request.json
            pass

@app.after_request
def log_response(response):
    """Log API responses for audit and ensure CORS headers"""
    # Always add CORS headers for API routes
    if request.path.startswith('/api/'):
        # Ensure CORS headers are set for all API responses
        origin = request.headers.get('Origin', 'http://localhost:3000')
        allowed_origins = ['http://localhost:3000', 'http://127.0.0.1:3000']
        
        if origin in allowed_origins or '*' in allowed_origins:
            response.headers.add('Access-Control-Allow-Origin', origin)
        else:
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        
            response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID')
        
        # Log API requests - safely get user_id without parsing JSON for GET requests
        user_id = None
        try:
            # Only try to access JSON for POST/PUT/PATCH requests
            if request.method in ['POST', 'PUT', 'PATCH']:
                # Check content type first to avoid triggering JSON parsing
                content_type = request.content_type or ''
                if 'application/json' in content_type:
                    try:
                        # Only access request.json if we're sure it's JSON
                        if hasattr(request, 'is_json') and request.is_json:
                            user_id = request.json.get('user_id') if request.json else None
                    except Exception:
                        pass  # Ignore JSON parsing errors
        except Exception:
            pass  # Ignore any errors
        
        if not user_id:
            user_id = request.args.get('user_id') or request.view_args.get('user_id')
        if not user_id:
            user_id = request.headers.get('X-User-ID', 'anonymous')
        
        try:
            audit_log_request(request.path, user_id, request.method, response.status_code)
        except Exception as e:
            logger.warning(f"Error logging request: {e}")
    
    return response

# === API Routes ===

@app.route('/')
def serve_react():
    """Serve React frontend"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "cognitive_model_loaded": cognitive_model is not None,
        "speech_model_loaded": speech_session is not None,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict_cognitive():
    """Cognitive game prediction"""
    try:
        data = request.json
        
        # Fallback prediction when model is not loaded
        if cognitive_model is None:
            logger.warning("Cognitive model not loaded, using fallback prediction")
            # Simple heuristic-based prediction
            accuracy = float(data.get('accuracy', 0.5))
            reaction_time = float(data.get('reaction_time', 2.0))
            
            # Determine risk level based on heuristics
            if accuracy >= 0.8 and reaction_time < 2.0:
                prediction = 0  # Normal
            elif accuracy >= 0.6 and reaction_time < 3.0:
                prediction = 1  # At Risk
            else:
                prediction = 2  # Impaired
            
            label_map = {0: "Normal", 1: "At Risk", 2: "Impaired"}
            label = label_map[prediction]
            
            confidence = calculate_confidence_score(prediction, {
                'accuracy': data.get('accuracy', 0.5),
                'reaction_time': data.get('reaction_time', 2.0)
            })
            
            insights = get_risk_insights(label)
            
            analysis_record = {
                "id": len(analysis_history) + 1,
                "timestamp": datetime.now().isoformat(),
                "type": "cognitive_game",
                "prediction": prediction,
                "label": label,
                "confidence": round(confidence, 3),
                "features": data,
                "insights": insights,
                "model_used": "fallback_heuristic"
            }
            analysis_history.append(analysis_record)
            
            logger.info(f"Cognitive prediction (fallback): {label} (confidence: {confidence:.2f})")
            
            return jsonify({
                "success": True,
                "prediction": prediction,
                "label": label,
                "confidence": round(confidence, 3),
                "insights": insights,
                "analysis_id": analysis_record["id"],
                "timestamp": analysis_record["timestamp"],
                "note": "Using fallback prediction (model not loaded)"
            })
        
        # Use actual model if available
        
        required_fields = ['accuracy', 'reaction_time', 'retries', 'level', 'total_time']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        features = [
            float(data['accuracy']),
            float(data['reaction_time']),
            int(data['retries']),
            int(data['level']),
            float(data['total_time'])
        ]
        
        prediction = cognitive_model.predict([features])[0]
        label_map = {0: "Normal", 1: "At Risk", 2: "Impaired"}
        label = label_map[int(prediction)]
        
        confidence = calculate_confidence_score(prediction, {
            'accuracy': data['accuracy'],
            'reaction_time': data['reaction_time']
        })
        
        insights = get_risk_insights(label)
        
        analysis_record = {
            "id": len(analysis_history) + 1,
            "timestamp": datetime.now().isoformat(),
            "type": "cognitive_game",
            "prediction": int(prediction),
            "label": label,
            "confidence": round(confidence, 3),
            "features": data,
            "insights": insights
        }
        analysis_history.append(analysis_record)
        
        logger.info(f"Cognitive prediction: {label} (confidence: {confidence:.2f})")
        
        return jsonify({
            "success": True,
            "prediction": int(prediction),
            "label": label,
            "confidence": round(confidence, 3),
            "insights": insights,
            "analysis_id": analysis_record["id"],
            "timestamp": analysis_record["timestamp"]
        })
        
    except Exception as e:
        logger.error(f"Error in cognitive prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict-facial', methods=['POST'])
def predict_facial():
    """Facial analysis prediction"""
    try:
        data = request.json
        
        if 'image' in data:
            # Process base64 image
            image_data = data['image'].split(',')[1] if ',' in data['image'] else data['image']
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            image_array = np.array(image)
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
            
            features = extract_facial_features(image_bgr)
        else:
            # Use webcam
            features = extract_facial_features()
        
        if not features:
            return jsonify({
                "success": False,
                "error": "No face detected"
            }), 400
        
        risk, reasons = analyze_face(features)
        
        confidence = calculate_confidence_score(
            0 if risk == "Low" else (1 if risk == "Medium" else 2),
            {'accuracy': 0.85}
        )
        
        insights = get_risk_insights(risk)
        
        analysis_record = {
            "id": len(analysis_history) + 1,
            "timestamp": datetime.now().isoformat(),
            "type": "facial_analysis",
            "risk": risk,
            "confidence": round(confidence, 3),
            "features": {
                "face_width": features[0],
                "face_height": features[1],
                "x_position": features[2],
                "y_position": features[3]
            },
            "reasons": reasons,
            "insights": insights
        }
        analysis_history.append(analysis_record)
        
        logger.info(f"Facial analysis: {risk} (confidence: {confidence:.2f})")
        
        return jsonify({
            "success": True,
            "risk": risk,
            "confidence": round(confidence, 3),
            "features": analysis_record["features"],
            "reasons": reasons,
            "insights": insights,
            "analysis_id": analysis_record["id"],
            "timestamp": analysis_record["timestamp"]
        })
        
    except Exception as e:
        logger.error(f"Error in facial prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict-speech', methods=['POST'])
def predict_speech():
    """Speech analysis prediction"""
    try:
        if speech_session is None:
            return jsonify({"error": "Speech model not loaded"}), 503
        
        file = request.files.get("audio")
        if not file:
            return jsonify({"error": "No audio file uploaded"}), 400
        
        # Check if filename exists, if not, try to infer from content type
        filename = file.filename or 'audio.webm'
        
        # If filename doesn't have extension, try to infer from content type
        if '.' not in filename:
            content_type = file.content_type or ''
            if 'webm' in content_type:
                filename = 'audio.webm'
            elif 'ogg' in content_type:
                filename = 'audio.ogg'
            elif 'wav' in content_type:
                filename = 'audio.wav'
            elif 'mp3' in content_type or 'mpeg' in content_type:
                filename = 'audio.mp3'
            else:
                filename = 'audio.webm'  # Default to webm for MediaRecorder
        
        if not allowed_file(filename):
            return jsonify({
                "error": f"Invalid file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}",
                "filename": filename,
                "content_type": file.content_type
            }), 400
        
        filename = secure_filename(filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{datetime.now().timestamp()}_{filename}")
        file.save(filepath)
        
        try:
            # Load audio file - librosa can handle webm, ogg, wav, mp3, etc.
            # Note: WebM support requires ffmpeg to be installed
            try:
                y, sr = librosa.load(filepath, sr=16000, duration=30)
            except Exception as load_error:
                logger.error(f"Error loading audio file: {load_error}", exc_info=True)
                # Clean up file before returning error
                try:
                    if os.path.exists(filepath):
                        os.remove(filepath)
                except:
                    pass
                # Provide helpful error message
                error_msg = str(load_error)
                if 'webm' in filename.lower() or 'webm' in error_msg.lower():
                    error_msg = "WebM audio format requires ffmpeg. Please install ffmpeg or try recording in WAV/MP3 format."
                return jsonify({
                    "success": False,
                    "error": f"Could not process audio file: {error_msg}"
                }), 400
            
            if len(y) == 0:
                return jsonify({
                    "success": False,
                    "error": "Audio file appears to be empty or corrupted"
                }), 400
            
            audio_features = extract_audio_features(y, sr)
            
            # If model is not available, return fallback analysis
            if speech_session is None:
                logger.warning("Speech model not loaded, using fallback analysis")
                # Provide basic analysis based on audio features
                label = "Normal"  # Default
                confidence = 0.75
                
                # Simple heuristic based on audio features
                if audio_features.get('duration', 0) < 1.0:
                    label = "At Risk"
                    confidence = 0.65
                
                insights = get_risk_insights(label)
                
                return jsonify({
                    "success": True,
                    "prediction": 0,
                    "label": label,
                    "confidence": confidence,
                    "audio_features": audio_features,
                    "prediction_probabilities": {
                        "Normal": 0.7,
                        "At Risk": 0.2,
                        "Impaired": 0.1
                    },
                    "insights": insights,
                    "analysis_id": len(analysis_history) + 1,
                    "timestamp": datetime.now().isoformat(),
                    "note": "Fallback analysis - model not loaded"
                })
            
            # Process with ML model
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc = mfcc[:, :94]
            if mfcc.shape[1] < 94:
                pad = np.zeros((13, 94 - mfcc.shape[1]))
                mfcc = np.hstack((mfcc, pad))
            
            input_tensor = mfcc[np.newaxis, np.newaxis, :, :].astype(np.float32)
            
            try:
                output = speech_session.run(None, {"input": input_tensor})[0]
                logits = output[0]
            except Exception as model_error:
                logger.error(f"Error running speech model: {model_error}")
                return jsonify({
                    "success": False,
                    "error": f"Model processing error: {str(model_error)}"
                }), 500
            
            exp_logits = np.exp(logits - np.max(logits))
            prediction_probs = exp_logits / np.sum(exp_logits)
            
            # Ensure prediction_probs has at least 3 elements (pad if needed)
            if len(prediction_probs) < 3:
                prediction_probs = np.pad(prediction_probs, (0, 3 - len(prediction_probs)), mode='constant', constant_values=0.0)
                prediction_probs = prediction_probs[:3] / np.sum(prediction_probs[:3])  # Renormalize
            
            label_idx = int(np.argmax(prediction_probs))
            label_map = {0: "Normal", 1: "At Risk", 2: "Impaired"}
            label = label_map.get(label_idx, "Normal")
            
            # Safely get confidence
            if label_idx < len(prediction_probs):
                model_confidence = float(prediction_probs[label_idx])
                confidence = min(0.99, max(0.65, model_confidence))
            else:
                confidence = 0.7  # Default confidence
            
            insights = get_risk_insights(label)
            
            analysis_record = {
                "id": len(analysis_history) + 1,
                "timestamp": datetime.now().isoformat(),
                "type": "speech_analysis",
                "prediction": label_idx,
                "label": label,
                "confidence": round(confidence, 3),
                "audio_features": audio_features,
                "prediction_probabilities": prediction_probs.tolist(),
                "insights": insights
            }
            analysis_history.append(analysis_record)
            
            logger.info(f"Speech prediction: {label} (confidence: {confidence:.2f})")
            
            return jsonify({
                "success": True,
                "prediction": label_idx,
                "label": label,
                "confidence": round(confidence, 3),
                "audio_features": audio_features,
                "prediction_probabilities": {
                    "Normal": float(prediction_probs[0]) if len(prediction_probs) > 0 else 0.0,
                    "At Risk": float(prediction_probs[1]) if len(prediction_probs) > 1 else 0.0,
                    "Impaired": float(prediction_probs[2]) if len(prediction_probs) > 2 else 0.0
                },
                "insights": insights,
                "analysis_id": analysis_record["id"],
                "timestamp": analysis_record["timestamp"]
            })
            
        except Exception as e:
            logger.error(f"Error in speech analysis: {e}", exc_info=True)
            return jsonify({
                "success": False,
                "error": f"Analysis failed: {str(e)}"
            }), 500
        finally:
            # Clean up uploaded file
            try:
                if os.path.exists(filepath):
                    os.remove(filepath)
            except Exception as cleanup_error:
                logger.warning(f"Error cleaning up file: {cleanup_error}")
        
    except Exception as e:
        logger.error(f"Error in speech prediction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get analysis history"""
    try:
        limit = request.args.get('limit', 10, type=int)
        analysis_type = request.args.get('type', None)
        
        filtered_history = analysis_history
        if analysis_type:
            filtered_history = [h for h in analysis_history if h['type'] == analysis_type]
        
        return jsonify({
            "success": True,
            "total": len(filtered_history),
            "history": filtered_history[-limit:][::-1]
        })
        
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/history/<int:analysis_id>', methods=['GET'])
def get_analysis_detail(analysis_id):
    """Get detailed analysis by ID"""
    try:
        analysis = next((h for h in analysis_history if h['id'] == analysis_id), None)
        
        if not analysis:
            return jsonify({"error": "Analysis not found"}), 404
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
        
    except Exception as e:
        logger.error(f"Error fetching analysis detail: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Get overall statistics"""
    try:
        if not analysis_history:
            return jsonify({
                "success": True,
                "total_analyses": 0,
                "statistics": {}
            })
        
        total = len(analysis_history)
        by_type = {}
        by_label = {}
        avg_confidence = []
        
        for record in analysis_history:
            rec_type = record['type']
            by_type[rec_type] = by_type.get(rec_type, 0) + 1
            
            label = record.get('label') or record.get('risk', 'Unknown')
            by_label[label] = by_label.get(label, 0) + 1
            
            avg_confidence.append(record['confidence'])
        
        return jsonify({
            "success": True,
            "total_analyses": total,
            "statistics": {
                "by_type": by_type,
                "by_label": by_label,
                "average_confidence": round(np.mean(avg_confidence), 3) if avg_confidence else 0,
                "most_recent": analysis_history[-1]['timestamp'] if analysis_history else None
            }
        })
        
    except Exception as e:
        logger.error(f"Error calculating statistics: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/neurotwin/update', methods=['POST'])
@limiter.limit("100 per hour")  # More lenient limit for test submissions
def update_neurotwin():
    """Update NeuroTwin profile with latest test results and predict future metrics"""
    try:
        data = request.json
        
        if 'user_id' not in data:
            return jsonify({"error": "user_id is required"}), 400
        
        user_id = str(data['user_id'])
        
        # Handle initial signup with user record
        if data.get('initial_setup') and data.get('user_record'):
            user_record = data['user_record']
            user_records[user_id] = user_record
            logger.info(f"User record saved for analysis: {user_id}")
        
        # Handle profile update
        if data.get('profile'):
            profile_data = data['profile']
            user_profiles[user_id] = profile_data
        
        test_results = data.get('test_results', {})
        
        # Extract cognitive metrics from test results
        metrics = extract_cognitive_metrics(test_results) if test_results else {}
        
        # Get or create NeuroTwin profile - try loading from MongoDB first
        if user_id not in neurotwin_profiles:
            # Try to load from MongoDB if available
            if MONGO_AVAILABLE and db:
                try:
                    stored_profile = db['neurotwin_profiles'].find_one({'_id': user_id})
                    if stored_profile:
                        neurotwin_profiles[user_id] = {
                            'user_id': user_id,
                            'history': stored_profile.get('history', []),
                            'predictions': stored_profile.get('predictions', {})
                        }
                        logger.info(f"Loaded NeuroTwin profile from MongoDB for user {user_id}")
                except Exception as e:
                    logger.warning(f"Error loading from MongoDB: {e}")
            
            # If still not found, try loading from file
            if user_id not in neurotwin_profiles:
                try:
                    load_neurotwin_from_file()
                except Exception as e:
                    logger.warning(f"Error loading from file: {e}")
            
            # If not found anywhere, create new profile
            if user_id not in neurotwin_profiles:
                neurotwin_profiles[user_id] = {
                    'user_id': user_id,
                    'history': [],
                    'predictions': {}
                }
        
        profile = neurotwin_profiles[user_id]
        
        # Add new entry to history if test results provided
        if test_results:
            new_entry = {
                'timestamp': datetime.now().isoformat(),
                'metrics': metrics,
                'test_results': test_results
            }
            profile['history'].append(new_entry)
            
            # Predict future metrics for next 7 days
            predictions = predict_future_metrics(profile['history'], days=7)
            profile['predictions'] = predictions
            
            # Check for metric drops and notify CareNetwork
            check_and_notify_metric_drop(user_id)
            
            # Save to MongoDB for persistence
            if MONGO_AVAILABLE and db:
                try:
                    db['neurotwin_profiles'].update_one(
                        {'_id': user_id},
                        {
                            '$set': {
                                'history': profile['history'],
                                'predictions': profile['predictions'],
                                'updated_at': datetime.now()
                            }
                        },
                        upsert=True
                    )
                    logger.info(f"Saved NeuroTwin profile to MongoDB for user {user_id}")
                except Exception as e:
                    logger.error(f"Error saving to MongoDB: {e}")
            
            # Always save to file as backup (even if MongoDB is available)
            try:
                save_neurotwin_to_file()
            except Exception as e:
                logger.warning(f"Error saving NeuroTwin to file: {e}")
        
        logger.info(f"NeuroTwin updated for user {user_id}: {len(profile['history'])} entries")
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "current_metrics": metrics if test_results else {},
            "predictions": profile.get('predictions', {}),
            "history_count": len(profile['history']),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error updating NeuroTwin: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/users/records', methods=['GET'])
def get_user_records():
    """Get all user records for analysis (admin endpoint)"""
    try:
        return jsonify({
            "success": True,
            "total_users": len(user_records),
            "user_records": user_records,
            "user_profiles": user_profiles
        })
    except Exception as e:
        logger.error(f"Error getting user records: {e}")
        return jsonify({"error": str(e)}), 500

# === Subscription & Credits Endpoints ===

def get_user_subscription(user_id):
    """Get user subscription from MongoDB or in-memory storage"""
    if MONGO_AVAILABLE and db:
        subscription = db.users.find_one({'_id': user_id}, {'subscription': 1})
        if subscription and 'subscription' in subscription:
            return subscription['subscription']
    return user_subscriptions.get(user_id, {'plan': 'free', 'status': 'active', 'credits': 0})

def save_user_subscription(user_id, subscription_data):
    """Save user subscription to MongoDB or in-memory storage"""
    if MONGO_AVAILABLE and db:
        db.users.update_one(
            {'_id': user_id},
            {'$set': {'subscription': subscription_data}},
            upsert=True
        )
    user_subscriptions[user_id] = subscription_data

def get_user_credits(user_id):
    """Get user credits from MongoDB or in-memory storage"""
    if MONGO_AVAILABLE and db:
        user = db.users.find_one({'_id': user_id}, {'credits': 1, 'last_refill': 1})
        if user:
            return {
                'balance': user.get('credits', 0),
                'last_refill': user.get('last_refill')
            }
    return user_credits.get(user_id, {'balance': 30, 'last_refill': None})

def update_user_credits(user_id, new_balance, last_refill=None):
    """Update user credits in MongoDB or in-memory storage"""
    if MONGO_AVAILABLE and db:
        update_data = {'credits': new_balance}
        if last_refill:
            update_data['last_refill'] = last_refill
        db.users.update_one(
            {'_id': user_id},
            {'$set': update_data},
            upsert=True
        )
    user_credits[user_id] = {'balance': new_balance, 'last_refill': last_refill}

def add_credit_history(user_id, action, amount, feature=None):
    """Add credit history entry"""
    entry = {
        'user_id': user_id,
        'timestamp': datetime.now().isoformat(),
        'action': action,  # 'used', 'earned', 'purchased', 'refill'
        'amount': amount,
        'feature': feature
    }
    
    if MONGO_AVAILABLE and db:
        db.credit_history.insert_one(entry)
    else:
        credit_history_storage.append(entry)
        # Keep only last 1000 entries in memory
        if len(credit_history_storage) > 1000:
            credit_history_storage.pop(0)

def check_daily_refill(user_id):
    """Check and apply daily credit refill for free users"""
    subscription = get_user_subscription(user_id)
    if subscription.get('plan') != 'free':
        return False
    
    credits_data = get_user_credits(user_id)
    last_refill = credits_data.get('last_refill')
    
    # Check if refill needed (once per day)
    now = datetime.now()
    if last_refill:
        last_refill_date = datetime.fromisoformat(last_refill) if isinstance(last_refill, str) else last_refill
        if (now - last_refill_date).days < 1:
            return False
    
    # Add 30 credits for free users
    current_balance = credits_data.get('balance', 0)
    new_balance = current_balance + 30
    update_user_credits(user_id, new_balance, now.isoformat())
    add_credit_history(user_id, 'refill', 30, 'daily_bonus')
    logger.info(f"Daily refill applied for user {user_id}: +30 credits")
    return True

@app.route('/api/user/subscription', methods=['GET'])
def get_subscription():
    """Get user's current subscription"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        subscription = get_user_subscription(user_id)
        check_daily_refill(user_id)  # Check for daily refill
        
        return jsonify({
            "success": True,
            "plan": subscription.get('plan', 'free'),
            "status": subscription.get('status', 'active'),
            "expiry": subscription.get('expiry'),
            "stripe_customer_id": subscription.get('stripe_customer_id')
        })
    except Exception as e:
        logger.error(f"Error getting subscription: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/credits', methods=['GET'])
def get_credits():
    """Get user's credit balance and history"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        # Check for daily refill
        check_daily_refill(user_id)
        
        credits_data = get_user_credits(user_id)
        
        # Get credit history
        history = []
        if MONGO_AVAILABLE and db:
            history = list(db.credit_history.find(
                {'user_id': user_id},
                {'_id': 0}
            ).sort('timestamp', -1).limit(50))
        else:
            history = [h for h in credit_history_storage if h['user_id'] == user_id][-50:]
            history.reverse()
        
        return jsonify({
            "success": True,
            "balance": credits_data.get('balance', 0),
            "last_refill": credits_data.get('last_refill'),
            "history": history
        })
    except Exception as e:
        logger.error(f"Error getting credits: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/use_credits', methods=['POST'])
def use_credits():
    """Deduct credits for a feature"""
    try:
        data = request.json
        user_id = data.get('user_id')
        feature = data.get('feature', 'unknown')
        amount = data.get('amount', 1)
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        # Check for daily refill first
        check_daily_refill(user_id)
        
        credits_data = get_user_credits(user_id)
        current_balance = credits_data.get('balance', 0)
        
        if current_balance < amount:
            return jsonify({
                "error": "Not enough credits",
                "required": amount,
                "available": current_balance
            }), 402
        
        # Deduct credits
        new_balance = current_balance - amount
        update_user_credits(user_id, new_balance)
        add_credit_history(user_id, 'used', amount, feature)
        
        logger.info(f"User {user_id} used {amount} credits for {feature}")
        
        return jsonify({
            "success": True,
            "balance": new_balance,
            "used": amount
        })
    except Exception as e:
        logger.error(f"Error using credits: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/add_credits', methods=['POST'])
def add_credits():
    """Add credits (purchase, reward, referral)"""
    try:
        data = request.json
        user_id = data.get('user_id')
        amount = data.get('amount', 0)
        action = data.get('action', 'purchased')  # 'purchased', 'reward', 'referral'
        feature = data.get('feature', 'manual')
        
        if not user_id or amount <= 0:
            return jsonify({"error": "user_id and amount (positive) are required"}), 400
        
        credits_data = get_user_credits(user_id)
        current_balance = credits_data.get('balance', 0)
        new_balance = current_balance + amount
        
        update_user_credits(user_id, new_balance)
        add_credit_history(user_id, action, amount, feature)
        
        logger.info(f"Added {amount} credits to user {user_id} ({action})")
        
        return jsonify({
            "success": True,
            "balance": new_balance,
            "added": amount
        })
    except Exception as e:
        logger.error(f"Error adding credits: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/subscribe', methods=['POST'])
def create_subscription():
    """Create Stripe checkout session for subscription or credit purchase"""
    try:
        if not STRIPE_AVAILABLE:
            return jsonify({"error": "Stripe is not configured"}), 503
        
        data = request.json
        user_id = data.get('user_id')
        plan = data.get('plan', 'pro')
        billing = data.get('billing', 'monthly')
        purchase_type = data.get('type', 'subscription')  # 'subscription' or 'credits'
        credit_amount = data.get('amount', 100)  # For credit purchases
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
        
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        if purchase_type == 'credits':
            # One-time payment for credits
            price_map = {
                100: 200,  # $2.00 in cents
                500: 800,  # $8.00 in cents
                1000: 1500  # $15.00 in cents
            }
            amount = price_map.get(credit_amount, 200)
            
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'{credit_amount} Credits',
                            'description': 'AI Cognitive Assistant Credits'
                        },
                        'unit_amount': amount,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f'{frontend_url}/profile?success=true&credits={credit_amount}',
                cancel_url=f'{frontend_url}/pricing?canceled=true',
                metadata={
                    'user_id': user_id,
                    'type': 'credits',
                    'credit_amount': credit_amount
                }
            )
        else:
            # Subscription payment
            price_map = {
                'pro': {'monthly': 'price_pro_monthly', 'yearly': 'price_pro_yearly'},
                'premium': {'monthly': 'price_premium_monthly', 'yearly': 'price_premium_yearly'}
            }
            
            # In production, use actual Stripe Price IDs
            # For now, create price on the fly
            price_id = price_map.get(plan, {}).get(billing)
            
            if not price_id:
                # Create price dynamically (for demo)
                prices = {
                    ('pro', 'monthly'): 999,  # $9.99
                    ('pro', 'yearly'): 9999,  # $99.99
                    ('premium', 'monthly'): 2499,  # $24.99
                    ('premium', 'yearly'): 24999  # $249.99
                }
                amount = prices.get((plan, billing), 999)
                
                session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price_data': {
                            'currency': 'usd',
                            'product_data': {
                                'name': f'{plan.capitalize()} Plan ({billing.capitalize()})',
                                'description': f'NeuroNest {plan.capitalize()} Subscription'
                            },
                            'unit_amount': amount,
                            'recurring': {
                                'interval': billing.replace('yearly', 'year').replace('monthly', 'month')
                            }
                        },
                        'quantity': 1,
                    }],
                    mode='subscription',
                    success_url=f'{frontend_url}/profile?success=true&plan={plan}',
                    cancel_url=f'{frontend_url}/pricing?canceled=true',
                    metadata={
                        'user_id': user_id,
                        'plan': plan,
                        'billing': billing
                    }
                )
            else:
                session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{'price': price_id, 'quantity': 1}],
                    mode='subscription',
                    success_url=f'{frontend_url}/profile?success=true&plan={plan}',
                    cancel_url=f'{frontend_url}/pricing?canceled=true',
                    metadata={
                        'user_id': user_id,
                        'plan': plan,
                        'billing': billing
                    }
                )
        
        return jsonify({
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id
        })
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    try:
        if not STRIPE_AVAILABLE:
            return jsonify({"error": "Stripe not configured"}), 503
        
        payload = request.data
        sig_header = request.headers.get('Stripe-Signature')
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', '')
        
        if webhook_secret:
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, webhook_secret
                )
            except ValueError:
                return jsonify({"error": "Invalid payload"}), 400
            except stripe.error.SignatureVerificationError:
                return jsonify({"error": "Invalid signature"}), 400
        else:
            # For development, parse JSON directly
            event = json.loads(payload)
        
        # Handle the event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = session['metadata'].get('user_id')
            purchase_type = session['metadata'].get('type', 'subscription')
            
            if purchase_type == 'credits':
                # Add credits
                credit_amount = int(session['metadata'].get('credit_amount', 100))
                credits_data = get_user_credits(user_id)
                new_balance = credits_data.get('balance', 0) + credit_amount
                update_user_credits(user_id, new_balance)
                add_credit_history(user_id, 'purchased', credit_amount, 'stripe_payment')
                logger.info(f"Credits purchased: {credit_amount} for user {user_id}")
            else:
                # Update subscription
                plan = session['metadata'].get('plan', 'pro')
                billing = session['metadata'].get('billing', 'monthly')
                
                # Calculate expiry date
                if billing == 'monthly':
                    expiry = (datetime.now() + timedelta(days=30)).isoformat()
                else:
                    expiry = (datetime.now() + timedelta(days=365)).isoformat()
                
                subscription_data = {
                    'plan': plan,
                    'status': 'active',
                    'expiry': expiry,
                    'stripe_customer_id': session.get('customer'),
                    'stripe_subscription_id': session.get('subscription')
                }
                save_user_subscription(user_id, subscription_data)
                
                # Give bonus credits based on plan
                bonus_credits = {'pro': 100, 'premium': 250}.get(plan, 0)
                if bonus_credits > 0:
                    credits_data = get_user_credits(user_id)
                    new_balance = credits_data.get('balance', 0) + bonus_credits
                    update_user_credits(user_id, new_balance)
                    add_credit_history(user_id, 'reward', bonus_credits, 'subscription_bonus')
                
                logger.info(f"Subscription activated: {plan} for user {user_id}")
        
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user/upgrade_plan', methods=['POST'])
def upgrade_plan():
    """Change user subscription tier"""
    try:
        data = request.json
        user_id = data.get('user_id')
        new_plan = data.get('plan')
        
        if not user_id or not new_plan:
            return jsonify({"error": "user_id and plan are required"}), 400
        
        subscription = get_user_subscription(user_id)
        old_plan = subscription.get('plan', 'free')
        
        # Update subscription
        subscription['plan'] = new_plan
        subscription['status'] = 'active'
        save_user_subscription(user_id, subscription)
        
        logger.info(f"User {user_id} upgraded from {old_plan} to {new_plan}")
        
        return jsonify({
            "success": True,
            "old_plan": old_plan,
            "new_plan": new_plan
        })
    except Exception as e:
        logger.error(f"Error upgrading plan: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/neurotwin/<user_id>', methods=['GET', 'OPTIONS'])
@limiter.exempt  # Exempt from rate limiting - this is a read-only operation
def get_neurotwin(user_id):
    """Get NeuroTwin profile for a user with in-depth analysis"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    try:
        user_id = str(user_id)
        
        # Try to load from MongoDB if not in memory
        if user_id not in neurotwin_profiles:
            if MONGO_AVAILABLE and db:
                try:
                    stored_profile = db['neurotwin_profiles'].find_one({'_id': user_id})
                    if stored_profile:
                        neurotwin_profiles[user_id] = {
                            'user_id': user_id,
                            'history': stored_profile.get('history', []),
                            'predictions': stored_profile.get('predictions', {})
                        }
                        logger.info(f"Loaded NeuroTwin profile from MongoDB for user {user_id}")
                except Exception as e:
                    logger.warning(f"Error loading from MongoDB: {e}")
            
            # If still not found, try loading from file
            if user_id not in neurotwin_profiles:
                try:
                    load_neurotwin_from_file()
                except Exception as e:
                    logger.warning(f"Error loading from file: {e}")
        
        if user_id not in neurotwin_profiles:
            response = jsonify({
                "success": False,
                "error": "NeuroTwin profile not found",
                "user_id": user_id
            })
            response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
            response.headers.add('Access-Control-Allow-Credentials', 'true')
            return response, 404
        
        profile = neurotwin_profiles[user_id]
        
        # Initialize default values
        aggregate_metrics = {}
        trends = {}
        test_types = {}
        insights = []
        current_metrics = None
        history = []
        
        try:
            # Calculate aggregate metrics from history
            history = profile.get('history', [])
            if history and len(history) > 0:
                # Filter out entries without metrics or with invalid metrics
                valid_entries = []
                for entry in history:
                    metrics = entry.get('metrics')
                    if metrics and isinstance(metrics, dict):
                        valid_entries.append(entry)
                
                if valid_entries and len(valid_entries) > 0:
                    all_metrics = [entry['metrics'] for entry in valid_entries]
                    if all_metrics and len(all_metrics) > 0:
                        aggregate_metrics = {
                            key: sum(m.get(key, 0) for m in all_metrics) / len(all_metrics)
                            for key in ['attention', 'memory', 'speed', 'verbal_fluency', 'executive_function', 'processing_speed']
                        }
                    else:
                        aggregate_metrics = {}
                        all_metrics = []
                    
                    # Calculate trends (improving/declining)
                    if aggregate_metrics and all_metrics and len(all_metrics) >= 2:
                        try:
                            recent_metrics = all_metrics[-5:]  # Last 5 tests
                            older_metrics = all_metrics[:max(1, len(all_metrics) - 5)]
                            
                            if len(recent_metrics) > 0 and len(older_metrics) > 0:
                                recent_avg = {
                                    key: sum(m.get(key, 0) for m in recent_metrics) / len(recent_metrics)
                                    for key in aggregate_metrics.keys()
                                }
                                older_avg = {
                                    key: sum(m.get(key, 0) for m in older_metrics) / len(older_metrics)
                                    for key in aggregate_metrics.keys()
                                }
                                
                                trends = {
                                    key: 'improving' if recent_avg[key] > older_avg[key] * 1.05 
                                         else 'declining' if recent_avg[key] < older_avg[key] * 0.95
                                         else 'stable'
                                    for key in aggregate_metrics.keys()
                                }
                            else:
                                trends = {key: 'insufficient_data' for key in aggregate_metrics.keys()}
                        except Exception as e:
                            logger.warning(f"Error calculating trends: {e}")
                            trends = {key: 'insufficient_data' for key in aggregate_metrics.keys()}
                    else:
                        trends = {key: 'insufficient_data' for key in aggregate_metrics.keys()} if aggregate_metrics else {}
                    
                    # Test type distribution
                    test_types = {}
                    for entry in history:
                        test_type = entry.get('test_results', {}).get('test_type', 'unknown')
                        test_types[test_type] = test_types.get(test_type, 0) + 1
                    
                    # Performance insights
                    try:
                        insights = generate_performance_insights(aggregate_metrics, trends, history)
                    except Exception as e:
                        logger.warning(f"Error generating insights: {e}")
                        insights = []
                    
                    # Get current metrics (from last entry with metrics)
                    if valid_entries and len(valid_entries) > 0:
                        current_metrics = valid_entries[-1].get('metrics')
                    else:
                        current_metrics = None
                else:
                    aggregate_metrics = {}
                    trends = {}
                    test_types = {}
                    insights = []
                    current_metrics = None
            else:
                aggregate_metrics = {}
                trends = {}
                test_types = {}
                insights = []
                current_metrics = None

            # Predict future if we have history
            predictions = profile.get('predictions', {})
            if not predictions and history:
                try:
                    predictions = predict_future_metrics(history, days=7)
                    if predictions:
                        profile['predictions'] = predictions
                except Exception as e:
                    logger.warning(f"Error predicting future metrics: {e}")
                    predictions = {}
            else:
                predictions = predictions or {}

        except Exception as calc_error:
            import traceback
            logger.error(f"Error calculating metrics for user {user_id}: {calc_error}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            # Use default values already set above
            predictions = {}
        
        response = jsonify({
            "success": True,
            "user_id": user_id,
            "current_metrics": current_metrics or {},
            "aggregate_metrics": aggregate_metrics,
            "trends": trends,
            "test_types": test_types,
            "insights": insights,
            "predictions": predictions if 'predictions' in locals() else {},
            "history": history,
            "test_history": history,  # Also include as test_history for compatibility
            "history_count": len(history)
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logger.error(f"Error getting NeuroTwin for user {user_id}: {e}")
        logger.error(f"Traceback: {error_trace}")
        response = jsonify({
            "success": False,
            "error": str(e),
            "user_id": user_id
        })
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response, 500

@app.route('/api/test-scores/<user_id>', methods=['GET'])
def get_test_scores(user_id):
    """Get all test scores for a user - comprehensive test history"""
    try:
        user_id = str(user_id)
        
        if user_id not in neurotwin_profiles:
            return jsonify({
                "success": False,
                "error": "User profile not found",
                "user_id": user_id
            }), 404
        
        profile = neurotwin_profiles[user_id]
        history = profile.get('history', [])
        
        # Organize by test type
        scores_by_type = {}
        for entry in history:
            test_type = entry.get('test_results', {}).get('test_type', 'unknown')
            if test_type not in scores_by_type:
                scores_by_type[test_type] = []
            
            scores_by_type[test_type].append({
                'timestamp': entry.get('timestamp'),
                'test_results': entry.get('test_results', {}),
                'metrics': entry.get('metrics', {})
            })
        
        # Calculate statistics per test type
        statistics = {}
        for test_type, scores in scores_by_type.items():
            if scores:
                # Get latest score
                latest = scores[-1]
                
                # Calculate averages if applicable
                if 'accuracy' in latest['test_results']:
                    accuracies = [s['test_results'].get('accuracy', 0) for s in scores if 'accuracy' in s['test_results']]
                    statistics[test_type] = {
                        'test_count': len(scores),
                        'latest_accuracy': latest['test_results'].get('accuracy'),
                        'avg_accuracy': sum(accuracies) / len(accuracies) if accuracies else 0,
                        'latest_timestamp': latest['timestamp']
                    }
                elif 'score' in latest['test_results']:
                    scores_list = [s['test_results'].get('score', 0) for s in scores if 'score' in s['test_results']]
                    statistics[test_type] = {
                        'test_count': len(scores),
                        'latest_score': latest['test_results'].get('score'),
                        'avg_score': sum(scores_list) / len(scores_list) if scores_list else 0,
                        'best_score': max(scores_list) if scores_list else 0,
                        'latest_timestamp': latest['timestamp']
                    }
                else:
                    statistics[test_type] = {
                        'test_count': len(scores),
                        'latest_timestamp': latest['timestamp']
                    }
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "total_tests": len(history),
            "scores_by_type": scores_by_type,
            "statistics": statistics,
            "all_scores": history
        })
        
    except Exception as e:
        logger.error(f"Error getting test scores: {e}")
        return jsonify({"error": str(e)}), 500

def generate_performance_insights(metrics, trends, history):
    """Generate in-depth performance insights from test history"""
    insights = []
    
    # Overall cognitive health
    avg_cognitive_score = sum(metrics.values()) / len(metrics) if metrics else 0
    if avg_cognitive_score >= 0.8:
        insights.append({
            'type': 'positive',
            'category': 'overall',
            'message': 'Excellent overall cognitive performance!',
            'recommendation': 'Maintain your current routine and continue regular testing.'
        })
    elif avg_cognitive_score >= 0.6:
        insights.append({
            'type': 'neutral',
            'category': 'overall',
            'message': 'Good cognitive performance with room for improvement.',
            'recommendation': 'Consider cognitive training exercises to enhance specific areas.'
        })
    else:
        insights.append({
            'type': 'attention',
            'category': 'overall',
            'message': 'Cognitive performance may benefit from targeted interventions.',
            'recommendation': 'Consult with a healthcare provider and focus on areas showing decline.'
        })
    
    # Specific metric insights
    if metrics.get('memory', 0) < 0.5:
        insights.append({
            'type': 'attention',
            'category': 'memory',
            'message': 'Memory performance is below average.',
            'recommendation': 'Focus on memory-specific exercises like N-Back and Memory Match tests.'
        })
    
    if metrics.get('attention', 0) < 0.5:
        insights.append({
            'type': 'attention',
            'category': 'attention',
            'message': 'Attention metrics show room for improvement.',
            'recommendation': 'Practice attention-focused tests like Flanker Task and Go-No-Go.'
        })
    
    if metrics.get('executive_function', 0) < 0.5:
        insights.append({
            'type': 'attention',
            'category': 'executive_function',
            'message': 'Executive function could be enhanced.',
            'recommendation': 'Engage in Stroop and Trail-Making tests to improve cognitive control.'
        })
    
    # Trend-based insights
    if trends:
        declining_areas = [key for key, trend in trends.items() if trend == 'declining']
        if declining_areas:
            insights.append({
                'type': 'warning',
                'category': 'trend',
                'message': f'Declining trends detected in: {", ".join(declining_areas)}',
                'recommendation': 'Consider more frequent testing and targeted interventions for these areas.'
            })
        
        improving_areas = [key for key, trend in trends.items() if trend == 'improving']
        if improving_areas:
            insights.append({
                'type': 'positive',
                'category': 'trend',
                'message': f'Improving trends in: {", ".join(improving_areas)}',
                'recommendation': 'Great progress! Continue with current training approach.'
            })
    
    # Test frequency insight
    if len(history) < 5:
        insights.append({
            'type': 'info',
            'category': 'frequency',
            'message': 'More test data needed for accurate analysis.',
            'recommendation': 'Take more tests to build a comprehensive cognitive profile.'
        })
    
    return insights

# === NeuroDrift Endpoint ===
@app.route('/api/neurodrift', methods=['POST'])
def calculate_neurodrift():
    """Calculate Brain Stability Index from cognitive tests and wearable data"""
    try:
        data = request.json
        user_id = str(data.get('user_id', 'demo-user-123'))
        days = int(data.get('days', 7))
        
        # Get recent test results
        profile = neurotwin_profiles.get(user_id, {})
        history = profile.get('history', [])
        
        if len(history) < 2:
            return jsonify({
                "success": False,
                "error": "Insufficient data. Need at least 2 test results."
            }), 400
        
        # Get wearable data (mock or from Fitbit API)
        wearable_data = data.get('wearable_data', {})
        if not wearable_data:
            # Generate mock wearable data
            wearable_data = generate_mock_wearable_data(days)
        
        # Calculate metrics for each day
        daily_metrics = []
        history_len = len(history)
        if history_len == 0:
            return jsonify({"error": "No history available"}), 400
        
        for i in range(min(days, history_len)):
            # Safely get entry, avoiding index out of range
            # Start from the most recent entry and work backwards
            idx = history_len - 1 - i
            if idx < 0:
                idx = 0
            entry = history[idx]
            metrics = entry.get('metrics', {})
            
            # Combine cognitive metrics with wearable data
            day_data = {
                'date': entry.get('timestamp', datetime.now().isoformat()),
                'focus': metrics.get('attention', 0.5) * 100,
                'mood': calculate_mood_score(metrics, wearable_data.get(f'day_{i+1}', {})),
                'alertness': calculate_alertness_score(metrics, wearable_data.get(f'day_{i+1}', {}))
            }
            daily_metrics.append(day_data)
        
        # Calculate Brain Stability Index (0-100)
        stability_index = calculate_stability_index(daily_metrics)
        
        # Calculate change from previous period
        previous_stability = calculate_stability_index(daily_metrics[:-1]) if len(daily_metrics) > 1 else stability_index
        stability_change = stability_index - previous_stability
        
        return jsonify({
            "success": True,
            "stability_index": round(stability_index, 2),
            "stability_change": round(stability_change, 2),
            "daily_metrics": daily_metrics,
            "alert": {
                "show": stability_change < -5,
                "message": f"Your stability dropped {abs(stability_change):.1f}% — check sleep quality."
            } if stability_change < -5 else None
        })
        
    except Exception as e:
        logger.error(f"Error calculating neurodrift: {e}")
        return jsonify({"error": str(e)}), 500

def generate_mock_wearable_data(days):
    """Generate mock wearable data for testing"""
    data = {}
    for i in range(days):
        data[f'day_{i+1}'] = {
            'sleep_hours': np.random.uniform(6, 9),
            'steps': int(np.random.uniform(5000, 12000)),
            'heart_rate_avg': int(np.random.uniform(60, 80)),
            'stress_level': np.random.uniform(0, 1)
        }
    return data

def calculate_mood_score(metrics, wearable):
    """Calculate mood score from metrics and wearable data"""
    base_mood = (metrics.get('attention', 0.5) + metrics.get('verbal_fluency', 0.5)) / 2
    sleep_factor = min(1.0, wearable.get('sleep_hours', 7) / 8)
    stress_factor = 1.0 - wearable.get('stress_level', 0.5)
    return min(100, max(0, (base_mood * 0.6 + sleep_factor * 0.2 + stress_factor * 0.2) * 100))

def calculate_alertness_score(metrics, wearable):
    """Calculate alertness score"""
    base_alertness = metrics.get('speed', 0.5)
    sleep_factor = min(1.0, wearable.get('sleep_hours', 7) / 8)
    return min(100, max(0, (base_alertness * 0.7 + sleep_factor * 0.3) * 100))

def calculate_stability_index(daily_metrics):
    """Calculate Brain Stability Index from daily metrics"""
    if not daily_metrics:
        return 50.0
    
    focus_values = [d['focus'] for d in daily_metrics]
    mood_values = [d['mood'] for d in daily_metrics]
    alertness_values = [d['alertness'] for d in daily_metrics]
    
    # Calculate coefficient of variation (lower = more stable)
    focus_cv = np.std(focus_values) / (np.mean(focus_values) + 1e-6)
    mood_cv = np.std(mood_values) / (np.mean(mood_values) + 1e-6)
    alertness_cv = np.std(alertness_values) / (np.mean(alertness_values) + 1e-6)
    
    # Stability = 100 - (average CV * 100)
    avg_cv = (focus_cv + mood_cv + alertness_cv) / 3
    stability = max(0, min(100, 100 - (avg_cv * 50)))
    
    return stability

# === Emotion Analysis Endpoint ===
@app.route('/api/emotion-analyze', methods=['POST'])
def analyze_emotion():
    """Analyze emotions from audio and optional webcam frame"""
    try:
        audio_file = request.files.get('audio')
        image_data = request.form.get('image')  # base64 encoded
        
        emotions = {
            'stress': 0.0,
            'joy': 0.0,
            'fatigue': 0.0,
            'neutral': 0.0,
            'sadness': 0.0,
            'anger': 0.0
        }
        
        # Analyze audio emotion
        if audio_file:
            try:
                filename = secure_filename(audio_file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{datetime.now().timestamp()}_{filename}")
                audio_file.save(filepath)
                
                y, sr = librosa.load(filepath, sr=16000, duration=10)
                audio_emotions = analyze_audio_emotion(y, sr)
                emotions.update(audio_emotions)
                
                os.remove(filepath)
            except Exception as e:
                logger.error(f"Error analyzing audio emotion: {e}")
        
        # Analyze facial emotion
        if image_data:
            try:
                face_emotions = analyze_facial_emotion(image_data)
                # Combine with audio (weighted average)
                for key in emotions:
                    emotions[key] = (emotions[key] * 0.4 + face_emotions.get(key, 0) * 0.6)
            except Exception as e:
                logger.error(f"Error analyzing facial emotion: {e}")
        
        # Normalize to sum to 1.0
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: v / total for k, v in emotions.items()}
        
        return jsonify({
            "success": True,
            "emotions": emotions,
            "dominant_emotion": max(emotions.items(), key=lambda x: x[1])[0],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in emotion analysis: {e}")
        return jsonify({"error": str(e)}), 500

def analyze_audio_emotion(y, sr):
    """Analyze emotion from audio using pyAudioAnalysis-like features"""
    emotions = {'stress': 0.0, 'joy': 0.0, 'fatigue': 0.0, 'neutral': 0.5, 'sadness': 0.0, 'anger': 0.0}
    
    try:
        # Extract features
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        zcr = librosa.feature.zero_crossing_rate(y)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        
        # Simple heuristic-based emotion detection
        avg_zcr = np.mean(zcr)
        avg_centroid = np.mean(spectral_centroid)
        energy = np.mean(librosa.feature.rms(y=y))
        
        # High energy + high centroid = joy
        if energy > 0.1 and avg_centroid > 2000:
            emotions['joy'] = min(0.8, energy * 2)
        
        # Low energy + low centroid = fatigue/sadness
        if energy < 0.05:
            emotions['fatigue'] = 0.6
            emotions['sadness'] = 0.3
        
        # High ZCR = stress/anger
        if avg_zcr > 0.1:
            emotions['stress'] = min(0.7, avg_zcr * 5)
            emotions['anger'] = min(0.5, avg_zcr * 3)
        
        # Normalize
        total = sum(emotions.values())
        if total > 0:
            emotions = {k: v / total for k, v in emotions.items()}
            
    except Exception as e:
        logger.error(f"Error in audio emotion analysis: {e}")
    
    return emotions

def analyze_facial_emotion(image_data):
    """Analyze facial emotion using FER (Facial Expression Recognition)"""
    emotions = {'stress': 0.0, 'joy': 0.0, 'fatigue': 0.0, 'neutral': 0.5, 'sadness': 0.0, 'anger': 0.0}
    
    try:
        # Decode base64 image
        if ',' in image_data:
            parts = image_data.split(',')
            if len(parts) > 1:
                image_data = parts[1]
            else:
                image_data = parts[0]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image_array = np.array(image)
        
        # Convert to BGR for OpenCV
        if len(image_array.shape) == 3:
            image_bgr = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
        else:
            image_bgr = image_array
        
        # Try to use FER if available, otherwise use simple heuristics
        try:
            from fer import FER
            detector = FER(mtcnn=True)
            result = detector.detect_emotions(image_bgr)
            
            if result and len(result) > 0 and 'emotions' in result[0]:
                emotions_dict = result[0]['emotions']
                # Map FER emotions to our format
                emotions['joy'] = emotions_dict.get('happy', 0)
                emotions['sadness'] = emotions_dict.get('sad', 0)
                emotions['anger'] = emotions_dict.get('angry', 0)
                emotions['stress'] = (emotions_dict.get('fear', 0) + emotions_dict.get('angry', 0)) / 2
                emotions['neutral'] = emotions_dict.get('neutral', 0.5)
        except ImportError:
            # Fallback: simple heuristic based on face detection
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            if len(faces) > 0:
                # Simple heuristic: if face detected, assume neutral
                emotions['neutral'] = 0.7
                
    except Exception as e:
        logger.error(f"Error in facial emotion analysis: {e}")
    
    return emotions

# === NeuroAge Endpoint ===
@app.route('/api/neuroage', methods=['POST'])
def calculate_neuroage():
    """Calculate cognitive age and update leaderboard"""
    try:
        data = request.json
        user_id = str(data.get('user_id', 'demo-user-123'))
        base_age = int(data.get('base_age', 30))
        region = data.get('region', 'global')
        
        # Get performance score from recent tests
        profile = neurotwin_profiles.get(user_id, {})
        history = profile.get('history', [])
        
        if not history:
            return jsonify({
                "success": False,
                "error": "No test history available"
            }), 400
        
        # Calculate average performance score (0-100)
        recent_scores = []
        for entry in history[-5:]:  # Last 5 tests
            metrics = entry.get('metrics', {})
            score = (
                metrics.get('attention', 0) * 25 +
                metrics.get('memory', 0) * 25 +
                metrics.get('speed', 0) * 25 +
                metrics.get('verbal_fluency', 0) * 25
            ) * 100
            recent_scores.append(score)
        
        performance_score = np.mean(recent_scores) if recent_scores else 50.0
        
        # Cognitive age = base_age - performance_score/10
        cognitive_age = base_age - (performance_score / 10)
        cognitive_age = max(18, min(100, cognitive_age))  # Clamp between 18-100
        
        # Update leaderboard
        update_leaderboard(user_id, performance_score, region, cognitive_age)
        
        # Get rank
        rank = get_user_rank(user_id, region)
        
        return jsonify({
            "success": True,
            "cognitive_age": round(cognitive_age, 1),
            "base_age": base_age,
            "performance_score": round(performance_score, 2),
            "rank": rank,
            "region": region,
            "total_peers": len(leaderboard_data.get(region, []))
        })
        
    except Exception as e:
        logger.error(f"Error calculating neuroage: {e}")
        return jsonify({"error": str(e)}), 500

def update_leaderboard(user_id, score, region, cognitive_age):
    """Update leaderboard for a region"""
    if region not in leaderboard_data:
        leaderboard_data[region] = []
    
    # Find or update user entry
    user_entry = None
    for entry in leaderboard_data[region]:
        if entry['user_id'] == user_id:
            user_entry = entry
            break
    
    if user_entry:
        user_entry['score'] = score
        user_entry['cognitive_age'] = cognitive_age
        user_entry['updated_at'] = datetime.now().isoformat()
    else:
        leaderboard_data[region].append({
            'user_id': user_id,
            'score': score,
            'cognitive_age': cognitive_age,
            'updated_at': datetime.now().isoformat()
        })
    
    # Sort by score (descending) and assign ranks
    leaderboard_data[region].sort(key=lambda x: x['score'], reverse=True)
    for i, entry in enumerate(leaderboard_data[region]):
        entry['rank'] = i + 1
    
    # Keep top 100
    leaderboard_data[region] = leaderboard_data[region][:100]
    
    # Save to MongoDB if available
    if MONGO_AVAILABLE and db:
        try:
            collection = db['leaderboards']
            collection.update_one(
                {'user_id': user_id, 'region': region},
                {
                    '$set': {
                        'score': score,
                        'cognitive_age': cognitive_age,
                        'updated_at': datetime.now()
                    }
                },
                upsert=True
            )
        except Exception as e:
            logger.error(f"Error saving to MongoDB: {e}")

def get_user_rank(user_id, region):
    """Get user's rank in leaderboard"""
    if region not in leaderboard_data:
        return None
    
    for entry in leaderboard_data[region]:
        if entry['user_id'] == user_id:
            return entry['rank']
    
    return None

# === Cognitive Fingerprint Endpoints ===
@app.route('/api/auth/fingerprint-login', methods=['POST'])
def fingerprint_login():
    """Login using cognitive fingerprint (voice + face)"""
    try:
        data = request.json
        audio_embedding = data.get('audio_embedding', [])
        face_embedding = data.get('face_embedding', [])
        
        if not audio_embedding or not face_embedding:
            return jsonify({
                "success": False,
                "error": "Both audio and face embeddings required"
            }), 400
        
        # Find matching user by cosine similarity
        threshold = 0.85  # Similarity threshold
        best_match = None
        best_similarity = 0.0
        
        for user_id, fingerprint in cognitive_fingerprints.items():
            # Decrypt stored embeddings
            stored_audio_enc = fingerprint.get('voice_embedding', [])
            stored_face_enc = fingerprint.get('face_embedding', [])
            
            stored_audio = np.array(decrypt_data(stored_audio_enc) if cipher_suite and isinstance(stored_audio_enc, str) else stored_audio_enc)
            stored_face = np.array(decrypt_data(stored_face_enc) if cipher_suite and isinstance(stored_face_enc, str) else stored_face_enc)
            
            input_audio = np.array(audio_embedding)
            input_face = np.array(face_embedding)
            
            if len(stored_audio) > 0 and len(stored_face) > 0:
                # Calculate cosine similarity
                audio_sim = cosine_similarity([input_audio], [stored_audio])[0][0]
                face_sim = cosine_similarity([input_face], [stored_face])[0][0]
                
                # Combined similarity (weighted average)
                combined_sim = (audio_sim * 0.5 + face_sim * 0.5)
                
                if combined_sim > best_similarity:
                    best_similarity = combined_sim
                    best_match = user_id
        
        if best_match and best_similarity >= threshold:
            return jsonify({
                "success": True,
                "user_id": best_match,
                "similarity": round(float(best_similarity), 3),
                "message": "Cognitive ID verified successfully"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Cognitive ID not recognized",
                "similarity": round(float(best_similarity), 3) if best_match else 0.0
            }), 401
        
    except Exception as e:
        logger.error(f"Error in fingerprint login: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/fingerprint/register', methods=['POST'])
def register_fingerprint():
    """Register or update cognitive fingerprint"""
    try:
        data = request.json
        user_id = str(data.get('user_id'))
        audio_embedding = data.get('audio_embedding', [])
        face_embedding = data.get('face_embedding', [])
        
        if not audio_embedding or not face_embedding:
            return jsonify({
                "success": False,
                "error": "Both audio and face embeddings required"
            }), 400
        
        # Encrypt and store fingerprint
        encrypted_voice = encrypt_data(audio_embedding) if cipher_suite else audio_embedding
        encrypted_face = encrypt_data(face_embedding) if cipher_suite else face_embedding
        
        cognitive_fingerprints[user_id] = {
            'voice_embedding': encrypted_voice,
            'face_embedding': encrypted_face,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Save to MongoDB if available
        if MONGO_AVAILABLE and db:
            try:
                collection = db['cognitive_fingerprints']
                collection.update_one(
                    {'user_id': user_id},
                    {
                        '$set': {
                            'voice_embedding': audio_embedding,
                            'face_embedding': face_embedding,
                            'updated_at': datetime.now()
                        }
                    },
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving fingerprint to MongoDB: {e}")
        
        return jsonify({
            "success": True,
            "user_id": user_id,
            "message": "Cognitive fingerprint registered successfully"
        })
        
    except Exception as e:
        logger.error(f"Error registering fingerprint: {e}")
        return jsonify({"error": str(e)}), 500

# === NeuroCoach Chatbot Endpoint ===
@app.route('/api/coach', methods=['POST'])
@limiter.limit("10 per minute")
def neurocoach_chat():
    """NeuroCoach chatbot using OpenAI GPT-4o"""
    try:
        user_id = request.json.get('user_id', 'demo-user-123')
        message = request.json.get('message', '')
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        # Get user's NeuroTwin data
        profile = neurotwin_profiles.get(user_id, {})
        history = profile.get('history', [])
        current_metrics = None
        if history:
            current_metrics = history[-1].get('metrics', {})
        
        # Get recent test results
        recent_tests = analysis_history[-5:] if len(analysis_history) > 0 else []
        
        # Build context for OpenAI
        if current_metrics:
            metrics_text = f"""- Attention: {current_metrics.get('attention', 0) * 100:.1f}%
- Memory: {current_metrics.get('memory', 0) * 100:.1f}%
- Speed: {current_metrics.get('speed', 0) * 100:.1f}%
- Verbal Fluency: {current_metrics.get('verbal_fluency', 0) * 100:.1f}%"""
        else:
            metrics_text = "No metrics available yet"
        
        context = f"""You are NeuroCoach, a friendly AI cognitive health coach. 

User's current cognitive metrics:
{metrics_text}

Recent test history: {len(history)} tests completed.

Provide personalized, encouraging feedback. Be specific about improvements and offer actionable advice."""
        
        if GEMINI_AVAILABLE:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=context)
                response = model.generate_content(message, generation_config={"temperature": 0.7, "max_output_tokens": 300})
                coach_response = response.text
            except Exception as e:
                logger.error(f"Gemini API error: {e}")
                # Fallback response
                coach_response = generate_fallback_coach_response(current_metrics, history)
        else:
            coach_response = generate_fallback_coach_response(current_metrics, history)
        
        audit_log_request('/api/coach', user_id, 'POST', 200)
        
        return jsonify({
            "success": True,
            "response": coach_response,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in NeuroCoach: {e}")
        audit_log_request('/api/coach', request.json.get('user_id', 'unknown'), 'POST', 500, str(e))
        return jsonify({"error": str(e)}), 500

def generate_fallback_coach_response(metrics, history):
    """Generate fallback coach response without OpenAI"""
    if not metrics or not history:
        return "Welcome to NeuroCoach! Complete some cognitive tests to get personalized feedback on your cognitive health."
    
    # Calculate improvements
    if len(history) >= 2:
        prev_metrics = history[-2].get('metrics', {})
        curr_metrics = history[-1].get('metrics', {})
        
        attention_change = (curr_metrics.get('attention', 0) - prev_metrics.get('attention', 0)) * 100
        memory_change = (curr_metrics.get('memory', 0) - prev_metrics.get('memory', 0)) * 100
        
        if attention_change > 0:
            return f"Great progress! Your focus improved {attention_change:.1f}% this week. Keep practicing cognitive exercises daily!"
        elif memory_change > 0:
            return f"Excellent work! Your memory score increased {memory_change:.1f}%. Continue with memory training exercises."
        else:
            return "Keep up the consistent testing! Regular cognitive assessments help track your progress over time."
    
    return "You're doing well! Continue with regular cognitive tests to build your baseline and track improvements."

# === Risk Analysis Endpoint ===
@app.route('/api/risk/analyze', methods=['POST'])
@limiter.limit("20 per hour")
def analyze_risk():
    """Analyze MCI risk using speech features and eye movement data"""
    try:
        data = request.json
        user_id = str(data.get('user_id', 'demo-user-123'))
        
        # Extract features
        speech_features = data.get('speech_features', {})
        eye_movement = data.get('eye_movement', {})
        
        # Feature vector: [latency, pause, tremor, eye_movement_x, eye_movement_y]
        features = np.array([[
            float(speech_features.get('latency', 0.5)),
            float(speech_features.get('pause_frequency', 0.3)),
            float(speech_features.get('tremor', 0.2)),
            float(eye_movement.get('x_variance', 0.1)),
            float(eye_movement.get('y_variance', 0.1))
        ]])
        
        if risk_classifier is None:
            return jsonify({
                "success": False,
                "error": "Risk classifier not available"
            }), 503
        
        # Predict risk score (0-1)
        risk_score = float(risk_classifier.predict_proba(features)[0][1])
        risk_level = "Low" if risk_score < 0.3 else ("Medium" if risk_score < 0.7 else "High")
        
        # Generate insights
        insights = generate_risk_insights(risk_score, speech_features, eye_movement)
        
        # Encrypt sensitive data
        encrypted_risk = encrypt_data(str(risk_score)) if cipher_suite else risk_score
        
        audit_log_request('/api/risk/analyze', user_id, 'POST', 200)
        
        return jsonify({
            "success": True,
            "risk_score": round(risk_score, 3),
            "risk_level": risk_level,
            "insights": insights,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in risk analysis: {e}")
        audit_log_request('/api/risk/analyze', request.json.get('user_id', 'unknown') if request.is_json else 'unknown', 'POST', 500, str(e))
        return jsonify({"error": str(e)}), 500

def generate_risk_insights(risk_score, speech_features, eye_movement):
    """Generate actionable insights from risk analysis"""
    insights = []
    
    if risk_score > 0.7:
        insights.append("🔴 High risk detected. Consider consulting with a healthcare professional.")
        insights.append("Monitor speech patterns and cognitive function closely.")
    elif risk_score > 0.4:
        insights.append("⚠️ Moderate risk. Regular monitoring recommended.")
        insights.append("Continue cognitive exercises and maintain healthy lifestyle.")
    else:
        insights.append("✅ Low risk. Continue regular assessments.")
        insights.append("Maintain current cognitive health practices.")
    
    if speech_features.get('latency', 0) > 0.6:
        insights.append("Speech latency detected. Practice verbal fluency exercises.")
    
    if eye_movement.get('x_variance', 0) > 0.5:
        insights.append("Eye movement patterns suggest attention challenges. Focus training recommended.")
    
    return insights

# === CareNetwork Endpoints ===
@app.route('/api/carenetwork/create', methods=['POST'])
@require_role('patient', 'admin')
def create_carenetwork():
    """Create or update CareNetwork for a patient"""
    try:
        data = request.json
        patient_id = str(data.get('patient_id'))
        family_members = data.get('family_members', [])
        doctors = data.get('doctors', [])
        
        # Get baseline metrics
        profile = neurotwin_profiles.get(patient_id, {})
        baseline = None
        if profile.get('history'):
            baseline = profile['history'][-1].get('metrics', {})
        
        care_networks[patient_id] = {
            'patient_id': patient_id,
            'family_members': family_members,
            'doctors': doctors,
            'baseline_metrics': baseline,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Save to MongoDB
        if MONGO_AVAILABLE and db:
            try:
                db['care_networks'].update_one(
                    {'patient_id': patient_id},
                    {'$set': care_networks[patient_id]},
                    upsert=True
                )
            except Exception as e:
                logger.error(f"Error saving to MongoDB: {e}")
        
        audit_log_request('/api/carenetwork/create', patient_id, 'POST', 200)
        
        return jsonify({
            "success": True,
            "carenetwork": care_networks[patient_id]
        })
        
    except Exception as e:
        logger.error(f"Error creating CareNetwork: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/carenetwork/<patient_id>', methods=['GET'])
@require_role('patient', 'family', 'doctor', 'admin')
def get_carenetwork(patient_id):
    """Get CareNetwork for a patient"""
    try:
        patient_id = str(patient_id)
        
        if patient_id not in care_networks:
            return jsonify({
                "success": False,
                "error": "CareNetwork not found"
            }), 404
        
        network = care_networks[patient_id]
        
        # Get recent notifications
        recent_notifications = [n for n in notifications if n.get('patient_id') == patient_id][-10:]
        
        audit_log_request(f'/api/carenetwork/{patient_id}', patient_id, 'GET', 200)
        
        return jsonify({
            "success": True,
            "carenetwork": network,
            "notifications": recent_notifications
        })
        
    except Exception as e:
        logger.error(f"Error getting CareNetwork: {e}")
        return jsonify({"error": str(e)}), 500

def check_and_notify_metric_drop(patient_id):
    """Check if metrics dropped 15% and send notifications"""
    if patient_id not in care_networks:
        return
    
    network = care_networks[patient_id]
    baseline = network.get('baseline_metrics', {})
    
    if not baseline:
        return
    
    profile = neurotwin_profiles.get(patient_id, {})
    if not profile.get('history'):
        return
    
    current = profile['history'][-1].get('metrics', {})
    
    # Check each metric
    for metric_name in ['attention', 'memory', 'speed', 'verbal_fluency']:
        baseline_value = baseline.get(metric_name, 0)
        current_value = current.get(metric_name, 0)
        
        if baseline_value > 0:
            drop_percentage = ((baseline_value - current_value) / baseline_value) * 100
            
            if drop_percentage >= 15:
                # Create notification
                notification = {
                    'id': str(uuid.uuid4()),
                    'patient_id': patient_id,
                    'type': 'metric_drop',
                    'metric': metric_name,
                    'drop_percentage': round(drop_percentage, 1),
                    'message': f"{metric_name.capitalize()} dropped {drop_percentage:.1f}% below baseline",
                    'timestamp': datetime.now().isoformat(),
                    'sent_to': network.get('family_members', []) + network.get('doctors', [])
                }
                notifications.append(notification)
                
                # Save to MongoDB
                if MONGO_AVAILABLE and db:
                    try:
                        db['notifications'].insert_one(notification)
                    except Exception as e:
                        logger.error(f"Error saving notification: {e}")

# === Multi-language Support ===
@app.route('/api/language/detect', methods=['POST'])
def detect_language():
    """Detect language from audio using Whisper"""
    try:
        audio_file = request.files.get('audio')
        
        if not audio_file:
            return jsonify({"error": "No audio file provided"}), 400
        
        # Save file temporarily
        filename = secure_filename(audio_file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{datetime.now().timestamp()}_{filename}")
        audio_file.save(filepath)
        
        detected_language = 'en'  # Default
        
        try:
            # Try using Whisper
            if OPENAI_AVAILABLE and openai_client:
                with open(filepath, 'rb') as f:
                    transcript = openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        response_format="verbose_json"
                    )
                    detected_language = transcript.language
            elif SPEECH_REC_AVAILABLE:
                # Fallback to SpeechRecognition
                recognizer = sr.Recognizer()
                with sr.AudioFile(filepath) as source:
                    audio = recognizer.record(source)
                    try:
                        result = recognizer.recognize_google(audio, show_all=True)
                        if result and 'language_code' in result:
                            detected_language = result['language_code']
                    except:
                        pass
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
        
        # Language mapping
        language_map = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'hi': 'Hindi',
            'ar': 'Arabic'
        }
        
        audit_log_request('/api/language/detect', 'unknown', 'POST', 200)
        
        return jsonify({
            "success": True,
            "language_code": detected_language,
            "language_name": language_map.get(detected_language, 'English'),
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error detecting language: {e}")
        return jsonify({"error": str(e)}), 500

# === Health Passport Export ===
@app.route('/api/passport/export', methods=['POST'])
@limiter.limit("5 per hour")
@require_role('patient', 'doctor', 'admin')
def export_health_passport():
    """Export comprehensive health passport as PDF"""
    try:
        data = request.json
        user_id = str(data.get('user_id', 'demo-user-123'))
        
        if not PDF_AVAILABLE:
            return jsonify({"error": "PDF generation not available"}), 503
        
        # Get all user data
        profile = neurotwin_profiles.get(user_id, {})
        history = profile.get('history', [])
        recent_analyses = [a for a in analysis_history if a.get('type')][-10:]
        
        # Generate PDF
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 50, "Cognitive Health Passport")
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 80, f"Patient ID: {user_id}")
        c.drawString(50, height - 100, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Current Metrics
        y_pos = height - 140
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_pos, "Current Cognitive Metrics")
        y_pos -= 30
        
        if history:
            current = history[-1].get('metrics', {})
            c.setFont("Helvetica", 10)
            for metric, value in current.items():
                c.drawString(70, y_pos, f"{metric.capitalize()}: {value * 100:.1f}%")
                y_pos -= 20
        
        # Recent Test History
        y_pos -= 20
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y_pos, "Recent Test History")
        y_pos -= 30
        
        c.setFont("Helvetica", 9)
        for analysis in recent_analyses[:5]:
            test_type = analysis.get('type', 'Unknown')
            timestamp = analysis.get('timestamp', '')[:10]
            c.drawString(70, y_pos, f"{test_type}: {timestamp}")
            y_pos -= 15
        
        # Generate QR Code
        qr_data = f"https://neuro-nest.vercel.app/verify/{user_id}"
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR to buffer
        qr_buffer = io.BytesIO()
        qr_img.save(qr_buffer, format='PNG')
        qr_buffer.seek(0)
        
        # Add QR code to PDF
        from reportlab.lib.utils import ImageReader
        qr_reader = ImageReader(qr_buffer)
        c.drawImage(qr_reader, width - 150, height - 150, width=100, height=100)
        c.drawString(width - 150, height - 160, "Doctor Verification QR")
        
        c.save()
        pdf_buffer.seek(0)
        
        audit_log_request('/api/passport/export', user_id, 'POST', 200)
        
        # Return PDF as response
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=health_passport_{user_id}_{datetime.now().strftime("%Y%m%d")}.pdf'
        return response
        
    except Exception as e:
        logger.error(f"Error exporting passport: {e}")
        audit_log_request('/api/passport/export', request.json.get('user_id', 'unknown') if request.is_json else 'unknown', 'POST', 500, str(e))
        return jsonify({"error": str(e)}), 500

# === Audit Log Endpoint ===
@app.route('/api/audit/logs', methods=['GET'])
@require_role('admin')
def get_audit_logs():
    """Get audit logs (admin only)"""
    try:
        limit = request.args.get('limit', 100, type=int)
        user_id_filter = request.args.get('user_id', None)
        
        filtered_logs = audit_log
        if user_id_filter:
            filtered_logs = [log for log in audit_log if log.get('user_id') == user_id_filter]
        
        return jsonify({
            "success": True,
            "total": len(filtered_logs),
            "logs": filtered_logs[-limit:][::-1]
        })
    except Exception as e:
        logger.error(f"Error getting audit logs: {e}")
        return jsonify({"error": str(e)}), 500

# === Screen Analysis Endpoint ===
@app.route('/api/screen/analyze', methods=['POST'])
@limiter.limit("10 per minute")
def analyze_screen():
    """Analyze screen capture - OCR and AI analysis"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        # Read image
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        # Extract text using OCR (pytesseract if available, otherwise fallback)
        extracted_text = "No text extraction available. Please install pytesseract for OCR functionality."
        
        try:
            import pytesseract
            # Convert PIL image to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            extracted_text = pytesseract.image_to_string(image)
            if not extracted_text.strip():
                extracted_text = "No text detected in the image."
        except ImportError:
            logger.warning("pytesseract not installed. OCR functionality disabled.")
            extracted_text = "OCR not available. Image received successfully."
        except Exception as e:
            logger.error(f"OCR error: {e}")
            extracted_text = f"OCR error: {str(e)}"
        
        # AI Analysis using Gemini if available
        ai_analysis = "Screen analysis complete. AI analysis requires Gemini API key."
        
        if GEMINI_AVAILABLE:
            try:
                # Use Gemini Vision API
                model = genai.GenerativeModel('gemini-2.5-flash')
                prompt = "Analyze this screenshot. Describe what you see, identify any important information, and provide insights. Be concise and helpful."
                response = model.generate_content([prompt, image], generation_config={"max_output_tokens": 500})
                ai_analysis = response.text
            except Exception as e:
                logger.error(f"Gemini analysis error: {e}")
                ai_analysis = f"AI analysis error: {str(e)}"
        else:
            # Fallback analysis based on extracted text
            if extracted_text and len(extracted_text.strip()) > 10:
                ai_analysis = f"Screen captured successfully. Extracted {len(extracted_text.split())} words. The screen appears to contain text content."
            else:
                ai_analysis = "Screen captured successfully. The image may contain visual content without text."
        
        return jsonify({
            "success": True,
            "extracted_text": extracted_text,
            "ai_analysis": ai_analysis,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in screen analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/screen/ask', methods=['POST'])
@limiter.limit("20 per minute")
def ask_screen_question():
    """Answer questions about the screen content"""
    try:
        data = request.json
        question = data.get('question', '')
        screen_text = data.get('screen_text', '')
        context = data.get('context', '')
        
        if not question:
            return jsonify({"error": "No question provided"}), 400
        
        answer = "I need more context to answer your question."
        
        if GEMINI_AVAILABLE:
            try:
                prompt = f"""Based on the following screen content and context, answer the user's question.

Screen Text: {screen_text[:2000]}
Context: {context[:1000]}

Question: {question}

Provide a helpful and accurate answer:"""
                
                model = genai.GenerativeModel('gemini-2.5-flash', system_instruction="You are a helpful assistant that analyzes screen content and answers questions about it.")
                response = model.generate_content(prompt, generation_config={"max_output_tokens": 300})
                answer = response.text
            except Exception as e:
                logger.error(f"Gemini question error: {e}")
                answer = f"Error processing question: {str(e)}"
        else:
            # Simple fallback
            if screen_text:
                answer = f"Based on the screen content, I can see text related to your question. For detailed analysis, please configure OpenAI API key."
            else:
                answer = "I don't have enough information to answer your question. Please ensure the screen was analyzed first."
        
        return jsonify({
            "success": True,
            "answer": answer,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error answering question: {e}")
        return jsonify({"error": str(e)}), 500

# === Simplify Report Endpoint ===
SIMPLIFY_REPORT_SYSTEM_PROMPT = """You are an assistant that explains complex medical or cognitive reports in simple, easy-to-understand language for general users.

CRITICAL RULES:
- Simplify the content for a non-medical user
- Use bullet points for clarity
- Explain difficult terms in plain English
- Highlight key findings in a neutral way
- NEVER provide diagnosis or medical conclusions
- NEVER use alarming language
- AVOID: "disease detected", "you have", "risk of", "abnormal"
- USE: "may indicate", "can be associated with", "some reports show"
- Keep tone calm, reassuring, and educational
- Output MUST include these exact sections with the headers:

🧾 Summary
(2-3 lines overall summary)

🔍 Key Points
(bullet list)

📘 What This Means
(simple explanation)

⚠️ When to Seek Help
(neutral suggestion - e.g., "Consider speaking with a healthcare provider if you have questions")

📌 Disclaimer
This explanation is for understanding only and not a medical diagnosis. Please consult a qualified healthcare professional for medical advice."""

def extract_text_from_file(file_storage, filename):
    """Extract text from uploaded file (PDF, TXT, DOCX)"""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    content = file_storage.read()
    
    if ext == 'txt':
        try:
            return content.decode('utf-8', errors='replace')
        except Exception:
            return content.decode('latin-1', errors='replace')
    
    if ext == 'pdf' and PDF_EXTRACT_AVAILABLE:
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text_parts = []
            for page in pdf_reader.pages:
                text_parts.append(page.extract_text() or '')
            return '\n'.join(text_parts).strip()
        except Exception as e:
            logger.error(f"PDF extraction error: {e}")
            raise ValueError("Could not extract text from PDF. The file may be corrupted or scanned.")
    
    if ext == 'docx' and DOCX_EXTRACT_AVAILABLE and DocxDocument:
        try:
            doc = DocxDocument(io.BytesIO(content))
            return '\n'.join(p.text for p in doc.paragraphs).strip()
        except Exception as e:
            logger.error(f"DOCX extraction error: {e}")
            raise ValueError("Could not extract text from DOCX file.")
    
    raise ValueError(f"Unsupported file type: {ext}. Use PDF, TXT, or DOCX.")

@app.route('/api/simplify-report', methods=['POST'])
@limiter.limit("10 per hour")
def simplify_report():
    """Simplify medical/cognitive reports into easy-to-understand language"""
    try:
        report_text = None
        
        # Handle file upload
        if 'file' in request.files and request.files['file'].filename:
            file = request.files['file']
            filename = secure_filename(file.filename)
            if not filename:
                return jsonify({"error": "Invalid filename"}), 400
            report_text = extract_text_from_file(file, filename)
        # Handle pasted text (JSON or form)
        elif request.is_json and request.json.get('text'):
            report_text = request.json.get('text', '').strip()
        elif request.form.get('text'):
            report_text = request.form.get('text', '').strip()
        
        if not report_text or len(report_text) < 20:
            return jsonify({
                "error": "Please provide report text (at least 20 characters) or upload a PDF, TXT, or DOCX file."
            }), 400
        
        if len(report_text) > 15000:
            return jsonify({"error": "Report is too long. Please limit to 15,000 characters."}), 400
        
        # Call Gemini for simplification
        if GEMINI_AVAILABLE:
            try:
                model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=SIMPLIFY_REPORT_SYSTEM_PROMPT)
                prompt = f"Input report to simplify:\n\n{report_text[:12000]}"
                response = model.generate_content(prompt, generation_config={"temperature": 0.3, "max_output_tokens": 1500})
                simplified = response.text
            except Exception as e:
                logger.error(f"Gemini simplify error: {e}")
                return jsonify({"error": "Unable to process report. Please try again later."}), 503
        else:
            # Fallback when Gemini not configured
            simplified = """🧾 Summary
This is a simplified overview of your report. For a detailed AI-powered simplification, please configure the OpenAI API key.

🔍 Key Points
• The report has been received
• Full simplification requires AI processing

📘 What This Means
Reports often contain technical terms. A healthcare provider can help explain any findings in person.

⚠️ When to Seek Help
Consider speaking with a healthcare provider if you have questions about your report.

📌 Disclaimer
This explanation is for understanding only and not a medical diagnosis. Please consult a qualified healthcare professional for medical advice."""
        
        user_id = request.json.get('user_id', 'anonymous') if request.is_json else request.form.get('user_id', 'anonymous')
        audit_log_request('/api/simplify-report', user_id, 'POST', 200)
        
        return jsonify({
            "success": True,
            "simplified": simplified,
            "timestamp": datetime.now().isoformat()
        })
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in simplify-report: {e}")
        return jsonify({"error": "An error occurred. Please try again."}), 500

# === Journal Endpoints ===
def _journal_entries_list_for_user(user_id, limit=None):
    """Return journal entries for user, newest first (Mongo or file fallback)."""
    uid = str(user_id)
    if MONGO_AVAILABLE and db is not None:
        cursor = db['journal_entries'].find({'user_id': uid}, {'_id': 0}).sort('timestamp', -1)
        entries = list(cursor)
        if limit:
            entries = entries[:limit]
        return entries
    entries = list(journal_by_user.get(uid, []))
    entries.sort(key=lambda e: e.get('timestamp', ''), reverse=True)
    if limit:
        entries = entries[:limit]
    return entries


@app.route('/api/journal', methods=['POST'])
def create_journal_entry():
    """Create a new journal reflection entry"""
    try:
        data = request.json
        user_id = str(data.get('user_id', 'demo-user-123'))
        text = data.get('text', '').strip()
        tags = data.get('tags', [])
        
        if not text:
            return jsonify({"error": "Journal text cannot be empty"}), 400
            
        entry = {
            'entry_id': str(uuid.uuid4()),
            'user_id': user_id,
            'text': text,
            'tags': tags,
            'timestamp': datetime.now().isoformat()
        }
        
        if MONGO_AVAILABLE and db is not None:
            db['journal_entries'].insert_one(entry.copy())
        else:
            if user_id not in journal_by_user:
                journal_by_user[user_id] = []
            journal_by_user[user_id].append(entry)
            save_journal_to_file()
            
        return jsonify({
            "success": True,
            "entry": entry
        })
    except Exception as e:
        logger.error(f"Error creating journal entry: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/journal/<user_id>', methods=['GET'])
def get_journal_entries(user_id):
    """Get all journal entries for a user"""
    try:
        entries = _journal_entries_list_for_user(user_id)
        return jsonify({
            "success": True,
            "entries": entries
        })
    except Exception as e:
        logger.error(f"Error fetching journal entries: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/journal/<entry_id>', methods=['DELETE'])
def delete_journal_entry(entry_id):
    """Delete a journal entry"""
    try:
        eid = str(entry_id)
        if MONGO_AVAILABLE and db is not None:
            result = db['journal_entries'].delete_one({'entry_id': eid})
            if result.deleted_count == 0:
                return jsonify({"error": "Entry not found"}), 404
        else:
            found = False
            for uid in list(journal_by_user.keys()):
                before = len(journal_by_user[uid])
                journal_by_user[uid] = [e for e in journal_by_user[uid] if e.get('entry_id') != eid]
                if len(journal_by_user[uid]) < before:
                    found = True
                    break
            if not found:
                return jsonify({"error": "Entry not found"}), 404
            save_journal_to_file()
                
        return jsonify({"success": True, "message": "Entry deleted"})
    except Exception as e:
        logger.error(f"Error deleting journal entry: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/journal/insights', methods=['POST'])
def generate_journal_insights():
    """Generate safe, non-diagnostic insights from recent journal entries"""
    try:
        data = request.json
        user_id = str(data.get('user_id', 'demo-user-123'))
        
        if not GEMINI_AVAILABLE:
            return jsonify({"success": True, "insights": ["Please configure API to generate insights. Your entries are saved securely."]})
            
        # Get recent entries (Mongo or file-backed)
        entries = _journal_entries_list_for_user(user_id, limit=7)
            
        if not entries:
            return jsonify({"success": True, "insights": ["Keep journaling! Insights will appear after a few entries."]})
            
        # Combine text for analysis
        combined_text = "\\n---\\n".join([e.get('text', '') for e in entries])
        
        system_instruction = '''You are a supportive, calm AI that analyzes a user's daily journal entries. 
CRITICAL CONSTRAINTS:
1. absolutely NO diagnosis or clinical terms (e.g. no "depression", "anxiety").
2. Use soft language only: "patterns suggest", "you may be feeling", "seems like".
3. Validate their feelings gently.
4. Keep insights to 2-3 brief, supportive sentences highlighting positive habits or noting general stress/tiredness without sounding medical.
5. Return plain text.'''

        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
        response = model.generate_content(f"Here are my recent journal entries. Give me a brief, supportive insight:\\n\\n{combined_text}", generation_config={"temperature": 0.5, "max_output_tokens": 150})
        
        return jsonify({
            "success": True,
            "insights": [response.text]
        })
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        return jsonify({"error": "Could not generate insights at this time."}), 500

# === Error Handlers ===
@app.errorhandler(413)
def request_entity_too_large(error):
    audit_log_request(request.path, 'unknown', request.method, 413)
    return jsonify({"error": "File too large. Maximum size is 10MB"}), 413

@app.errorhandler(404)
def not_found(error):
    audit_log_request(request.path, 'unknown', request.method, 404)
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    audit_log_request(request.path, 'unknown', request.method, 500)
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(429)
def ratelimit_handler(e):
    audit_log_request(request.path, 'unknown', request.method, 429, 'Rate limit exceeded')
    return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429

# === Start Server ===
if __name__ == "__main__":
    logger.info("Starting NeuroNest Unified API Server...")
    logger.info(f"Cognitive Model Loaded: {cognitive_model is not None}")
    logger.info(f"Speech Model Loaded: {speech_session is not None}")
    app.run(host='0.0.0.0', port=5002, debug=True)