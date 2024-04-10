import * as vscode from 'vscode';

export function getUserCode():string{
    return `### CODE START
    ${vscode.window.activeTextEditor?.document.getText() || "" }
    ### CODE END`;
}