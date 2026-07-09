from openai import OpenAI
from app.core.config import settings
import os

client = OpenAI(
    base_url= os.getenv("BASE_URL_OPENROUTER"),
    api_key=settings.OPENROUTER_API_KEY,
)

def generate_ai_response(prompt: str) -> str:
    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_OPENROUTER"),
            messages=[
                {
                    "role": "system", 
                    "content": "Kamu adalah asisten AI cerdas untuk sistem KMIPN. Jawablah dengan ringkas dan tepat sasaran."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            extra_headers={
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "KMIPN Adaptive Learning App",
            }
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Waduh, ada kendala saat menghubungi AI via OpenRouter: {str(e)}"