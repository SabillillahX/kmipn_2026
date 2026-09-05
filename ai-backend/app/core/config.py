import os
import torch
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "DISTRAC AI Service")
    MODEL_NAME: str = "indobenchmark/indobert-base-p1"
    DEVICE: str = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    SPATIAL_EPSILON: float = 15.0
    SPATIAL_MIN_PTS: int = 2
    EARTH_RADIUS: float = 6371000.0
    SIMILARITY_THRESHOLD: float = 0.70

settings = Settings()