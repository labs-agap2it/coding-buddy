import * as vscode from "vscode";
import * as buddy from "../llm/connection";
import * as savedSettings from "../settings/savedSettings";
import * as chatHistory from "../chat/chatHistory";
import * as userEditor from "../editor/userEditor";

export class CodingBuddyViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "coding-buddy.buddyWebview";

  private _view?: vscode.WebviewView;

  private codeArray: any[] = [];

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = await this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'accept-changes':
          userEditor.acceptChanges(data.value, this.codeArray.find((e) => e.changeID === data.value).signature);
          this.changeChat();
        break;
        case 'decline-changes':
          userEditor.declineChanges(data.value, this.codeArray);
          this.changeChat();
        break;
        case 'user-prompt':
          let response = await buddy.getLLMJson(data.value);
          if(response)
          {
            if(response.intent === "generate" || response.intent === "fix"){
              response.code.forEach(async (element:any)=> {
                //element.changes.forEach((change:any)=> userEditor.insertSnippetsOnEditor(change));
                this.codeArray.push(await userEditor.insertSnippetsOnEditor(element.changes, element.changeID));
                userEditor.checkForUserInputOnEditor(this);
              });
            }
            webviewView.webview.postMessage({type: 'response', value: response});
          }else{
            webviewView.webview.postMessage({type: 'error'});
          }
          break;
        case 'requesting-history':
          let validateApiKey = savedSettings.getAPIKey();
          if(!validateApiKey){
            webviewView.webview.postMessage({type: 'no-api-key'});
            return;
          }
          
          let history = chatHistory.getOpenedChat();
          webviewView.webview.postMessage({type: 'history', value: history});
          break;
      }
    });
  }

  public clearChat(){
    this._view?.webview.postMessage({type: 'clear-chat'});
  }

  public async sendMessage(value:string){
    this._view?.webview.postMessage({type: 'pallette-message', value: value});
    let response = await buddy.getLLMJson(value);
    if(response.intent === "generate" || response.intent === "fix"){
      response.code.forEach(async (element:any)=> this.codeArray.push( await userEditor.insertSnippetsOnEditor(element.changes, element.changeID)));
    }
    this._view?.webview.postMessage({type: 'response', value: response});
    return response;
  }

  public changeChat(){
    this._view?.webview.postMessage({type: 'clear-chat'});
    let history = chatHistory.getOpenedChat();
    this._view?.webview.postMessage({type: 'history', value: history});
  }

  async _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-assets/sidebar-webview', 'sidebar-chat.css'));
    const htmlUri = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this._extensionUri, 'webview-assets/sidebar-webview', 'chat.html'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'webview-assets/sidebar-webview', 'main.js'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

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
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}