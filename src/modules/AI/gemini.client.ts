import { GoogleGenAI } from "@google/genai";
import { AppError } from "../../utils/AppError.js";

let geminiClient: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI => {

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new AppError("AI service is not configured", 503);
    }

    if (!geminiClient) {
        geminiClient = new GoogleGenAI({ apiKey, });
    }

    return geminiClient;
};

export const getGeminiModel = (): string => {

    return process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";
};