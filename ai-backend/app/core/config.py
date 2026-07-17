import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY")
    BASE_URL_OPENROUTER: str = os.getenv("BASE_URL_OPENROUTER")
    MODEL_OPENROUTER: str = os.getenv("MODEL_OPENROUTER")
    

settings = Settings()