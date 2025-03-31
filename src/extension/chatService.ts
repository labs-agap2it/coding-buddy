import * as vscode from "vscode";
import * as chatHistory from "../tempManagement/chatHistory";
import * as webview from "../extension/webviewChat";
import { Message } from "../model/chatModel";
import * as codeHistory from "../tempManagement/codeHistory";
import * as userEditor from "../editor/userEditor";

export function openNewChat(webview: webview.CodingBuddyViewProvider) {
  chatHistory.createNewChat();
  clearChat(webview);
}

export function changeChat(webview: webview.CodingBuddyViewProvider) {
  let chatList = getChatListAsQuickPickItems();

  vscode.window.showQuickPick(chatList).then((chat) => {
    if (chat) {
      chatHistory.changeChat(chatList.indexOf(chat));
      handlechangeChat(webview);
    }
  });
}
export function handlechangeChat(webview: webview.CodingBuddyViewProvider) {
  webview.view?.webview.postMessage({ type: "clear-chat" });
  let history = chatHistory.getOpenedChat();
  let chatName = chatHistory.getChatName();
  webview.view?.webview.postMessage({
    type: "history",
    value: { history, chatName },
  });
}

export function editChatName(webview: webview.CodingBuddyViewProvider) {
  webview.view?.webview.postMessage({ type: "edit-name" });
}
export function deleteChat(webview: webview.CodingBuddyViewProvider) {
  webview.view?.webview.postMessage({ type: "toggle-chat-deletion" });
}

export async function restorePreviousSession(
  history: Message[],
  webview: webview.CodingBuddyViewProvider
) {
  for (let i = 0; i < history.length; i++) {
    if (!history[i].llmResponse.code) {
      return;
    }
    for (let j = 0; j < history[i].llmResponse.code.length; j++) {
      if (!history[i].llmResponse.code[j].hasPendingChanges) {
        continue;
      }
      let llmCode = history[i].llmResponse.code[j];
      let changeID = history[i].llmResponse.code[j].changeID;
      let userOldCodeArray = codeHistory.getCodeHistory();
      let userOldCode = userOldCodeArray.find(
        (element: any) => element.changeID === changeID
      );
      await userEditor.replaceCodeOnEditor(
        userOldCode.code,
        userOldCode.filePath.toString()
      );
      if (userOldCodeArray.length > 0) {
        await userEditor.insertSnippetsOnEditor(
          llmCode.changes,
          changeID,
          userOldCode.filePath.toString()
        );
        webview.codeArray = codeHistory.getCodeHistory();
        userEditor.checkForUserInputOnEditor(
          webview,
          changeID,
          webview.codeArray
        );
      }
    }
  }
}

export function clearChat(webview: webview.CodingBuddyViewProvider) {
  webview.view?.webview.postMessage({ type: "clear-chat" });
}

function getChatListAsQuickPickItems(): vscode.QuickPickItem[] {
  let chatList = chatHistory.getChatList();
  let chatListItems: vscode.QuickPickItem[] = [];
  chatList.forEach((chat) => {
    chatListItems.push({ label: chat.title });
  });

  return chatListItems;
}
