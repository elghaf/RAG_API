import os
from fastapi import UploadFile
from config import Settings
import aiofiles
import uuid

class FileHandler:
    def __init__(self):
        self.settings = Settings()
        os.makedirs(self.settings.UPLOAD_DIR, exist_ok=True)