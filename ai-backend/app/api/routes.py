from fastapi import APIRouter
from app.schemas.ai_request import AIRequest, AIResponse
from app.services.llm_service import generate_ai_response

router = APIRouter()

@router.post("/generate", response_model=AIResponse)
def generate_text(request: AIRequest):
    result = generate_ai_response(request.prompt)
    
    return AIResponse(
        success=True,
        data=result
    )