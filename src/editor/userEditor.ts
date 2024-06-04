import * as vscode from 'vscode';
import * as chatHistory from '../tempManagement/chatHistory';
import * as codeHistory from '../tempManagement/codeHistory';
import { llmChange } from '../model/llmResponse';

export function getUserCode():string{
    let code = vscode.window.activeTextEditor?.document.getText() || "";
    let lines = code.split(/\r\n|\r|\n/);
    let formattedCode = "";
    for(let i = 0; i < lines.length; i++){
        formattedCode += `${i + 1}: ${lines[i]}\n`;
    }

    return `
    ### FILE URI: ${vscode.window.activeTextEditor?.document.uri.toString()} ###
    ### OPEN FILE START
    ${formattedCode}
    ### OPEN FILE END`;
}

var highlightDecoration: vscode.TextEditorDecorationType;

export async function insertSnippetsOnEditor(changeList: llmChange[], changeID: string, file:string){
    let editor = vscode.window.activeTextEditor;

    let parsedFile = vscode.Uri.parse(file);
    console.log(editor?.document.uri);
    console.log(parsedFile);
    if(!editor || editor.document.uri.toString() !== parsedFile.toString()){
        let document = await vscode.workspace.openTextDocument(parsedFile);
        editor = await vscode.window.showTextDocument(document);
    }

    highlightDecoration  = defineHighlightDecoration();

    let previousCode = editor.document.getText();
    let previousCodeArray = previousCode.split(/\r\n|\r|\n/);
    let decorationList: vscode.DecorationOptions[] = [];

    for(let i = 0; i < changeList.length; i++){
        let decorationRange = await changeTextOnEditor(changeList[i], editor, previousCodeArray);
        decorationList.push(showDecorationsOnEditor(decorationRange, changeList[i], previousCodeArray));
    };
    editor.setDecorations(highlightDecoration, decorationList);

    let response = {
        code: previousCode,
        changeID: changeID,
        filePath: file.toString()
    };
    codeHistory.saveCodeHistory(response);
}

function defineHighlightDecoration(): vscode.TextEditorDecorationType{
    return vscode.window.createTextEditorDecorationType({
        light:{
            backgroundColor: 'lightgreen'
        },
        dark:{
            backgroundColor: 'green'
        }
    });
}

async function changeTextOnEditor(change:llmChange, editor:vscode.TextEditor, previousCodeArray:string[]):Promise<vscode.Range>{
    let start = new vscode.Position(change.lines.start -1 , 0);
    let end = new vscode.Position(change.lines.end -1 , 0);
    if(change.isSingleLine){
        if(previousCodeArray.length < change.lines.start){
            end = new vscode.Position(change.lines.end -1, 0);
        }else{
            end = new vscode.Position(change.lines.start - 1, previousCodeArray[change.lines.start - 1].length);
        }
    }
    
    let range = new vscode.Range(start, end);
    await editor.edit((editBuilder)=>{
        if(change.willReplaceCode){
            editBuilder.delete(range);
        }
        if(change.lines.start > previousCodeArray.length){
            for(let i = previousCodeArray.length; i < change.lines.start; i++){
                editBuilder.insert(new vscode.Position(i, 0), "\n");
            }
        }
        let lineText = editor.document.getText().split(/\r\n|\r|\n/)[start.line];
        if(!change.willReplaceCode && lineText !== ""){
            change.text += "\n";
        }
        editBuilder.insert(start, change.text);
    });
    let changeArray = change.text.split(/\r\n|\r|\n/);
    end = new vscode.Position(start.line + changeArray.length - 1, changeArray[changeArray.length - 1].length);
    range = new vscode.Range(start, end);

    return range;
}

function showDecorationsOnEditor(range:vscode.Range, change:llmChange, previousCodeArray:string[]):vscode.DecorationOptions{
    let hoverText = "";
    if(change.willReplaceCode){
        hoverText = 'Replaced: ' + previousCodeArray[change.lines.start - 1];
    }else{
        hoverText = 'Inserted: ' + change.text;
    }
    return {range: range, hoverMessage: hoverText};
}

export async function checkForUserInputOnEditor(webview: any, changeID:string, codeArray:any[]){
    let file = codeArray.find((element:any)=> element.changeID === changeID).filePath;
    let userCode = vscode.window.activeTextEditor?.document.getText();
    let newCode = vscode.window.activeTextEditor?.document.getText()!;
    while(newCode === userCode && vscode.window.activeTextEditor?.document.uri.toString() === file.toString()){
            await new Promise(resolve => setTimeout(resolve, 250));
            if(vscode.window.activeTextEditor?.document.uri.toString() === file.toString()){
                newCode = vscode.window.activeTextEditor?.document.getText()!;
            }
    }
    if(vscode.window.activeTextEditor?.document.uri.toString() === file.toString()){
        verifyChangeOnWebview(webview, changeID);
    }
}

function verifyChangeOnWebview(webview:any, changeID:string){
    let openedChat = chatHistory.getOpenedChat();
    if(!openedChat || openedChat.length === 0) {return;}
    
    let lastMessage = openedChat[openedChat.length - 1];
    let llmResponse = lastMessage.llmResponse as unknown as { code: any[]};
    if(llmResponse.code[0].hasPendingChanges){  
        chatHistory.handleChanges(changeID, true);
        webview.changeChat();
    }
}

export function handleChangesOnEditor(changeID: any, wasAccepted: boolean, codeArray: any[]) {
    let editor = vscode.window.activeTextEditor;
    if(!editor) {return;}

    let changeIndex = codeArray.findIndex((element:any)=> element.changeID === changeID);

    if(codeArray[changeIndex].filePath.toString() !== editor.document.uri.toString()){
        vscode.workspace.openTextDocument(codeArray[changeIndex].filePath).then((document)=>{
            vscode.window.showTextDocument(document);
        });

        editor = vscode.window.activeTextEditor!;
    }

    let editorCode = editor.document.getText();
    if(!wasAccepted){
        if(!codeArray) {return;}
        let changeIndex = codeArray.findIndex((element:any)=> element.changeID === changeID);
        editorCode = codeArray[changeIndex].code;
    }

    replaceCodeOnEditor(editorCode, codeArray[changeIndex].filePath);
    highlightDecoration.dispose();

    codeHistory.deleteCodeHistory(changeID);

    chatHistory.handleChanges(changeID, wasAccepted);
}

export async function replaceCodeOnEditor(editorCode:string, file:string){
    let editor = vscode.window.activeTextEditor;

    let filePath = vscode.Uri.parse(file.toString());
    if(!editor || editor.document.uri.toString() !== filePath.toString()){
        let document = await vscode.workspace.openTextDocument(filePath);
        editor = await vscode.window.showTextDocument(document);
    }
    
    await editor.edit((editBuilder)=>{
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), editorCode);
    });
}

async function getDecorationRangeFromChange(change:llmChange, editor:vscode.TextEditor, previousCodeArray:string[]):Promise<vscode.Range>{
    let start = new vscode.Position(change.lines.start -1 , 0);
    let end = new vscode.Position(change.lines.end -1 , 0);
    if(change.isSingleLine){
        end = new vscode.Position(change.lines.start - 1, previousCodeArray[change.lines.start - 1].length);
    }else{
        end = new vscode.Position(change.lines.end -1, previousCodeArray[change.lines.end - 1].length);
    }
    
    let range = new vscode.Range(start, end);
    return range;
}

export async function replaceHighlightedCodeOnEditor(changes: llmChange[], changeID:string, file:string) {
    let editor = vscode.window.activeTextEditor;
    let parsedFile = vscode.Uri.parse(file);
    if(!editor || editor.document.uri.toString() !== parsedFile.toString()){
        let document = await vscode.workspace.openTextDocument(parsedFile);
        editor = await vscode.window.showTextDocument(document);
    }

    let editorCode = editor.document.getText();
    let editorCodeArray = editorCode.split(/\r\n|\r|\n/);
    let decorationList: vscode.DecorationOptions[] = [];

    for(let i = 0; i < changes.length; i++){
        let decorationRange = await getDecorationRangeFromChange(changes[i], editor, editorCodeArray);

        decorationList.push(showDecorationsOnEditor(decorationRange, changes[i], editorCodeArray));
    };
    editor.setDecorations(highlightDecoration, decorationList);

    let response = {
        code: editorCode,
        changeID: changeID,
        filePath: file.toString()
    };

    codeHistory.saveCodeHistory(response);
}

