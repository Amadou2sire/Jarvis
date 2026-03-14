import Groq from 'groq-sdk';
import { config } from './config.js';

const groq = new Groq({ apiKey: config.GROQ_API_KEY });
const DEFAULT_MODEL = "llama-3.3-70b-versatile"; 

export async function askLLM(messages: any[], tools: any[] = []) {
    // Sanitize messages: strictly keep only standard fields for each role
    const sanitizedMessages = messages.map(msg => {
        const cleanMsg: any = { role: msg.role };
        
        if (msg.role === 'assistant') {
            if (msg.content) cleanMsg.content = msg.content;
            if (msg.tool_calls) cleanMsg.tool_calls = msg.tool_calls;
        } else if (msg.role === 'tool') {
            cleanMsg.tool_call_id = msg.tool_call_id;
            cleanMsg.content = msg.content;
        } else {
            cleanMsg.content = msg.content;
            if (msg.name) cleanMsg.name = msg.name;
        }
        
        return cleanMsg;
    });

    try {
        const response = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: sanitizedMessages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: tools.length > 0 ? "auto" : "none",
        });
        
        return response.choices[0].message;
    } catch (error: any) {
        console.error("Groq API error, attempting fallback to OpenRouter...", error.message);
        
        if (config.OPENROUTER_API_KEY) {
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${config.OPENROUTER_API_KEY}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                      "model": config.OPENROUTER_MODEL,
                      "messages": sanitizedMessages,
                      "tools": tools.length > 0 ? tools : undefined,
                    })
                });
                
                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    return data.choices[0].message;
                }
                throw new Error(data.error?.message || "OpenRouter fallback failed");
            } catch (fallbackError) {
                console.error("OpenRouter fallback also failed:", fallbackError);
            }
        }
        
        throw error;
    }
}
