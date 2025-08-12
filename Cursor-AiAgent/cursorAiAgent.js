//LLM + External tool (Function) executeCommands only
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import readlineSync from 'readline-sync';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const asyncExecute = promisify(exec); //promise return
const platform = os.platform();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const History = []; //manually manage

//tool create that execute ai given terminal/shell commands
async function executeCommands({ command }) {
  try {
    const { stdout, stderr } = await asyncExecute(command); //execute the command exec(command)
    if (stderr) {
      return `Error: ${stderr}`; //code error then stderr
    }
    return `Success: ${stdout} || Task executed successfully`; //return standard output and error
  } catch (error) {
    console.error('Error executing command:', error);
    return `Error: ${error.message}`; //wrong command given then
  }
}

const executeCommandDeclaration = {
  name: 'executeCommands',
  description: `Execute a single terminal/shall command.A command can be to create a folder , 
                file , write on a file , edit the file or delete the file etc.`,
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string', description: "The shell command to execute. ex: 'mkdir calculator'" }
    },
    required: ['command']
  }
};

const availableTools = {
  executeCommands: executeCommands
};
async function runAgent(userProblem) {
  History.push({ role: 'user', parts: [{ text: userProblem }] });

  //more funtion call need then
  while (true) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: History, //to maintain chat history whole previous context given
      config: {
        systemInstruction: `You are a website builder expert. Your job is to help the user create the frontend of a website by analyzing their input. You have access to tools that can run or execute any shell or terminal commands.

                The user's current operating system is: ${platform}
                Always give commands that are compatible with this OS.

                Your workflow:
                1. Analyze the user's request to determine what kind of website they want.
                2. Give commands one by one, step by step.
                3. Use the available tool 'executeCommands' for every command.

                Follow this sequence for every website project:
                1. Create a folder for the project. Example: mkdir calculator
                2. Inside the folder, create index.html. Example: type nul > "calculator/index.html"
                3. Create style.css. Example: type nul > "calculator/style.css"
                4. Create script.js. Example: type nul > "calculator/script.js"
                5. Write the necessary code into index.html. Example: echo ^<html^>^<body^>Calculator^</body^>^</html^> > "calculator/index.html"
                6. Write the necessary code into style.css. Example: echo body { background-color: #f0f0f0; } > "calculator/style.css"
                7. Write the necessary code into script.js. Example: echo console.log("Calculator loaded"); > "calculator/script.js"

                Important:
                - After creating each file, always generate commands to write the required HTML, CSS, or JS code into those files.
                - For multi-line code, use PowerShell commands or multiple echo statements. Example for multi-line HTML:
                    powershell -Command "Add-Content -Path 'calculator/index.html' -Value '<html>'"
                    powershell -Command "Add-Content -Path 'calculator/index.html' -Value '<body>Calculator</body>'"
                    powershell -Command "Add-Content -Path 'calculator/index.html' -Value '</html>'"
                - Do not skip the code-writing steps. Every file must contain the appropriate code, not be empty.
                - Only use commands that are supported by the user's operating system.

                After creating and writing to the files, you may continue with further steps as needed for the user's website.`,
        tools: [
          {
            functionDeclarations: [executeCommandDeclaration]
          }
        ]
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
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
  console.log("Welcome to the AI Agent! I am a cursor : Let's create a website together.");
  const userProblem = readlineSync.question('Ask me something => ');
  await runAgent(userProblem);
  main();
}

main();
