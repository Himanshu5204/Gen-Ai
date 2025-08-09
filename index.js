//npm init for dependencies package.json created
// npm install dotenv load .env for api security + npm i readline-sync
// google ai studio gemini api docs https://developers.google.com/ai/gemini
// @google/genai npm install google/genai package-lock.json + node_modules created

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import readlineSync from 'readline-sync';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

//no need to manually handle history
const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [],
});


async function main() {
  const userInput = readlineSync.question('Ask me something => ');
   const response = await chat.sendMessage({
    message: userInput,
  });
  console.log("Chat response :", response.text);
  //console.log("Chat history:", chat.history);
  main(); //to continue the conversation repeatedly
}

await main();
