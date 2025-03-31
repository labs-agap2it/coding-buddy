import OpenAI from "openai";

export async function generateEmbedding(text: string, APIKEY: string) {
  const openai = new OpenAI({ apiKey: APIKEY });
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding!;
  } catch (e) {}
}
