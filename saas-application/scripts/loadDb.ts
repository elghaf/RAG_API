
import { DataAPIClient, VectorDoc, UUID, ObjectId } from '@datastax/astra-db-ts';

import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";


import "dotenv/config"
import OpenAI from 'openai';

const {OPENAI_API_KEY, ASTRA_DB_APPLICATION_TOKEN, ASTRA_DB_API_ENDPOINT , ASTRA_DB_COLLECTION,ASTRA_DB_NAMESPACE} = process.env

const openai = new OpenAI({apiKey: OPENAI_API_KEY})




const data = [
    
]