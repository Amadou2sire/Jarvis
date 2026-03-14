import { askLLM } from './llm.js';
import { getHistory, addMessage } from './memory.js';
import { getCurrentTimeToolDefinition, getCurrentTime } from './tools/get_current_time.js';
import { getWeather } from './weather.js';
import { researchTopic } from './research.js';

const SYSTEM_PROMPT = `Tu es Jarvis, l'assistant personnel intelligent et sophistiqué de ton utilisateur.
- Tu communiques via Telegram.
- Tes réponses textuelles sont automatiquement converties en audio, donc sois expressif mais garde tes réponses relativement concises pour une meilleure écoute.
- Tu réponds toujours en français, de manière polie, efficace et avec une touche de personnalité (style JARVIS de Iron Man).
- Tu as accès à des outils pour t'aider dans tes tâches : donner l'heure, la météo, ou effectuer des recherches approfondies sur le web (semblable à NotebookLM) pour répondre à des questions complexes.`;

const availableTools: Record<string, Function> = {
    "get_current_time": getCurrentTime,
    "get_weather": getWeather,
    "research_topic": researchTopic
};

const toolDefinitions = [
    getCurrentTimeToolDefinition,
    {
        type: "function",
        function: {
            name: "get_weather",
            description: "Obtient la météo actuelle et les prévisions pour une ville donnée.",
            parameters: {
                type: "object",
                properties: {
                    city: {
                        type: "string",
                        description: "Le nom de la ville (ex: Paris, London, Tokyo)."
                    }
                },
                required: ["city"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "research_topic",
            description: "Effectue une recherche approfondie sur le web pour trouver des informations précises sur un sujet (style NotebookLM).",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Le sujet ou la question à rechercher."
                    }
                },
                required: ["query"]
            }
        }
    }
];

export async function processUserMessage(userId: string, message: string): Promise<string> {
    // 1. Save user message
    await addMessage(userId, 'user', message);
    
    // 2. Load history (last 10 messages context)
    const history = await getHistory(userId, 10);
    
    const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history
    ];
    
    const maxIterations = 5;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        iteration++;
        
        // 3. Call LLM
        const response = await askLLM(messages, toolDefinitions);
        messages.push(response);
        
        // 4. Check for tool calls
        if (response.tool_calls && response.tool_calls.length > 0) {
            for (const toolCall of response.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments || '{}');
                
                let toolResult = "";
                if (functionName === "get_current_time") {
                    toolResult = await availableTools[functionName]();
                } else if (functionName === "get_weather") {
                    toolResult = await availableTools[functionName](args.city);
                } else if (functionName === "research_topic") {
                    toolResult = await availableTools[functionName](args.query);
                } else {
                    toolResult = `Error: Tool ${functionName} not found.`;
                }
                
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: toolResult
                });
            }
            // Loop goes to next iteration to give llm the tool result
            continue;
        }
        
        // 5. If no tool call, we have the final answer
        if (response.content) {
            addMessage(userId, 'assistant', response.content as string);
            return response.content as string;
        }
    }
    
    return "Je suis désolé, j'ai mis trop de temps à réfléchir. Pouvez-vous reformuler votre question ?";
}
