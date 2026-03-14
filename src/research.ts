import { config } from './config.js';

export async function researchTopic(query: string): Promise<string> {
    if (!config.TAVILY_API_KEY && !config.SERPAPI_API_KEY) {
        return "Erreur: Aucune clé API de recherche (TAVILY_API_KEY ou SERPAPI_API_KEY) n'est configurée.";
    }

    try {
        console.log(`Researching topic: ${query}...`);

        // 1. Try Tavily (Best for LLM grounded research)
        if (config.TAVILY_API_KEY) {
            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    api_key: config.TAVILY_API_KEY,
                    query: query,
                    search_depth: "advanced",
                    include_answer: true,
                    max_results: 5
                })
            });

            if (response.ok) {
                const data = await response.json() as any;
                let result = `Résultats de recherche pour "${query}" :\n\n`;
                
                if (data.answer) {
                    result += `Résumé : ${data.answer}\n\n`;
                }

                if (data.results && data.results.length > 0) {
                    result += "Sources consultées :\n";
                    data.results.forEach((res: any, i: number) => {
                        result += `${i + 1}. ${res.title} (${res.url})\n`;
                    });
                }
                
                return result;
            }
        }

        // 2. Fallback to SerpApi (Google Search)
        if (config.SERPAPI_API_KEY) {
            const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${config.SERPAPI_API_KEY}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json() as any;
                let result = `Résultats Google pour "${query}" :\n\n`;
                
                const snippets = data.organic_results?.slice(0, 3).map((res: any) => `- ${res.title}: ${res.snippet}`).join("\n");
                return result + (snippets || "Aucun résultat trouvé.");
            }
        }

        return "Désolé, je n'ai pas pu effectuer la recherche pour le moment.";

    } catch (error) {
        console.error("Research service error:", error);
        return "Une erreur est survenue lors de la recherche d'informations.";
    }
}
