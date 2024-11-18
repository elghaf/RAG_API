import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime
from config import Settings

class DatabaseService:
    def __init__(self):
        self.settings = Settings()
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.settings.DATABASE_URL) as conn:
            c = conn.cursor()
            c.execute('''
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    filename TEXT,
                    file_path TEXT,
                    created_at TIMESTAMP
                )
            ''')
            c.execute('''
                CREATE TABLE IF NOT EXISTS queries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT,
                    response TEXT,
                    timestamp TIMESTAMP,
                    document_id TEXT,
                    FOREIGN KEY (document_id) REFERENCES documents(id)
                )
            ''')
            conn.commit()
    
    @asynccontextmanager
    async def get_db(self):
        conn = sqlite3.connect(self.settings.DATABASE_URL)
        try:
            yield conn
        finally:
            conn.close()
    
    async def store_document_metadata(self, document_id: str, filename: str, file_path: str):
        async with self.get_db() as conn:
            c = conn.cursor()
            c.execute('''
                INSERT INTO documents (id, filename, file_path, created_at)
                VALUES (?, ?, ?, ?)
            ''', (document_id, filename, file_path, datetime.now()))
            conn.commit()
    
    async def store_query(self, query: str, response: dict):
        async with self.get_db() as conn:
            c = conn.cursor()
            c.execute('''
                INSERT INTO queries (query, response, timestamp)
                VALUES (?, ?, ?)
            ''', (query, str(response), datetime.now()))
            conn.commit()