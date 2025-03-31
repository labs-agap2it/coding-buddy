import * as vscode from 'vscode';
import { CodingBuddyViewProvider } from './extension/webviewChat';
import * as chatService from './extension/chatService';
import * as textChat from './extension/textChat';

export function activate(context: vscode.ExtensionContext) {
	console.log('Coding Buddy Activated');
	const provider = new CodingBuddyViewProvider(context.extensionUri);

	const codingBuddyWebviewProvider = vscode.window.registerWebviewViewProvider(
		CodingBuddyViewProvider.viewType,
		provider
	);

	const newChatWebview = vscode.commands.registerCommand('coding-buddy.newChat', async () => {
		chatService.openNewChat(provider);
	});
	const deleteChatWebview = vscode.commands.registerCommand('coding-buddy.deleteChat', async () => {
		chatService.deleteChat(provider);
	});
	const changeChatWebview = vscode.commands.registerCommand('coding-buddy.changeChat', async () => {
		chatService.changeChat(provider);
	});
	const editCHatName = vscode.commands.registerCommand('coding-buddy.editChatName', async () => {
		chatService.editChatName(provider);
	});

	const showCommandPalletteChat = vscode.commands.registerCommand('coding-buddy.textChat', async () => {
		textChat.showCommandPalletteChat(provider);	
	});
	const openSettings = vscode.commands.registerCommand('coding-buddy.goToSettings', async()=> vscode.commands.executeCommand('workbench.action.openSettings', 'coding-buddy'));

	context.subscriptions.push(
		codingBuddyWebviewProvider,
		openSettings
	);
}

export function deactivate() {}
