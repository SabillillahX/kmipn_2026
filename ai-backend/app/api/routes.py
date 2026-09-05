from fastapi import APIRouter, HTTPException
from app.schemas.ai_request import Report, MasterTicket
from app.services.llm_service import process_clustering

router = APIRouter()

@router.post("/cluster-reports", response_model=list[MasterTicket])
def process_clusters_endpoint(reports: list[Report]):
    try:
        return process_clustering(reports)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))