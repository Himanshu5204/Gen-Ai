//npm init for dependencies package.json created
// npm install dotenv load .env for api security
// google ai studio gemini api docs https://developers.google.com/ai/gemini
// @google/genai npm install google/genai package-lock.json + node_modules created

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    //to maintain chat history whole previous context given
    contents: [
      {
        role: 'user',
        parts: [{text:'hey , my name is himanshu..!'}]
      },
      {
        role:"model",
        parts:[{text:"Hello Himanshu! It's great to meet you."}]
      },
      {
        role: 'user',
        parts: [{text:'what is my name ?'}]
      },
      {
        role:"model",
        parts:[{text:"Your name is Himanshu."}]
      }
    ]
  });
  console.log(response.text);
}

await main();
