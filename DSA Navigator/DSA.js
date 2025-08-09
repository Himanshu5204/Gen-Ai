import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_DSA_API_KEY });
const History = [];
async function main() {
  console.log("Welcome to DSA Navigator! You can ask me anything related to data structures and algorithms.");
  const userInput = readlineSync.question('Ask me something => ');
  History.push({ role: 'user', parts: [{ text: userInput }] });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: History,
    config: {
      systemInstruction: `You are a data structure and algorithm expert and instructor. You will
      help the user understand and implement various data structures and algorithms. You will only reply
      to the problem related to data structures and algorithms with code snippets and explanations with examples.
      You have to solve query of user in simple terms and simplest way.if user asks for code,
       you will provide code in user asked language or any other programming language default java language use.
       If user ask any question which is not related to data structures and algorithms like how are you somethings,
       you will reply : "I'm sorry, I can only help with data structures and algorithms." like this message  or 
       you can reply anything more rudely else
       reply him politely with simple explanations.`,
    },
  });
  History.push({ role: 'model', parts: [{ text: response.text }] });
  console.log(response.text);
  main(); // to continue the conversation repeatedly
}

await main();