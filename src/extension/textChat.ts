import * as vscode from 'vscode';
import { CodingBuddyViewProvider } from './webviewChat';
import * as  RequestHandler  from '../llm/requestHandler';


export async function showCommandPalletteChat(webview:CodingBuddyViewProvider){
    let userMessage = await vscode.window.showInputBox({prompt: 'Type your message here'});
    if(userMessage) {
        await sendMessage(userMessage, webview);
        vscode.commands.executeCommand('coding-buddy.buddyWebview.focus');
    }
}
 async function sendMessage(value: string, webview:CodingBuddyViewProvider) {
    webview.view?.webview.postMessage({ type: "pallette-message", value: value });
    await RequestHandler.handleUserRequestToLLM(value, webview);
  }