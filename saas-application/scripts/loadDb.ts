import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import "dotenv/config";

const {
    PINECONE_API_KEY,
    PINECONE_ENVIRONMENT,
    PINECONE_INDEX,
    OPENAI_API_KEY
} = process.env;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const f1Data = [
    "https://en.wikipedia.org/wiki/Formula_One",
    "https://www.formula1.com/en/latest"
];

const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY!
});

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

const createIndex = async () => {
    try {
        await pinecone.createIndex({
            name: PINECONE_INDEX!,
            dimension: 1536,
            spec: {
                pod: {
                    environment: PINECONE_ENVIRONMENT!,
                    podType: 'starter'
                }
            }
        });
        console.log(`Index ${PINECONE_INDEX} created successfully`);
    } catch (error) {
        console.error('Error creating index:', error);
    }
};

const loadSampleData = async () => {
    const index = pinecone.index(PINECONE_INDEX!);
    
    for await (const url of f1Data) {
        const content = await scrapePage(url);
        const chunks = await splitter.splitText(content);
        
        for await (const chunk of chunks) {
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float"
            });

            // Convert embedding to number array
            const vector = embedding.data[0].embedding;

            try {
                await index.upsert([
                    {
                        id: `chunk_${Math.random().toString(36).substr(2, 9)}`,
                        values: vector,
                        metadata: { text: chunk }
                    }
                ]);
                console.log('Vector upserted successfully');
            } catch (error) {
                console.error('Error upserting vector:', error);
            }
        }
    }
};

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML);
            await browser.close();
            return result;
        }
    });

    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '|');
};

createIndex().then(() => loadSampleData());
