from pydantic import BaseModel, Field

class AIRequest(BaseModel):
    prompt: str = Field(..., min_length=3, description="Teks pertanyaan atau instruksi dari user/sistem")

class AIResponse(BaseModel):
    success: bool
    data: str

class Report(BaseModel):
    report_id: str
    text: str
    latitude: float
    longitude: float

class ReportDetail(BaseModel):
    report_id: str
    ai_risk_score: int
    ai_is_blocked: bool

class MasterTicket(BaseModel):
    master_latitude: float
    master_longitude: float
    representative_text: str
    member_ids: list[str]
    member_reports: list[ReportDetail]