//LLM + External tool (Function)
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import readlineSync from 'readline-sync';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const History = []; //manually manage
function sum({ num1, num2 }) {
  return num1 + num2;
}

function prime({ num }) {
  if (num <= 1) return false;
  for (let i = 2; i < Math.sqrt(num); i++) {
    if (num % i === 0) {
      return false;
    }
  }
  return true;
}

async function getCryptoPrice({ coin }) {
  const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`);
  const data = await response.json();
  return data;
}

const cryptoDeclaration = {
  name: 'getCryptoPrice',
  description: 'This function takes a cryptocurrency name as input and returns its current price in USD.',
  parameters: {
    type: 'object',
    properties: {
      coin: { type: 'string', description: "The name of the cryptocurrency to get the price for like, 'bitcoin'" }
    },
    required: ['coin']
  }
};

const primeDeclaration = {
  name: 'prime',
  description: "This function takes a number as input and returns true if it's prime, false otherwise.",
  parameters: {
    type: 'object',
    properties: {
      num: { type: 'number', description: 'It will be the number to find it is prime or not ex:7' }
    },
    required: ['num']
  }
};

const sumDeclaration = {
  name: 'sum',
  description: 'This function takes two numbers as input and returns their sum.',
  parameters: {
    type: 'object',
    properties: {
      num1: { type: 'number', description: 'First number for addition ex:10' },
      num2: { type: 'number', description: 'Second number for addition ex:5' }
    },
    required: ['num1', 'num2']
  }
};

const availableTools = {
  sum: sum,
  prime: prime,
  getCryptoPrice: getCryptoPrice
};
async function runAgent(userProblem) {
  History.push({ role: 'user', parts: [{ text: userProblem }] });

  //more funtion call need then
  while (true) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: History, //to maintain chat history whole previous context given
      config: {
        systemInstruction: `You are an AI Agent, You have access of 3 available tools like to
        to find sum of 2 number, get crypto price of any currency and find a number is prime or not
        
        Use these tools whenever required to confirm user query.
        If user ask general question you can answer it directly if you don't need help of these three tools`,
        tools: [
          {
            functionDeclarations: [sumDeclaration, primeDeclaration, cryptoDeclaration]
          }
        ]
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      // may be return array need to function call
      // [ {name:"sum", args:{num1:7,num2:5}} ,{name:"prime", args:{num:7}}]
      // ex : 7 and 5 ka sum kya hain or 7 prime hain ya nahi
      console.log(response.functionCalls[0]);
      const { name, args } = response.functionCalls[0]; //assume single function call

      const funCall = availableTools[name];
      const result = await funCall(args);

      const functionResponsePart = {
        name: name,
        response: {
          result: result
        }
      };
      //{ functionCall: { name: "...", args: { ... } } }
      //{ functionResponse: { name: "...", response: {...} } }
      // model
      History.push({ role: 'model', parts: [{ functionCall: response.functionCalls[0] }] });
      // push result into history given by role : functions
      History.push({ role: 'user', parts: [{ functionResponse: functionResponsePart }] });

      /*if(availableTools[name]){
            availableTools[name](args);
        }*/
      /*if(name == "sum"){
            sum(args); //args is object so {num1,num2}
        }else if(name == "prime"){
            prime(args);
        }else if(name == "getCryptoPrice"){
            getCryptoPrice(args);
        }*/
    } else {
      // final answer given no function calls
      History.push({ role: 'model', parts: [{ text: response.text }] });
      console.log('\n' + response.text);
      break;
    }
  }
}

// llm can not run/execute,calculate ,no live data aceess,no db acess,can indicate
//subscription llm+tool
//return by llm tools not llm it'self :
//                {name:"getCryptoPrice", args:{coin:"bitcoin"}}
//                {name:"sum", args:{num1:7,num2:5}}

// 7 and 5 ka sum bata here how we know to called sum function (Unstructured)
// solve if we know 1.which function to call
//                  2.parameter list to pass

async function main(params) {
  const userProblem = readlineSync.question('Ask me something => ');
  await runAgent(userProblem);
  main();
}

main();
