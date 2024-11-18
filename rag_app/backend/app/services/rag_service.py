from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import SQLiteVec
from langchain.chains import ConversationalRetrievalQA
from langchain.chat_models import ChatOpenAI
from config import Settings
import uuid
import re
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import json

class RAGService:
    def __init__(self):
        self.settings = Settings()
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=self.settings.OPENAI_API_KEY
        )
        
        self.vector_store = SQLiteVec(
            db_file=self.settings.DATABASE_URL,
            embedding_function=self.embeddings
        )
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.CHUNK_SIZE,
            chunk_overlap=self.settings.CHUNK_OVERLAP
        )
        
        # Enhanced prompt for visualization
        self.visualization_prompt = """
        Answer the question based on the context provided. If the answer contains:
        1. Numerical data: Format it as a table or chart
        2. Tabular data: Structure it as a table
        3. Time series data: Present it as a line chart
        4. Categorical data: Present it as a bar or pie chart
        5. Comparisons: Use bar charts or tables

        If visualization is appropriate, include a JSON structure with:
        - type: 'line', 'bar', 'pie', or 'table'
        - data: formatted data array
        - title: visualization title
        - description: brief description

        Context: {context}
        Question: {question}

        Provide your answer in the following format:
        ANSWER: [Your detailed answer here]
        VISUALIZATION: [JSON visualization data if applicable, or "None" if not applicable]
        """

        self.llm = ChatOpenAI(
            temperature=0,
            model_name=self.settings.MODEL_NAME,
            openai_api_key=self.settings.OPENAI_API_KEY
        )

    async def process_document(self, file_path: str) -> str:
        document_id = str(uuid.uuid4())
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        chunks = self.text_splitter.split_documents(documents)
        texts = [chunk.page_content for chunk in chunks]
        metadatas = [{"document_id": document_id} for _ in chunks]
        
        self.vector_store.add_texts(
            texts=texts,
            metadatas=metadatas
        )
        
        return document_id

    def _extract_visualization_data(self, text: str) -> Optional[Dict[str, Any]]:
        try:
            # Extract visualization section
            viz_match = re.search(r'VISUALIZATION:\s*({.*})', text, re.DOTALL)
            if not viz_match or viz_match.group(1).strip() == "None":
                return None

            viz_data = json.loads(viz_match.group(1))
            return viz_data
        except Exception as e:
            print(f"Error extracting visualization data: {e}")
            return None

    def _extract_tables_from_text(self, text: str) -> List[Dict[str, Any]]:
        tables = []
        try:
            # Look for markdown-style tables
            table_pattern = r'\|.*\|'
            table_matches = re.finditer(table_pattern, text, re.MULTILINE)
            
            for match in table_matches:
                table_lines = text[match.start():].split('\n')
                table_lines = [line for line in table_lines if '|' in line]
                
                if len(table_lines) > 2:  # Header + separator + data
                    df = pd.read_csv(pd.compat.StringIO('\n'.join(table_lines)), sep='|')
                    tables.append({
                        "type": "table",
                        "data": df.to_dict('records'),
                        "title": "Extracted Table",
                        "description": "Table extracted from the response"
                    })
        except Exception as e:
            print(f"Error extracting tables: {e}")
        return tables

    async def get_response(self, query: str) -> Dict[str, Any]:
        qa_chain = ConversationalRetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=self.vector_store.as_retriever(),
            return_source_documents=True,
            chain_type_kwargs={
                "prompt": self.visualization_prompt
            }
        )
        
        response = await qa_chain.acall({
            "question": query,
            "chat_history": []
        })
        
        # Extract answer and visualization parts
        answer_text = response['answer']
        visualizations = []

        # Extract structured visualization if present
        viz_data = self._extract_visualization_data(answer_text)
        if viz_data:
            visualizations.append(viz_data)

        # Extract any tables from the text
        tables = self._extract_tables_from_text(answer_text)
        visualizations.extend(tables)

        # Clean up the answer text
        clean_answer = re.sub(r'VISUALIZATION:.*', '', answer_text, flags=re.DOTALL)
        clean_answer = clean_answer.replace('ANSWER:', '').strip()

        return {
            "answer": clean_answer,
            "visualizations": visualizations,
            "sources": [
                {
                    "page": doc.metadata.get("page", 0),
                    "text": doc.page_content
                }
                for doc in response.get("source_documents", [])
            ]
        }