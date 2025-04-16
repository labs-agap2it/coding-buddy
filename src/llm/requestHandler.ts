import * as webview from "../extension/webviewChat";
import {
  llmAdditionalInfo,
  llmMessage,
  llmResponse,
  llmStatusEnum,
} from "../model/llmResponse";
import * as buddy from "./connection";
import * as savedSettings from "../settings/savedSettings";
import * as vscode from "vscode";
import * as chatHistory from "../tempManagement/chatHistory";
import * as userEditor from "../editor/userEditor";
import vectraIndex from "../db/vectra";
import { generateEmbedding } from "./embeddingConnection";
import { getProjectId } from "../changeDetector/changeDetector";
import {
  clearPromptHistory,
  promptHistory,
} from "../tempManagement/promptHistory";

export async function handleUserRequestToLLM(
  message: string,
  providerInstance: webview.CodingBuddyViewProvider,
  additionalInfo?: llmAdditionalInfo[]
) {
  const response = await fetchLLMResponse(
    message,
    providerInstance,
    additionalInfo
  );

  if (!response) {
    return;
  }

  console.log(response);

  switch (response.status) {
    case llmStatusEnum.success:
      await handleSuccessResponse(response, message, providerInstance);
      break;
    case llmStatusEnum.noApiKey:
      await handleNoApiKey(providerInstance);
      break;
    case llmStatusEnum.noResponse:
      handleNoResponse(providerInstance);
      break;
    default:
      break;
  }
}

async function fetchLLMResponse(
  message: string,
  providerInstance: webview.CodingBuddyViewProvider,
  additionalInfo?: llmAdditionalInfo[]
): Promise<llmMessage | undefined> {
  if (additionalInfo && additionalInfo.length > 0) {
    console.log(providerInstance.infoHistory);
    return await buddy.getLLMJson(message, additionalInfo);
  }
  return await buddy.getLLMJson(message);
}

async function handleSuccessResponse(
  response: llmMessage,
  message: string,
  providerInstance: webview.CodingBuddyViewProvider
) {
  const content = response.content as llmResponse;

  if (content.willNeedMoreInfo) {
    await handleLLMAdditionalInfo(message, content, providerInstance);
  } else {
    global.numberOfTries = 0;
    clearPromptHistory();
    providerInstance.infoHistory = [];
    await handleEditorChanges(content, providerInstance);
    sendResponseToWebView(content, providerInstance);
    chatHistory.saveChat(message, content);
  }
}

async function handleEditorChanges(
  content: llmResponse,
  providerInstance: webview.CodingBuddyViewProvider
) {
  const openedFile = vscode.window.activeTextEditor?.document.uri.toString();

  if (content.intent === "generate" || content.intent === "fix") {
    await userEditor.handleChangesOnEditor(providerInstance, content);
  }

  if (openedFile) {
    vscode.workspace
      .openTextDocument(vscode.Uri.parse(openedFile))
      .then((document) => {
        vscode.window.showTextDocument(document);
      });
  }
}

function sendResponseToWebView(
  content: llmResponse,
  providerInstance: webview.CodingBuddyViewProvider
) {
  providerInstance.view?.webview.postMessage({
    type: "llm-response",
    value: content,
  });
}

async function handleNoApiKey(
  providerInstance: webview.CodingBuddyViewProvider
) {
  const apiKey = savedSettings.getAPIKey();

  if (!apiKey) {
    providerInstance.view?.webview.postMessage({ type: "no-api-key" });
  }
}

function handleNoResponse(providerInstance: webview.CodingBuddyViewProvider) {
  providerInstance.view?.webview.postMessage({ type: "no-response" });
}

export async function handleLLMAdditionalInfo(
  userPrompt: string,
  response: llmResponse,
  providerInstance: webview.CodingBuddyViewProvider
) {
  const result = await generateEmbedding(
    response.promptForSearch,
    global.APIKEY!
  );

  if (global.numberOfTries) {
    global.numberOfTries++;
  } else {
    global.numberOfTries = 1;
  }

  const context = await vectraIndex.queryItems(result!, 3, {
    projectId: { $eq: getProjectId() },
  });
  const additionalInfo: llmAdditionalInfo[] = [];
  context.map((item) => {
    additionalInfo.push({
      path: item.item.metadata.path as string,
      content: item.item.metadata.content as string,
    });
  });
  promptHistory.push(response.promptForSearch);
  handleUserRequestToLLM(userPrompt, providerInstance, additionalInfo);
}
