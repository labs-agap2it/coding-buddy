import { VsCodeApi } from "./types.js";
import { renderChatBox } from "./uiCreator";
import {
  toggleLoader,
  toggleNameChangeBox,
  toggleChatDeleteBox,
} from "./uiHandler";

export function uiListeners(vscode: VsCodeApi) {
  document.getElementById("send-button")?.addEventListener("click", () => {
    let messageBox = document.getElementById("message-box") as HTMLInputElement;
    if (messageBox && !messageBox.value) {
      return;
    }
    messageBox.disabled = true;
    vscode.postMessage({ type: "user-prompt", value: messageBox.value });
    toggleLoader();
    renderChatBox(messageBox.value, true);
    messageBox.value = "";
  });

  document
    .getElementById("messageBoxHover")
    ?.addEventListener("mouseenter", () => {
      let messageBox = document.getElementById(
        "message-box"
      ) as HTMLInputElement;
      let hoverMessage = document.getElementById("hoverMessage");
      if (!hoverMessage) {
        return;
      }
      if (messageBox.disabled === true) {
        if (
          !document
            .getElementById("message-loader")
            ?.classList.contains("hidden")
        ) {
          hoverMessage.innerHTML =
            "Please wait for Coding Buddy's answer before sending another one.";
        } else {
          hoverMessage.innerHTML =
            "You still have pending changes! Please handle them before sending another message.";
        }
        hoverMessage.style.display = "block";
      } else {
        hoverMessage.style.display = "none";
      }
    });

  document
    .getElementById("messageBoxHover")
    ?.addEventListener("mouseleave", () => {
      const hoverMessage = document.getElementById("hoverMessage");
      if (!hoverMessage) {
        return;
      }
      hoverMessage.style.display = "none";
    });

  document
    .getElementById("chatName-input")
    ?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        document.getElementById("edit-chatName")?.click();
      }
    });

  document.getElementById("message-box")?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      document.getElementById("send-button")?.click();
    }
  });

  document.getElementById("edit-chatName")?.addEventListener("click", () => {
    let nameBox = document.getElementById("chatName-input") as HTMLInputElement;
    if (!nameBox.value) {
      return;
    }
    let newChatName = nameBox.value;
    nameBox.value = "";
    nameBox.placeholder = newChatName;
    const deletetionLabel = document.getElementById("deletion-label");
    if (!deletetionLabel) {
      return;
    }
    deletetionLabel.innerHTML =
      "Are you sure you want to delete chat " + newChatName + "?";
    vscode.postMessage({ type: "chat-name-edited", value: newChatName });

    toggleNameChangeBox();
  });

  document.getElementById("confirm-deletion")?.addEventListener("click", () => {
    vscode.postMessage({ type: "chat-deletion-requested" });
    toggleChatDeleteBox();
  });
  document.getElementById("deny-deletion")?.addEventListener("click", () => {
    toggleChatDeleteBox();
  });

  window.addEventListener("keydown", (e) => {
    if (!document.querySelector(".button-container")) {
      return;
    }
    if (document.activeElement === document.querySelector("#message-box")) {
      return;
    }
    if (e.key === "Y" || e.key === "y") {
      const acceptButton = document.querySelector(
        ".accept-button"
      ) as HTMLButtonElement;
      acceptButton.click();
    } else if (e.key === "N" || e.key === "n") {
      const declineButton = document.querySelector(
        ".decline-button"
      ) as HTMLButtonElement;
      declineButton.click();
    }
  });
  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("a");

    if (target instanceof HTMLAnchorElement) {
      e.preventDefault();
      const href = target.getAttribute("href");

      if (href) {
        vscode.postMessage({ type: "go-to-file", value: href });
      }
    }
  });
}
