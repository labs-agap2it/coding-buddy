import * as vscode from 'vscode';

export function getAPIKey():string | undefined{
    let apiKey:string | undefined = vscode.workspace.getConfiguration("codingBuddy").get("apiKey");
    if(apiKey === "" || apiKey === undefined){
        vscode.window.showErrorMessage("No API Key provided. Do you want to open the settings page to provide an API Key?", "Yes", "No").then((value) => {
            if(value === "Yes"){
                vscode.commands.executeCommand("workbench.action.openSettings", "codingBuddy.apiKey");
            }
        });
    }
    return apiKey;
}

export function getMaxSavedMessages():number{
    let maxSavedMessages:number | undefined = vscode.workspace.getConfiguration("codingBuddy").get("maxSavedMessages");
    if(maxSavedMessages === 0 || maxSavedMessages === undefined){
        maxSavedMessages = 5;
    }else if (maxSavedMessages > 25){
        maxSavedMessages = 25;
    }
    vscode.workspace.getConfiguration("codingBuddy").update("maxSavedMessages", maxSavedMessages, vscode.ConfigurationTarget.Global);
    return maxSavedMessages;
}

export function getModel() {
    let model:string | undefined = vscode.workspace.getConfiguration("codingBuddy").get("model");
    if(model === "" || model === undefined){
        model = "gpt-3.5-turbo";
    }
    return model;
}
