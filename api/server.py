from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
import json
import httpx
import io
import base64
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import google.generativeai as genai
from supabase import create_client, Client
import boto3
from botocore.exceptions import ClientError

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Initialize services
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# Configure Gemini AI
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# Configure Cloudflare R2
r2_client = boto3.client(
    's3',
    endpoint_url='https://5421e648cebad5f77c899b91965998fd.r2.cloudflarestorage.com',
    aws_access_key_id=os.environ.get('CLOUDFLARE_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('CLOUDFLARE_SECRET_ACCESS_KEY'),
    region_name='auto'
)

# Create FastAPI app
app = FastAPI(title="Mock Test Platform API")
api_router = APIRouter(prefix="/api")

# Pydantic models
class UserLogin(BaseModel):
    mobile: str
    password: str

class UserSignup(BaseModel):
    name: str
    email: Optional[str] = None
    mobile: str
    password: str

class MCQGenerateRequest(BaseModel):
    content: str
    count: int = 20
    language: str = "English"

class ChatMessage(BaseModel):
    message: str
    image_data: Optional[str] = None

class TestResult(BaseModel):
    test_id: str
    user_answers: List[str]
    time_taken: int
    score: int
<<<<<<< HEAD

=======
    
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
def get_user_id_from_token(token: str = Depends(lambda x: x.headers.get('Authorization'))):
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")
    token_value = token.split(" ")[1]
    if token_value and token_value.startswith("auth_token_"):
        parts = token_value.split("_")
        if len(parts) >= 3:
            return parts[2]
    raise HTTPException(status_code=401, detail="Invalid token")

# Utility functions
def generate_auth_token(user_id: str) -> str:
    """Generate a simple auth token"""
    return f"auth_token_{user_id}_{uuid.uuid4().hex[:16]}"

def verify_auth_token(token: str) -> Optional[str]:
    """Verify auth token and return user_id"""
    if token and token.startswith("auth_token_"):
        parts = token.split("_")
        if len(parts) >= 3:
            return parts[2]
    return None

# Authentication endpoints
@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    try:
        # Query user from Supabase
        response = supabase.table('users').select('*').eq('mobile', credentials.mobile).execute()
<<<<<<< HEAD

        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid mobile number or password")

        user = response.data[0]

        # Simple password check (in production, use proper hashing)
        if user['password'] != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid mobile number or password")

        # Generate auth token
        auth_token = generate_auth_token(str(user['id']))

=======
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid mobile number or password")
        
        user = response.data[0]
        
        # Simple password check (in production, use proper hashing)
        if user['password'] != credentials.password:
            raise HTTPException(status_code=401, detail="Invalid mobile number or password")
        
        # Generate auth token
        auth_token = generate_auth_token(str(user['id']))
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        return {
            "success": True,
            "message": "Login successful",
            "token": auth_token,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user.get('email'),
                "mobile": user['mobile'],
                "joinedAt": user.get('joined_at')
            }
        }
    except Exception as e:
        logging.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    try:
        # Check if user already exists
        existing_user = supabase.table('users').select('mobile').eq('mobile', user_data.mobile).execute()
<<<<<<< HEAD

        if existing_user.data:
            raise HTTPException(status_code=409, detail="User with this mobile number already exists")

=======
        
        if existing_user.data:
            raise HTTPException(status_code=409, detail="User with this mobile number already exists")
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        # Create new user
        new_user = {
            "name": user_data.name,
            "email": user_data.email,
            "mobile": user_data.mobile,
            "password": user_data.password # In production, hash this
        }
<<<<<<< HEAD

        response = supabase.table('users').insert(new_user).execute()

        if response.data:
            user = response.data[0]
            auth_token = generate_auth_token(str(user['id']))

=======
        
        response = supabase.table('users').insert(new_user).execute()
        
        if response.data:
            user = response.data[0]
            auth_token = generate_auth_token(str(user['id']))
            
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
            return {
                "success": True,
                "message": "Signup successful",
                "token": auth_token,
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user.get('email'),
                    "mobile": user['mobile'],
                    "joinedAt": user.get('joined_at')
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user")
<<<<<<< HEAD

=======
            
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Signup error: {e}")
        raise HTTPException(status_code=500, detail="Signup failed")

@api_router.post("/auth/verify")
async def verify_token(token: str):
    user_id = verify_auth_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
<<<<<<< HEAD

=======
    
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
    try:
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if response.data:
            user = response.data[0]
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "email": user.get('email'),
                    "mobile": user['mobile'],
                    "joinedAt": user.get('joined_at')
                }
            }
        else:
            raise HTTPException(status_code=401, detail="User not found")
    except Exception as e:
        logging.error(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")

# Test endpoints
@api_router.get("/tests")
async def get_tests():
    """Get all available test categories"""
    try:
        # Fetch from Cloudflare R2 or return mock data
        test_categories = {
            "PYQ Full Set": [
                {"id": "ssc_cgl_2023_full", "name": "SSC CGL Tier 1 (2023)", "description": "Full mock from previous year.", "isPremium": False},
                {"id": "ssc_chsl_2023_full", "name": "SSC CHSL Tier 1 (2023)", "description": "Full mock from previous year.", "isPremium": True}
            ],
            "PYQ Sectional Set": [
                {"id": "reasoning_2023", "name": "Reasoning Sectional (2023)", "description": "Challenge your logical skills.", "isPremium": False},
                {"id": "maths_2023", "name": "Maths Sectional (2023)", "description": "Sharpen your math skills.", "isPremium": True}
            ],
            "Mock Tests": [
                {"id": "gk_set_1", "name": "General Knowledge Set 1", "description": "A quick test of your GK.", "isPremium": False},
                {"id": "english_set_1", "name": "English Language Set 1", "description": "Test your grammar & vocab.", "isPremium": True}
            ]
        }
        return test_categories
    except Exception as e:
        logging.error(f"Get tests error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tests")

@api_router.get("/tests/questions")
async def get_test_questions():
    """Get questions for all tests"""
    try:
        # Try to fetch from Cloudflare R2
        try:
            response = r2_client.get_object(
                Bucket=os.environ.get('CLOUDFLARE_BUCKET_NAME'),
                Key='MATH 2March 2025 9 Baje.json'
            )
            cloudflare_data = json.loads(response['Body'].read().decode('utf-8'))
<<<<<<< HEAD

=======
            
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
            # Process Cloudflare data and return
            questions_data = {
                "math_march_2025": cloudflare_data
            }
        except Exception as cf_error:
            logging.warning(f"Cloudflare fetch failed: {cf_error}")
            # Return mock data as fallback
            questions_data = {
                "ssc_cgl_2023_full": [
                    {"question": "What is the capital of India?", "options": ["Mumbai", "Delhi", "Kolkata", "Chennai"], "answer": "Delhi"},
                    {"question": "Who is known as the Father of the Nation in India?", "options": ["Nehru", "Gandhi", "Patel", "Bose"], "answer": "Gandhi"}
                ],
                "gk_set_1": [
                    {"question": "What is the capital of France?", "options": ["Berlin", "Madrid", "Paris", "Rome"], "answer": "Paris"},
                    {"question": "Which planet is known as the Red Planet?", "options": ["Earth", "Mars", "Jupiter", "Venus"], "answer": "Mars"}
                ]
            }
<<<<<<< HEAD

=======
            
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        return questions_data
    except Exception as e:
        logging.error(f"Get questions error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch questions")

@api_router.post("/tests/submit")
async def submit_test(result: TestResult, user_id: str = Depends(get_user_id_from_token)):
    try:
        data_to_insert = {
            "user_id": user_id,
            "test_id": result.test_id,
            "score": result.score,
            "time_taken": result.time_taken,
            "user_answers": result.user_answers
        }
        supabase.table('test_results').insert(data_to_insert).execute()
        return {"success": True, "message": "Result submitted successfully"}
    except Exception as e:
        logging.error(f"Test submission error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit test result")

@api_router.get("/tests/history")
async def get_test_history(user_id: str = Depends(get_user_id_from_token)):
    try:
        response = supabase.table('test_results').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(10).execute()
        history_data = response.data
<<<<<<< HEAD

=======
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        # Mock up rank and percentage for now
        formatted_history = []
        for test in history_data:
            formatted_history.append({
                "rank": test.get("rank", 10 + int(test['score'] * 2)), # Mock rank
                "percentage": test.get("percentage", int(test['score'] / 20 * 100)), # Mock percentage
                "subject": test.get("subject", "General"),
                "date": test['created_at']
            })
        return formatted_history
    except Exception as e:
        logging.error(f"Failed to fetch test history: {e}")
        return []

# MCQ Generation endpoint
@api_router.post("/generate-mcq")
async def generate_mcq(file: UploadFile = File(...), count: int = Form(20), language: str = Form("English")):
    try:
        # Read file content
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
<<<<<<< HEAD

=======
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        # Generate MCQs using Gemini AI
        prompt = f"""
        Based on the following content, generate {count} multiple choice questions in {language} language.
        Format each question as JSON with the following structure:
        {{
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Correct option text"
        }}
<<<<<<< HEAD

        Content: {text_content[:3000]} # Limit content to avoid token limits

        Return only a valid JSON array of questions.
        """

        response = gemini_model.generate_content(prompt)

=======
        
        Content: {text_content[:3000]} # Limit content to avoid token limits
        
        Return only a valid JSON array of questions.
        """
        
        response = gemini_model.generate_content(prompt)
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        # Parse the response
        try:
            mcq_data = json.loads(response.text)
            mcq_set = {
                "id": str(uuid.uuid4()),
                "sourceFilename": file.filename,
                "generated": len(mcq_data),
                "createdAt": datetime.utcnow().isoformat(),
                "questions": mcq_data
            }
<<<<<<< HEAD

=======
            
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
            return {
                "success": True,
                "message": f"Generated {len(mcq_data)} MCQs successfully",
                "data": mcq_set
            }
        except json.JSONDecodeError:
            return {
                "success": False,
                "message": "AI did not return a valid JSON format. Please try a different file.",
                "data": {
                    "id": str(uuid.uuid4()),
                    "sourceFilename": file.filename,
                    "generated": 0,
                    "createdAt": datetime.utcnow().isoformat(),
                    "raw_response": response.text
                }
            }
<<<<<<< HEAD

=======
            
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
    except Exception as e:
        logging.error(f"MCQ generation error: {e}")
        raise HTTPException(status_code=500, detail=f"MCQ generation failed: {str(e)}")

# Chat endpoint for doubt solving
@api_router.post("/chat")
async def chat_with_tutor(message_data: ChatMessage):
    try:
        # Prepare the prompt
        parts = [
            f"You are a helpful and professional tutor. Please answer the student's question."
        ]
<<<<<<< HEAD

=======
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        if message_data.image_data:
            try:
                img_data = base64.b64decode(message_data.image_data)
                img = genai.upload_file(io.BytesIO(img_data), mime_type='image/jpeg')
                parts.append(img)
            except Exception as e:
                logging.error(f"Image upload failed: {e}")
                parts.append("The student has provided an image, but it failed to process. Please respond to their text message only.")

        if message_data.message:
            parts.append(message_data.message)

        if not parts:
            raise HTTPException(status_code=400, detail="Empty message or image data")

        # Generate response using Gemini
        response = gemini_model.generate_content(parts)
<<<<<<< HEAD

=======
        
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
        return {
            "success": True,
            "response": response.text
        }
    except Exception as e:
        logging.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Chat service failed")

# Pass/Premium endpoints
@api_router.get("/pass/status")
async def get_pass_status():
    """Check if user has premium pass"""
    # For now, return basic status
    return {"isActive": False}

@api_router.post("/pass/activate")
async def activate_pass(code: dict):
    """Activate premium pass with code"""
    activation_code = code.get("code")
    if activation_code == "PREMIUM2025": # Demo code
        return {"success": True, "message": "Pass activated successfully"}
    else:
        return {"success": False, "message": "Invalid activation code"}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Mock Test Platform API is running"}

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
<<<<<<< HEAD
    uvicorn.run(app, host="0.0.0.0", port=8001)
=======
    uvicorn.run(app, host="0.0.0.0", port=8001)
>>>>>>> ecd20435864b0cd78765d428ffbf5eeee792752e
