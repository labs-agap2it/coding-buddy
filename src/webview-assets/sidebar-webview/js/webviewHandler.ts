import { Message, VsCodeApi } from "./types";
import { renderChatBox } from "./uiCreator";
import {
  processLLMResponse,
  removeMessages,
  showFoundFiles,
  toggleChatDeleteBox,
  toggleLoader,
  toggleNameChangeBox,
} from "./uiHandler";

export function handlePalletteMessage(message: Message) {
  toggleLoader();
  renderChatBox(message.value, true);
  document.getElementById("message-box")?.setAttribute("disabled", "true");
}

export function handleLlmResponse(vscode: VsCodeApi, message: Message) {
  processLLMResponse(vscode, message.value);
  toggleLoader();
}

export function handleSearchedFiles(message: Message) {
  let foundFiles = message.value;
  showFoundFiles(foundFiles);
}

export function handleHistory(vscode: VsCodeApi, message: Message) {
  let messages = message.value.history;
  let chatName = message.value.chatName;

  const chatNameInput = document.getElementById("chatName-input");
  if (chatNameInput) {
    chatNameInput.setAttribute("placeholder", chatName);
  }
  const deletionLabel = document.getElementById("deletion-label");
  if (deletionLabel) {
    deletionLabel.innerHTML =
      "Are you sure you want to delete chat " + chatName + "?";
  }
  console.log(message.value);
  if (messages === undefined) {
    return;
  }

  messages.forEach((element: any) => {
    renderChatBox(element.userMessage, true);
    processLLMResponse(vscode, element.llmResponse);
  });
  let container = document.getElementById("chat-container");
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
  if (document.querySelector(".button-container")) {
    document.getElementById("message-box")?.setAttribute("disabled", "true");
  }
}

export function handleClearChat() {
  let loader = document.getElementById("message-loader");
  if (!loader?.classList.contains("hidden")) {
    toggleLoader();
  }
  removeMessages();
  document.getElementById("message-box")?.removeAttribute("disabled");
}

export function handleEditName() {
  toggleNameChangeBox();
}

export function handleError() {
  toggleLoader();
  document.getElementById("message-box")?.removeAttribute("disabled");
  renderChatBox(
    "There was an error processing your request. Please try again!",
    false
  );
}

export function handletoggleChatDeletion() {
  toggleChatDeleteBox();
}

export function handle() {
  const loader = document.getElementById("message-loader");
  if (loader?.classList.contains("hidden")) {
    toggleLoader();
    document.getElementById("message-box")?.removeAttribute("disabled");
  }
}
