"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodingBuddyViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const buddy = __importStar(require("../llm/connection"));
const savedSettings = __importStar(require("../settings/savedSettings"));
const chatHistory = __importStar(require("../tempManagement/chatHistory"));
const userEditor = __importStar(require("../editor/userEditor"));
const codeHistory = __importStar(require("../tempManagement/codeHistory"));
const llmResponse_1 = require("../model/llmResponse");
class CodingBuddyViewProvider {
    _extensionUri;
    static viewType = "coding-buddy.buddyWebview";
    _view;
    codeArray = codeHistory.getCodeHistory();
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    async handleUserRequestToLLM(message) {
        let response = await buddy.getLLMJson(message);
        if (response.status === llmResponse_1.llmStatusEnum.success) {
            let content = response.content;
            if (content.intent === "generate" || content.intent === "fix") {
                this.handleChangesOnEditor(content);
            }
            this._view?.webview.postMessage({ type: "llm-response", value: content });
        }
        else if (response.status === llmResponse_1.llmStatusEnum.noApiKey) {
            let apiKey = savedSettings.getAPIKey();
            if (!apiKey || apiKey === undefined) {
                this._view?.webview.postMessage({ type: "no-api-key" });
            }
        }
        else if (response.status === llmResponse_1.llmStatusEnum.noResponse) {
            this._view?.webview.postMessage({ type: "no-response" });
        }
    }
    async handleChangesOnEditor(response) {
        response.code.forEach(async (element) => {
            await userEditor.insertSnippetsOnEditor(element.changes, element.changeID, vscode.Uri.parse(element.file));
            this.codeArray = codeHistory.getCodeHistory();
            userEditor.checkForUserInputOnEditor(this, element.changeID, this.codeArray);
        });
    }
    async resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "accept-changes":
                    userEditor.handleChangesOnEditor(data.value, //changeID
                    true, //wasAccepted
                    this.codeArray //codeArray
                    );
                    this.changeChat();
                    break;
                case "decline-changes":
                    userEditor.handleChangesOnEditor(data.value, //changeID
                    false, //wasAccepted
                    this.codeArray //codeArray
                    );
                    this.changeChat();
                    break;
                case "user-prompt":
                    this.handleUserRequestToLLM(data.value);
                    break;
                case "requesting-history":
                    let validateApiKey = savedSettings.getAPIKey();
                    if (!validateApiKey) {
                        webviewView.webview.postMessage({ type: "no-api-key" });
                        return;
                    }
                    let history = chatHistory.getOpenedChat();
                    webviewView.webview.postMessage({ type: "history", value: history });
                    if (history) {
                        this.restorePreviousSession(history);
                    }
                    break;
            }
        });
    }
    async restorePreviousSession(history) {
        for (let i = 0; i < history.length; i++) {
            if (history[i].llmResponse.code) {
                for (let j = 0; j < history[i].llmResponse.code.length; j++) {
                    if (history[i].llmResponse.code[j].hasPendingChanges) {
                        let llmCode = history[i].llmResponse.code[j];
                        let changeID = history[i].llmResponse.code[j].changeID;
                        let userOldCodeArray = codeHistory.getCodeHistory();
                        let userOldCode = userOldCodeArray.find((element) => element.changeID === changeID);
                        await userEditor.replaceCodeOnEditor(userOldCode.code, userOldCode.filePath);
                        if (userOldCodeArray.length > 0) {
                            await userEditor.insertSnippetsOnEditor(llmCode.changes, changeID, vscode.Uri.parse(userOldCode.filePath));
                            this.codeArray = codeHistory.getCodeHistory();
                            userEditor.checkForUserInputOnEditor(this, changeID, this.codeArray);
                        }
                    }
                }
            }
        }
    }
    clearChat() {
        this._view?.webview.postMessage({ type: "clear-chat" });
    }
    async sendMessage(value) {
        this._view?.webview.postMessage({ type: "pallette-message", value: value });
        await this.handleUserRequestToLLM(value);
    }
    changeChat() {
        this._view?.webview.postMessage({ type: "clear-chat" });
        let history = chatHistory.getOpenedChat();
        this._view?.webview.postMessage({ type: "history", value: history });
    }
    async _getHtmlForWebview(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-assets/sidebar-webview", "sidebar-chat.css"));
        const htmlUri = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this._extensionUri, "webview-assets/sidebar-webview", "chat.html"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "webview-assets/sidebar-webview", "main.js"));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "node_modules", "@vscode/codicons", "dist", "codicon.css"));
        const nonce = getNonce();
        const header = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https://*; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';style-src ${webview.cspSource}">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${codiconsUri}" rel="stylesheet">
      <link href="${styleUri}" rel="stylesheet">

      <title>Coding Buddy Chat</title>
    </head>`;
        const scriptLoad = `<script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
        return header + htmlUri.toString() + scriptLoad;
    }
}
exports.CodingBuddyViewProvider = CodingBuddyViewProvider;
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=webviewChat.js.map