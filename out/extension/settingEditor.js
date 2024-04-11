"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addUserDefaults = void 0;
const vscode = __importStar(require("vscode"));
const connection = __importStar(require("../llm/connection"));
async function addUserDefaults() {
    let existingKey = connection.getAPIKey();
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
    let apiKeyValidity = await connection.testAPIKey(apiKey);
    if (!apiKeyValidity) {
        return;
    }
    let selectSaveHistory = await vscode.window.showInputBox({
        title: "Select a maximum number of messages to save (maximum 25)",
        placeHolder: "15",
        value: existingSaveHistory,
        validateInput: (value) => {
            if (!value || isNaN(Number(value))) {
                return "Please enter a valid number";
            }
            if (Number(value) > 25 || Number(value) < 1) {
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
exports.addUserDefaults = addUserDefaults;
//# sourceMappingURL=settingEditor.js.map