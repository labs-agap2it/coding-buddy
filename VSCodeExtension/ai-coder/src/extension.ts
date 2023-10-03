import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "ai-coder" is now active!');

  let disposable = vscode.commands.registerCommand(
    "ai-coder.firstAnswer",
    () => {
      vscode.window.showInformationMessage("AI on training...");
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
