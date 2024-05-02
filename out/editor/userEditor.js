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
exports.declineChanges = exports.acceptChanges = exports.checkForUserInputOnEditor = exports.insertSnippetsOnEditor = exports.getUserCode = void 0;
const vscode = __importStar(require("vscode"));
const chatHistory = __importStar(require("../chat/chatHistory"));
function getUserCode() {
    let code = vscode.window.activeTextEditor?.document.getText() || "";
    let lines = code.split(/\r\n|\r|\n/);
    let formattedCode = "";
    for (let i = 0; i < lines.length; i++) {
        formattedCode += `${i + 1}: ${lines[i]}\n`;
    }
    return `
    ### FILE URI: ${vscode.window.activeTextEditor?.document.uri.toString()} ###
    ### CODE START
    ${formattedCode}
    ### CODE END`;
}
exports.getUserCode = getUserCode;
async function insertSnippetsOnEditor(changeList, changeID) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    //insert snippet
    let previousCode = editor.document.getText();
    for (let i = 0; i < changeList.length; i++) {
        let change = changeList[i];
        let start = new vscode.Position(change.lines.start - 1, 0);
        let end = new vscode.Position(change.lines.end - 1, 0);
        if (change.isSingleLine) {
            end = new vscode.Position(change.lines.start - 1, previousCode.split(/\r\n|\r|\n/)[change.lines.start - 1].length);
        }
        let range = new vscode.Range(start, end);
        await editor.edit((editBuilder) => {
            if (change.willReplaceCode) {
                editBuilder.delete(range);
            }
            editBuilder.insert(start, change.text + change.signature);
        });
    }
    ;
    let response = {
        code: previousCode,
        changeID: changeID,
        signature: changeList[0].signature
    };
    return response;
    //store code temporarily
}
exports.insertSnippetsOnEditor = insertSnippetsOnEditor;
async function checkForUserInputOnEditor(webview) {
    let userCode = vscode.window.activeTextEditor?.document.getText();
    let newCode = vscode.window.activeTextEditor?.document.getText();
    while (newCode === userCode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        newCode = vscode.window.activeTextEditor?.document.getText();
    }
    verifyChangeOnWebview(webview);
}
exports.checkForUserInputOnEditor = checkForUserInputOnEditor;
function verifyChangeOnWebview(webview) {
    let openedChat = chatHistory.getOpenedChat();
    if (!openedChat || openedChat.length === 0) {
        return;
    }
    let lastMessage = openedChat[openedChat.length - 1];
    let llmResponse = lastMessage.llmResponse;
    if (llmResponse.code[0].hasPendingChanges) {
        // accept changes without modifying code
        chatHistory.handleChanges(llmResponse.code[0].changeID, true);
        webview.changeChat();
    }
}
function acceptChanges(changeID, signature) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    //remove "coding buddy" comments
    let previousCode = editor.document.getText();
    previousCode = previousCode.replaceAll(signature, "");
    //insert new code
    editor.edit((editBuilder) => {
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), previousCode);
    });
    chatHistory.handleChanges(changeID, true);
}
exports.acceptChanges = acceptChanges;
function declineChanges(changeID, codeArray) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    //restore old code from array
    let changeIndex = codeArray.findIndex((element) => element.changeID === changeID);
    let previousCode = codeArray[changeIndex].code;
    editor.edit((editBuilder) => {
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), previousCode);
    });
    chatHistory.handleChanges(changeID, false);
}
exports.declineChanges = declineChanges;
//# sourceMappingURL=userEditor.js.map