import * as vscode from 'vscode';
import { CodingBuddyViewProvider } from './extension/codingBuddyChat';
import { addUserDefaults } from './extension/settingEditor';

export function activate(context: vscode.ExtensionContext) {

	const provider = new CodingBuddyViewProvider(context.extensionUri);

	const codingBuddyWebviewProvider = vscode.window.registerWebviewViewProvider(
		CodingBuddyViewProvider.viewType,
		provider
	);

	const settingEditor = vscode.commands.registerCommand('coding-buddy.setDefaults', async ()=> addUserDefaults());

	context.subscriptions.push(
		codingBuddyWebviewProvider,
		settingEditor
	);
}

export function deactivate() {}
