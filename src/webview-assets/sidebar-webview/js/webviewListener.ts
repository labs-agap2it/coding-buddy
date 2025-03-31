import { VsCodeApi } from "./types";
import { renderChatBox } from "./uiCreator";
import { getEventEmitter } from "../../../Eventbus";
import {
  handleClearChat,
  handleEditName,
  handleError,
  handleHistory,
  handleLlmResponse,
  handlePalletteMessage,
  handleSearchedFiles,
  handletoggleChatDeletion,
} from "./webviewHandler";
export function webviewListener(vscode: VsCodeApi) {
  const eventEmitter = getEventEmitter("Frontend");

  //displayable message handling
  window.addEventListener("message", (event) => {
    const message = event.data;
    switch (message.type) {
      case "display-message":
        renderChatBox(message.value, false);
        break;
    }
  });

  window.addEventListener("message", (event) => {
    const message = event.data;
    eventEmitter?.emit(message.type, message);
  });

  eventEmitter?.on("pallette-message", (message) => {
    handlePalletteMessage(message);
  });
  eventEmitter?.on("llm-response", (message) => {
    handleLlmResponse(vscode, message);
  });
  eventEmitter?.on("searched-files", (message) => {
    handleSearchedFiles(message);
  });
  eventEmitter?.on("history", (message) => {
    handleHistory(vscode, message);
  });
  eventEmitter?.on("clear-chat", (message) => {
    handleClearChat();
  });
  eventEmitter?.on("edit-name", (message) => {
    handleEditName();
  });
  eventEmitter?.on("error", (message) => {
    handleError();
  });
  eventEmitter?.on("toggle-chat-deletion", (message) => {
    handletoggleChatDeletion();
  });
}
