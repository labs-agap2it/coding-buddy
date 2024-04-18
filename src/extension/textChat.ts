import * as vscode from 'vscode';
import { CodingBuddyViewProvider } from './webviewChat';


export async function showCommandPalletteChat(webview:CodingBuddyViewProvider){
    let userMessage = await vscode.window.showInputBox({prompt: 'Type your message here'});
    if(userMessage) {
        await webview.sendMessage(userMessage);
        vscode.commands.executeCommand('coding-buddy.buddyWebview.focus');
    }
}