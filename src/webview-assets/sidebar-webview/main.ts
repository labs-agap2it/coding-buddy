import { uiListeners } from "./js/uiListener";
import { webviewListener } from "./js/webviewListener";
import { VsCodeApi } from "./js/types";

declare function acquireVsCodeApi(): { postMessage(message: any): void };

(function (): void {
  const vscode : VsCodeApi = acquireVsCodeApi();

  window.onload = function (): void {
    vscode.postMessage({ type: "requesting-history" });
    uiListeners(vscode);
    webviewListener(vscode);
  };
})();


