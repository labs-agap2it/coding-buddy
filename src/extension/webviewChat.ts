import * as vscode from "vscode";
import * as buddy from "../llm/connection";
import * as savedSettings from "../settings/savedSettings";
import * as chatHistory from "../tempManagement/chatHistory";
import * as userEditor from "../editor/userEditor";
import * as codeHistory from "../tempManagement/codeHistory";
import { searchForKeywords } from "../fileSystem/fileSearch";
import { prepareFilesForLLM } from "../fileSystem/fileReader";
import { KeywordSearch } from "../model/keywordSearch";
import { llmStatusEnum, llmResponse, llmMessage } from "../model/llmResponse";
import { Message } from "../model/chatModel";

export class CodingBuddyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "coding-buddy.buddyWebview";

  private _view?: vscode.WebviewView;

  private codeArray: any[] = codeHistory.getCodeHistory();

  private infoHistory:string[] = [];
  constructor(private readonly _extensionUri: vscode.Uri) {}

  async handleUserRequestToLLM(message:string, additionalInfo?:string[]){
    let response:llmMessage | undefined = undefined;
    if(additionalInfo === undefined || additionalInfo.length === 0){
      response = await buddy.getLLMJson(message);
    }else{
      this.infoHistory.concat(additionalInfo);
      response = await buddy.getLLMJson(message, this.infoHistory);
    }
    console.log(response);
    if(response.status === llmStatusEnum.success){
      let content = response.content as llmResponse;
      if(content.willNeedMoreInfo){
        this.handleLLMAdditionalInfo(message, content);
      }else{
        this.infoHistory = [];
        if(content.intent === "generate" || content.intent === "fix"){
          await this.handleChangesOnEditor(content);
        }
        this._view?.webview.postMessage({ type: "llm-response", value: content });
        chatHistory.saveChat(message, response.content as llmResponse);
      }
    }else if(response.status === llmStatusEnum.noApiKey){
      let apiKey = savedSettings.getAPIKey();
      if(!apiKey || apiKey === undefined){
        this._view?.webview.postMessage({ type: "no-api-key" });
      }
    }else if(response.status === llmStatusEnum.noResponse){
      this._view?.webview.postMessage({ type: "no-response" });
    }
  }

  async handleLLMAdditionalInfo(userPrompt:string, response:llmResponse){
    let searchResult = await searchForKeywords(response);
    if(searchResult !== undefined && searchResult!.length > 0){
      this._view?.webview.postMessage({ type: "searched_files", value: searchResult });
      let parsedFiles:string[] = [];
      parsedFiles = await prepareFilesForLLM(searchResult as KeywordSearch[]);
      this.handleUserRequestToLLM(userPrompt, parsedFiles);
    }else{
      this._view?.webview.postMessage({ type: "no-search-results" });
    }
  }

  async handleChangesOnEditor(response:llmResponse){
    response.code.forEach(async (element: any) =>
      {
      await userEditor.insertSnippetsOnEditor(element.changes, element.changeID, vscode.Uri.parse(element.file));
      this.codeArray = codeHistory.getCodeHistory();
      userEditor.checkForUserInputOnEditor(this, element.changeID, this.codeArray);
    });
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

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "accept-changes":
          userEditor.handleChangesOnEditor(
            data.value, //changeID
            true, //wasAccepted
            this.codeArray //codeArray
          );
          this.changeChat();
          break;
        case "decline-changes":
          userEditor.handleChangesOnEditor(
            data.value, //changeID
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
          if(history){
            this.restorePreviousSession(history);
          }
          break;
      }
    });
  }

  async restorePreviousSession(history:Message[]){
    for(let i=0; i<history.length; i++){
      if(history[i].llmResponse.code){
        for(let j=0; j<history[i].llmResponse.code.length; j++){
          if(history[i].llmResponse.code[j].hasPendingChanges){
            let llmCode = history[i].llmResponse.code[j];
            let changeID = history[i].llmResponse.code[j].changeID;
            let userOldCodeArray = codeHistory.getCodeHistory();
            let userOldCode = userOldCodeArray.find((element:any)=> element.changeID === changeID);
            await userEditor.replaceCodeOnEditor(userOldCode.code, userOldCode.filePath);
            if(userOldCodeArray.length > 0){
              await userEditor.insertSnippetsOnEditor(llmCode.changes, changeID, vscode.Uri.parse(userOldCode.filePath));
              this.codeArray = codeHistory.getCodeHistory();
              userEditor.checkForUserInputOnEditor(this, changeID, this.codeArray);
            }
          }
        }
      }
    }
  }

  public clearChat() {
    this._view?.webview.postMessage({ type: "clear-chat" });
  }

  public async sendMessage(value: string) {
    this._view?.webview.postMessage({ type: "pallette-message", value: value });
    await this.handleUserRequestToLLM(value);
  }

  public changeChat() {
    this._view?.webview.postMessage({ type: "clear-chat" });
    let history = chatHistory.getOpenedChat();
    this._view?.webview.postMessage({ type: "history", value: history });
  }

  async _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-assets/sidebar-webview",
        "sidebar-chat.css"
      )
    );
    const htmlUri = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-assets/sidebar-webview",
        "chat.html"
      )
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "webview-assets/sidebar-webview",
        "main.js"
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

    const scriptLoad = `<script nonce="${nonce}" src="${scriptUri}"></script>
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
