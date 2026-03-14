export const getCurrentTimeToolDefinition = {
    type: "function" as const,
    function: {
        name: "get_current_time",
        description: "Get the current time and date.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    }
};

export async function getCurrentTime() {
    return new Date().toISOString();
}
