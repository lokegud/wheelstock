import { GoogleGenAI, Type } from "@google/genai";
import { ScannedItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeHandwrittenList = async (
  base64Image: string,
  mimeType: string,
  currentInventoryNames: string[]
): Promise<ScannedItem[]> => {
  try {
    const model = "gemini-3-pro-preview"; // Explicitly requested model for high reasoning capability
    
    const inventoryContext = currentInventoryNames.length > 0 
      ? `The user manages an inventory with these known items: ${currentInventoryNames.join(", ")}. Use this list to decipher abbreviations (e.g. if 'chx' is written and 'Chicken Breast' is in inventory, map it to 'Chicken Breast').`
      : "";

    const prompt = `
      You are an expert inventory assistant. Analyze this image of a handwritten list.
      
      Your goals:
      1. Identify items and their quantities.
      2. Intelligently interpret culinary shorthand, abbreviations, and slang.
      
      Examples of Shorthand Interpretation:
      - "toms" -> "Tomatoes"
      - "cukes" -> "Cucumbers"
      - "avo" -> "Avocado"
      - "oj" -> "Orange Juice"
      - "shrooms" -> "Mushrooms"
      - "1/2 gal milk" -> Name: "Milk", Quantity: 1 (Normalize units to item counts unless specified)
      - "doz eggs" -> Name: "Eggs", Quantity: 12
      
      ${inventoryContext}

      Ambiguity Handling:
      - If an item is ambiguous (e.g. "cr" could be "Cream" or "Crackers"), set 'confidence' to "low".
      - Provide your best guess as the 'name'.
      - Provide up to 3 other plausible interpretations in the 'alternatives' array.
      
      Output Rules:
      - Always return the 'originalText' exactly as written in the image.
      - Normalize 'name' to Title Case.
      - If no quantity is specified, assume 1.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: {
                type: Type.STRING,
                description: "The normalized name of the item",
              },
              quantity: {
                type: Type.NUMBER,
                description: "The quantity (number)",
              },
              originalText: {
                type: Type.STRING,
                description: "The exact text written on the list",
              },
              confidence: {
                type: Type.STRING,
                enum: ["high", "low"],
                description: "Confidence level of the interpretation",
              },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Alternative interpretations if ambiguous",
              }
            },
            required: ["name", "quantity", "originalText"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data returned from Gemini");
    }

    const items = JSON.parse(jsonText) as ScannedItem[];
    return items;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};