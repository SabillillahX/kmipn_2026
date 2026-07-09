from pydantic import BaseModel, Field

class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=3, description="Teks pertanyaan atau instruksi dari user/sistem")

class AIResponse(BaseModel):
    success: bool
    data: str