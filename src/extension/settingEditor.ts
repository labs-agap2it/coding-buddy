import * as vscode from 'vscode';
import * as asset from '../utils/configUtils';
import * as apiTest from '../utils/apiTest';

export async function addUserDefaults(){

    let existingKey = asset.getUserToken();
    let existingSaveHistory = asset.getUserSettings();

    let apiKey = await vscode.window.showInputBox({
        title: "Enter your openAI API Key",
        placeHolder: "Your openAI API Key",
        value: existingKey
    });

    if (!apiKey || apiKey === "") {
        vscode.window.showInformationMessage("No key provided");
        return;
    }

    let apiKeyValidity = await apiTest.testAPIKey(apiKey);

    if (!apiKeyValidity) { return; }

    let selectSaveHistory = await vscode.window.showInputBox({
        title: "Select a maximum number of messages to save (maximum 25)",
        placeHolder: "15",
        value: existingSaveHistory,
        validateInput: (value) => {
            if (!value || isNaN(Number(value))) {
                return "Please enter a valid number";
            }

            if(Number(value) > 25 || Number(value) < 1){
                return "Please enter a number between 1 and 25";
            }
            return null;
        }
    });

    if (!selectSaveHistory || selectSaveHistory === "") {
        vscode.window.showInformationMessage("No value provided");
        return;
    }

    let selectSaveHistoryValue = Number(selectSaveHistory);

    asset.setUserToken(apiKey);
    asset.setUserSettings(selectSaveHistoryValue);
}