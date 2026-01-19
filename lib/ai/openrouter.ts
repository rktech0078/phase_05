import OpenAI from "openai";

export const openRouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", // Optional, for including your app on openrouter.ai rankings.
        "X-Title": "Todo AI Chatbot", // Optional. Shows in rankings on openrouter.ai.
    },
});
