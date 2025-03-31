import * as vscode from "vscode";
import * as userEditor from "../editor/userEditor";
import * as savedSettings from "../settings/savedSettings";
import * as chatHistory from "../tempManagement/chatHistory";
import * as chatService from "./chatService";
import * as webview from "../extension/webviewChat";
import * as RequestHandler from "../llm/requestHandler";
import {
    llmResponse,
    llmCode,
  } from "../model/llmResponse";

export async function handleAcceptAllChanges(acceptedResponse: llmCode[], codeArray: any) {
  let openedFile = vscode.window.activeTextEditor?.document.uri.toString();

  for (let change of acceptedResponse) {
    if (change.hasPendingChanges) {
      await userEditor.handleUserAcceptance(change.changeID, true, codeArray);
    }
  }

  if (openedFile) {
    vscode.workspace.openTextDocument(vscode.Uri.parse(openedFile))
      .then((document) => vscode.window.showTextDocument(document));
  }
}

export async function handleDeclineAllChanges(declinedResponse: llmCode[], codeArray: any) {
  let openedFile = vscode.window.activeTextEditor?.document.uri.toString();

  for (let change of declinedResponse) {
    if (change.hasPendingChanges) {
      await userEditor.handleUserAcceptance(change.changeID, false, codeArray);
    }
  }

  if (openedFile) {
    vscode.workspace.openTextDocument(vscode.Uri.parse(openedFile))
      .then((document) => vscode.window.showTextDocument(document));
  }
}

export async function handleAcceptChanges(changeID: string, codeArray: any) {
  await userEditor.handleUserAcceptance(changeID, true, codeArray);
}

export async function handleDeclineChanges(changeID: string, codeArray: any) {
  await userEditor.handleUserAcceptance(changeID, false, codeArray);
}

export async function handleUserPrompt(value: any, providerInstance: webview.CodingBuddyViewProvider) {
    RequestHandler.handleUserRequestToLLM(value, providerInstance);
}

export async function handleRequestingHistory(providerInstance: webview.CodingBuddyViewProvider) {
  let apiKey = savedSettings.getAPIKey();
  if (!apiKey) {
    providerInstance.view?.webview.postMessage({ type: "no-api-key" });
    return;
  }

  let history = chatHistory.getOpenedChat();
  let chatName = chatHistory.getChatName();
  providerInstance.view?.webview.postMessage({
    type: "history",
    value: { history, chatName },
  });

  if (history) {
    chatService.restorePreviousSession(history, providerInstance);
  }
}

export async function handleChangeOpenedFile(value: any, providerInstance: webview.CodingBuddyViewProvider) {
  let response = value.response as llmResponse;
  let changeID = value.changeID;
  await userEditor.handleChangesOnEditor(providerInstance, response, changeID);
}

export async function handleChatNameEdited(newName: string) {
  chatHistory.changeChatName(newName);
}

export async function handleChatDeletionRequested(providerInstance: webview.CodingBuddyViewProvider) {
  chatHistory.deleteChat();
  chatService.changeChat(providerInstance);
}
