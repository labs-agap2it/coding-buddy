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
const chatHistory = __importStar(require("../chat/chatHistory"));
class CodingBuddyViewProvider {
    _extensionUri;
    static viewType = "coding-buddy.buddyWebview";
    _view;
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    async resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'user-prompt':
                    let response = await buddy.getLLMJson(data.value);
                    if (response) {
                        webviewView.webview.postMessage({ type: 'response', value: response });
                    }
                    break;
                case 'requesting-history':
                    let validateApiKey = savedSettings.getAPIKey();
                    if (!validateApiKey) {
                        webviewView.webview.postMessage({ type: 'no-api-key' });
                        return;
                    }
                    let history = chatHistory.getOpenedChat();
                    webviewView.webview.postMessage({ type: 'history', value: history });
                    break;
            }
        });
    }
    clearChat() {
        console.log(this._view);
        this._view?.webview.postMessage({ type: 'clear-chat' });
    }
    changeChat() {
        this._view?.webview.postMessage({ type: 'clear-chat' });
        let history = chatHistory.getOpenedChat();
        this._view?.webview.postMessage({ type: 'history', value: history });
    }
    async _getHtmlForWebview(webview) {
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-assets/sidebar-webview', 'sidebar-chat.css'));
        const htmlUri = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this._extensionUri, 'webview-assets/sidebar-webview', 'chat.html'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-assets/sidebar-webview', 'main.js'));
        const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));
        const nonce = getNonce();
        const header = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';style-src ${webview.cspSource}">
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
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=webviewChat.js.map