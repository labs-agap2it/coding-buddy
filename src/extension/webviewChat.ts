import * as vscode from "vscode";
import {
  getProjectId,
  initializeHashDatabase,
  onDeleteTextDocumentEvent,
  onRenameTextDocumentEvent,
  onSaveTextDocumentEvent,
} from "../changeDetector/changeDetector";
import { getEventEmitter } from "../Eventbus";
import * as codeHistory from "../tempManagement/codeHistory";
import * as messageHandler from "./messageHandler";
import { getAPIKey } from "../settings/savedSettings";
import { changeOpenedFile } from "../editor/userEditor";

export class CodingBuddyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "coding-buddy.buddyWebview";

  private _view?: vscode.WebviewView;

  private _codeArray: any[] = codeHistory.getCodeHistory();
  private _infoHistory: string[] = [];
  private _eventEmitter = getEventEmitter("CodingBuddyViewProvider");

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public get codeArray() {
    return this._codeArray;
  }

  public set codeArray(value: any[]) {
    this._codeArray = value;
  }

  public get view() {
    return this._view;
  }

  public get infoHistory(): string[] {
    return this._infoHistory;
  }

  public set infoHistory(value: string[]) {
    this._infoHistory = value;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = await this._getHtmlForWebview(
      webviewView.webview
    );

    this._registerEventListeners(webviewView.webview);

    global.APIKEY = getAPIKey();
    global.projectId = getProjectId();

    await initializeHashDatabase();
  }

  private _registerEventListeners(webview: vscode.Webview) {
    webview.onDidReceiveMessage((data) => {
      this._eventEmitter?.emit(data.type, data.value, this);
    });

    this._eventEmitter?.on("accept-all-changes", (value) =>
      messageHandler.handleAcceptAllChanges(value, this.codeArray)
    );
    this._eventEmitter?.on("decline-all-changes", (value) =>
      messageHandler.handleDeclineAllChanges(value, this.codeArray)
    );
    this._eventEmitter?.on("accept-changes", (value) =>
      messageHandler.handleAcceptChanges(value, this.codeArray)
    );
    this._eventEmitter?.on("decline-changes", (value) =>
      messageHandler.handleDeclineChanges(value, this.codeArray)
    );
    this._eventEmitter?.on("user-prompt", (value) =>
      messageHandler.handleUserPrompt(value, this)
    );
    this._eventEmitter?.on("requesting-history", () =>
      messageHandler.handleRequestingHistory(this)
    );
    this._eventEmitter?.on("change-opened-file", (value) =>
      messageHandler.handleChangeOpenedFile(value, this)
    );
    this._eventEmitter?.on("chat-name-edited", (value) =>
      messageHandler.handleChatNameEdited(value)
    );
    this._eventEmitter?.on("chat-deletion-requested", () =>
      messageHandler.handleChatDeletionRequested(this)
    );
    this._eventEmitter?.on("go-to-file", (value) => {
      changeOpenedFile(value);
    });
    vscode.workspace.onDidSaveTextDocument(async (event) => {
      await onSaveTextDocumentEvent(event);
    });

    vscode.workspace.onDidDeleteFiles(async (event) => {
      await onDeleteTextDocumentEvent(event);
    });

    vscode.workspace.onDidRenameFiles(async (event) => {
      await onRenameTextDocumentEvent(event);
    });
  }

  async _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src/webview-assets/sidebar-webview",
        "sidebar-chat.css"
      )
    );

    const htmlUri = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src/webview-assets/sidebar-webview",
        "chat.html"
      )
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "src/webview-assets/sidebar-webview/dist",
        "main.bundle.js"
      )
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

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

    const scriptLoad = `<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;

    return header + htmlUri.toString() + scriptLoad;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
