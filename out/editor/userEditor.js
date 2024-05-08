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
exports.handleChangesOnEditor = exports.checkForUserInputOnEditor = exports.insertSnippetsOnEditor = exports.getUserCode = void 0;
const vscode = __importStar(require("vscode"));
const chatHistory = __importStar(require("../tempManagement/chatHistory"));
const codeHistory = __importStar(require("../tempManagement/codeHistory"));
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
var highlightDecoration;
async function insertSnippetsOnEditor(changeList, changeID, file) {
    let editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.toString() !== file.toString()) {
        let document = await vscode.workspace.openTextDocument(file);
        editor = await vscode.window.showTextDocument(document);
    }
    highlightDecoration = vscode.window.createTextEditorDecorationType({
        light: {
            backgroundColor: 'lightgreen'
        },
        dark: {
            backgroundColor: 'green'
        }
    });
    let previousCode = editor.document.getText();
    let decorationList = [];
    for (let i = 0; i < changeList.length; i++) {
        let change = changeList[i];
        let start = new vscode.Position(change.lines.start - 1, 0);
        let end = new vscode.Position(change.lines.end - 1, 0);
        let hoverText = "";
        if (change.isSingleLine) {
            if (previousCode.split(/\r\n|\r|\n/).length < change.lines.start) {
                end = new vscode.Position(change.lines.end - 1, 0);
            }
            else {
                end = new vscode.Position(change.lines.start - 1, previousCode.split(/\r\n|\r|\n/)[change.lines.start - 1].length);
            }
        }
        let range = new vscode.Range(start, end);
        hoverText = "Replaced : ´" + editor.document.getText(range) + "´";
        await editor.edit((editBuilder) => {
            if (change.willReplaceCode) {
                editBuilder.delete(range);
            }
            if (change.lines.start > previousCode.split(/\r\n|\r|\n/).length) {
                for (let i = previousCode.split(/\r\n|\r|\n/).length; i < change.lines.start; i++) {
                    editBuilder.insert(new vscode.Position(i, 0), "\n");
                }
                hoverText = "Inserted " + (change.lines.start - previousCode.split(/\r\n|\r|\n/).length) + " new lines";
            }
            editBuilder.insert(start, change.text);
            //update "end" position
        });
        end = new vscode.Position(start.line + change.text.split(/\r\n|\r|\n/).length - 1, change.text.split(/\r\n|\r|\n/)[change.text.split(/\r\n|\r|\n/).length - 1].length);
        range = new vscode.Range(start, end);
        decorationList.push({ range: range, hoverMessage: hoverText });
    }
    ;
    editor.setDecorations(highlightDecoration, decorationList);
    let response = {
        code: previousCode,
        changeID: changeID,
        signature: changeList[0].signature,
        filePath: file.toString()
    };
    console.log(response);
    codeHistory.saveCodeHistory(response);
}
exports.insertSnippetsOnEditor = insertSnippetsOnEditor;
async function checkForUserInputOnEditor(webview, changeID, codeArray) {
    let file = codeArray.find((element) => element.changeID === changeID).filePath;
    let userCode = vscode.window.activeTextEditor?.document.getText();
    let newCode = vscode.window.activeTextEditor?.document.getText();
    while (newCode === userCode) {
        await new Promise(resolve => setTimeout(resolve, 250));
        if (vscode.window.activeTextEditor?.document.uri.toString() === file.toString()) {
            newCode = vscode.window.activeTextEditor?.document.getText();
        }
    }
    console.log("changes was made");
    console.log(newCode);
    verifyChangeOnWebview(webview, changeID);
}
exports.checkForUserInputOnEditor = checkForUserInputOnEditor;
function verifyChangeOnWebview(webview, changeID) {
    let openedChat = chatHistory.getOpenedChat();
    if (!openedChat || openedChat.length === 0) {
        return;
    }
    let lastMessage = openedChat[openedChat.length - 1];
    let llmResponse = lastMessage.llmResponse;
    if (llmResponse.code[0].hasPendingChanges) {
        chatHistory.handleChanges(changeID, true);
        webview.changeChat();
    }
}
function handleChangesOnEditor(changeID, wasAccepted, codeArray) {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    console.log(codeArray);
    console.log(changeID);
    let changeIndex = codeArray.findIndex((element) => element.changeID === changeID);
    console.log(codeArray[changeIndex]);
    if (codeArray[changeIndex].filePath.toString() !== editor.document.uri.toString()) {
        vscode.workspace.openTextDocument(codeArray[changeIndex].filePath).then((document) => {
            vscode.window.showTextDocument(document);
        });
    }
    let editorCode = editor.document.getText();
    if (!wasAccepted) {
        if (!codeArray) {
            return;
        }
        let changeIndex = codeArray.findIndex((element) => element.changeID === changeID);
        editorCode = codeArray[changeIndex].code;
    }
    highlightDecoration.dispose();
    editor.edit((editBuilder) => {
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), editorCode);
    });
    codeHistory.deleteCodeHistory(changeID);
    chatHistory.handleChanges(changeID, wasAccepted);
}
exports.handleChangesOnEditor = handleChangesOnEditor;
//# sourceMappingURL=userEditor.js.map