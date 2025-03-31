import {
  renderChangeBox,
  renderChatBox,
  renderMultipleChangeBox,
  renderInfoDiv,
} from "./uiCreator";
import { VsCodeApi } from "./types";

export function toggleLoader() {
  let loader = document.getElementById("message-loader");
  if(!loader){
    return;
  }
  loader.classList.toggle("hidden");
  if (loader.classList.contains("hidden")) {
    removeFileDecorations();
  }
}

export function removeFileDecorations() {
  let fileDecorationWrapper = document.getElementById("info-container");
  if (!fileDecorationWrapper) {
    return;
  }
  fileDecorationWrapper.innerHTML = "";
  if (!fileDecorationWrapper.classList.contains("hidden")) {
    fileDecorationWrapper.classList.add("hidden");
  }
}

export function removeMessages() {
  let chatNameBox = document.getElementById("chatNameBox");
  let chatDeletionBox = document.getElementById("chat-deletion");
  if (!chatNameBox || !chatDeletionBox) {
    return;
  }
  const chatContainer = document.getElementById("chat-container");
  if (!chatContainer) {
    return;
  }
    chatContainer.innerHTML = "";
    chatContainer.appendChild(chatDeletionBox);
    chatContainer.appendChild(chatNameBox);
}

export function showFoundFiles(files : any) {
  console.log(files);
  let infoContainer = document.querySelector("#info-container");
  if (!infoContainer) {
    return;
  }
  if (infoContainer.classList.contains("hidden")) {
    infoContainer.classList.remove("hidden");
  }
  infoContainer.innerHTML = "";
  //compare file paths on list to check for duplicates
  files = files.filter(
    (file : any, index : any) => files.indexOf(file).searchResult === index.searchResult
  );
  files.forEach((element : any) => {
    let filename = element.searchResult.fsPath.split("\\").pop();
    let message = "Sending file " + filename;
    let fileDiv = renderInfoDiv(message, true, infoContainer);
  });
}

export function toggleChatDeleteBox() {
  document.getElementById("chat-deletion")?.classList.toggle("hidden");
  let nameChange = document.getElementById("chatNameBox");
  if(!nameChange){
    return;
  }
  if (!nameChange.classList.contains("hidden")) {
    nameChange.classList.toggle("hidden");
  }
}

export function toggleNameChangeBox() {
  document.getElementById("chatNameBox")?.classList.toggle("hidden");
  let deleteChat = document.getElementById("chat-deletion");
  if(!deleteChat){
    return;
  }
  if (!deleteChat.classList.contains("hidden")) {
    deleteChat.classList.add("hidden");
  }
}

export function toggleDropdown(id : string) {
  let dropdown = document.getElementById(id);
  if(!dropdown){
    return;
  }
  dropdown.classList.toggle("hidden");
  let marker = document.getElementById("marker" + id)!;
  if (marker.classList.contains("codicon-chevron-down")) {
    marker.classList.remove("codicon-chevron-down");
    marker.classList.add("codicon-chevron-up");
  } else {
    marker.classList.remove("codicon-chevron-up");
    marker.classList.add("codicon-chevron-down");
  }
}

export function processLLMResponse(vscode : VsCodeApi, response : any) {
  if (response.intent === "fix" || response.intent === "generate") {
    if (response.code) {
      if (response.code.length === 1) {
        renderChangeBox(vscode, response);
      } else {
        renderMultipleChangeBox(vscode, response);
      }
    } else if (response.additional_info_needed) {
      //TODO this function exists??
     // showNeededInfo(response.additional_info_needed);
    }
  } else {
    if (response.chat) {
      renderChatBox(response.chat, false);
    } else if (response.explanation) {
      renderChatBox(response.explanation, false);
    }
    document.getElementById("message-box")?.removeAttribute("disabled");
  }
}

export function switchOpenedFile(vscode: VsCodeApi, response: any, changeID : string) {
  vscode.postMessage({
    type: "change-opened-file",
    value: { response: response, changeID: changeID },
  });
}
