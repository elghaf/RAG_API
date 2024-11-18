# Updated imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import SQLiteVec
from langchain.chains import ConversationalRetrievalQA
from langchain.chat_models import ChatOpenAI
from config import Settings
import uuid

class RAGService:
    def __init__(self):
        self.settings = Settings()
        self.embeddings = OpenAIEmbeddings(
            openai_api_key=self.settings.OPENAI_API_KEY
        )
        
        # Initialize SQLiteVec for storing vectors
        self.vector_store = SQLiteVec(
            db_file=self.settings.DATABASE_URL,  # Ensure this is a valid SQLite file path
            embedding_function=self.embeddings
        )
        
        # Text splitter configuration
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.settings.CHUNK_SIZE,
            chunk_overlap=self.settings.CHUNK_OVERLAP
        )
        
        # LLM Configuration
        self.llm = ChatOpenAI(
            temperature=0,
            model_name=self.settings.MODEL_NAME,
            openai_api_key=self.settings.OPENAI_API_KEY
        )
    
    async def process_document(self, file_path: str) -> str:
        # Generate a unique document ID
        document_id = str(uuid.uuid4())
        
        # Load and process the document using PyPDFLoader
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Split the documents into chunks
        chunks = self.text_splitter.split_documents(documents)
        
        # Create embeddings and store them in the vector store
        texts = [chunk.page_content for chunk in chunks]
        metadatas = [{"document_id": document_id} for _ in chunks]
        
        self.vector_store.add_texts(
            texts=texts,
            metadatas=metadatas
        )
        
        return document_id
    
    async def get_response(self, query: str):
        # Create a ConversationalRetrievalQA chain
        qa_chain = ConversationalRetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=self.vector_store.as_retriever(),
            return_source_documents=True
        )
        
        # Get a response asynchronously
        response = await qa_chain.acall(
            {"question": query, "chat_history": []}
        )
        
        return response
