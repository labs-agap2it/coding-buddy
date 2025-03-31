import { parentPort } from "worker_threads";
import fs from "fs/promises";
import type { DbItem, ContentOfFile } from "../types/types";
import { generateEmbedding } from "../llm/embeddingConnection";
import vectraIndex from "../db/vectra";
import { extractFunctionsFromFile } from "../fileSystem/functionExtrator";

parentPort!.on("message", async (data) => {
  const APIKEY = data.APIKEY;
  const files = data.files;
  const contents: ContentOfFile[] = await readFilesContentsAsync(files);
  const functions: DbItem[] = await extractFunctionsWithEmbeddings(
    contents,
    APIKEY
  );
  const chunks: DbItem[] = await generateChunksWithEmbeddings(contents, APIKEY);
  const dataForVectra: DbItem[] = [...chunks, ...functions];
  parentPort!.postMessage(dataForVectra);
});

export async function readFilesContentsAsync(
  filePaths: string[]
): Promise<ContentOfFile[]> {
  const contents: ContentOfFile[] = [];

  for (const filePath of filePaths) {
    try {
      const content = await fs.readFile(filePath, "utf8");

      contents.push({
        content: content,
        path: filePath,
      });
      console.log(`File read: ${filePath}`);
    } catch (e: any) {
      console.error(`Error reading ${filePath}: ${e.message}`);
    }
  }
  return contents;
}

export async function extractFunctionsWithEmbeddings(
  contents: ContentOfFile[],
  APIKEY: string
) {
  const functionsWithEmbeddings: DbItem[] = [];
  for (const file of contents) {
    const functions = extractFunctionsFromFile(file);
    for (const func of functions) {
      const embedding = await generateEmbedding(func, APIKEY);
      functionsWithEmbeddings.push({
        path: file.path,
        content: func,
        embedding: embedding!,
      });
      console.log(`Function extracted: ${file.path}`);
    }
  }
  return functionsWithEmbeddings;
}

export async function generateChunksWithEmbeddings(
  contents: ContentOfFile[],
  APIKEY: string,
  chunkSize = 8000,
  percentualOverlap = 0.3
) {
  let chunks: DbItem[] = [];

  for (const file of contents) {
    for (
      let i = 0;
      i < file.content.length;
      i += chunkSize * (1 - percentualOverlap)
    ) {
      const chunk = file.content.slice(i, i + chunkSize);
      const embedding = await generateEmbedding(chunk, APIKEY);
      chunks.push({
        path: file.path,
        content: chunk,
        embedding: embedding!,
      });
    }
    console.log(`File chunked: ${file.path}`);
  }
  return chunks;
}
