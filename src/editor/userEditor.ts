import * as vscode from 'vscode';
import * as chatHistory from '../tempManagement/chatHistory';
import * as codeHistory from '../tempManagement/codeHistory';

export function getUserCode():string{
    let code = vscode.window.activeTextEditor?.document.getText() || "";
    let lines = code.split(/\r\n|\r|\n/);
    let formattedCode = "";
    for(let i = 0; i < lines.length; i++){
        formattedCode += `${i + 1}: ${lines[i]}\n`;
    }

    return `
    ### FILE URI: ${vscode.window.activeTextEditor?.document.uri.toString()} ###
    ### CODE START
    ${formattedCode}
    ### CODE END`;
}

var highlightDecoration: vscode.TextEditorDecorationType;

export async function insertSnippetsOnEditor(changeList: ChatData[], changeID: string, file:vscode.Uri){
    let editor = vscode.window.activeTextEditor;

    if(!editor || editor.document.uri.toString() !== file.toString()){
        let document = await vscode.workspace.openTextDocument(file);
        editor = await vscode.window.showTextDocument(document);
    }

    highlightDecoration  = vscode.window.createTextEditorDecorationType({
        light:{
            backgroundColor: 'lightgreen'
        },
        dark:{
            backgroundColor: 'green'
        }
    });

    let previousCode = editor.document.getText().split(/\r\n|\r|\n/);
    let decorationList: vscode.DecorationOptions[] = [];
    for(let i = 0; i < changeList.length; i++){
        let change = changeList[i];
        let start = new vscode.Position(change.lines.start -1 , 0);
        let end = new vscode.Position(change.lines.end -1 , 0);
        let hoverText = "";
        if(change.isSingleLine){
            if(previousCode.length < change.lines.start){
                end = new vscode.Position(change.lines.end -1, 0);
            }else{
                end = new vscode.Position(change.lines.start - 1, previousCode[change.lines.start - 1].length);
            }
        }
        let range = new vscode.Range(start, end);
        hoverText = "Replaced : ´" + editor.document.getText(range) + "´";
        await editor.edit((editBuilder)=>{
            if(change.willReplaceCode){
                editBuilder.delete(range);
            }
            if(change.lines.start > previousCode.length){
                for(let i = previousCode.length; i < change.lines.start; i++){
                    editBuilder.insert(new vscode.Position(i, 0), "\n");
                }
                hoverText = "Inserted " + (change.lines.start - previousCode.length)  + " new lines";
            }
            editBuilder.insert(start, change.text);
            //update "end" position
        });
        end = new vscode.Position(start.line + change.text.split(/\r\n|\r|\n/).length - 1, change.text.split(/\r\n|\r|\n/)[change.text.split(/\r\n|\r|\n/).length - 1].length);
        range = new vscode.Range(start, end);
        decorationList.push({range: range, hoverMessage: hoverText});
    };
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

export async function checkForUserInputOnEditor(webview: any, changeID:string, codeArray:any[]){
    let file = codeArray.find((element:any)=> element.changeID === changeID).filePath;
    let userCode = vscode.window.activeTextEditor?.document.getText();
    let newCode = vscode.window.activeTextEditor?.document.getText()!;
    while(newCode === userCode){ // TODO isto pode ser um ciclo infinito caso o utilizador feche o documento. Garantir que o ciclo quebra nesse caso. Considerar também outras alternativas para quebrar o ciclo.
            await new Promise(resolve => setTimeout(resolve, 250));
            if(vscode.window.activeTextEditor?.document.uri.toString() === file.toString()){
                newCode = vscode.window.activeTextEditor?.document.getText()!;
            }
    }
    console.log("changes was made");
    console.log(newCode);
    verifyChangeOnWebview(webview, changeID);
}

function verifyChangeOnWebview(webview:any, changeID:string){
    let openedChat = chatHistory.getOpenedChat();
    if(!openedChat || openedChat.length === 0) return;
    
    let lastMessage = openedChat[openedChat.length - 1];
    let llmResponse = lastMessage.llmResponse as unknown as { code: any[]};
    if(llmResponse.code[0].hasPendingChanges){  
        chatHistory.handleChanges(changeID, true);
        webview.changeChat();
    }
}

interface ChatData{
    text:string, 
    lines: {start:number, end:number},
    isSingleLine: boolean,
    willReplaceCode: boolean,
    signature: string
}

export function handleChangesOnEditor(changeID: any, wasAccepted: boolean, codeArray: any[]) {
    let editor = vscode.window.activeTextEditor;
    if(!editor) return;


    console.log(codeArray);
    console.log(changeID);
    let changeIndex = codeArray.findIndex((element:any)=> element.changeID === changeID);

    console.log(codeArray[changeIndex]);

    if(codeArray[changeIndex].filePath.toString() !== editor.document.uri.toString()){
        vscode.workspace.openTextDocument(codeArray[changeIndex].filePath).then((document)=>{
            vscode.window.showTextDocument(document);
        });
    }
    let editorCode = editor.document.getText();
    if(!wasAccepted){
        if(!codeArray) return;

        let changeIndex = codeArray.findIndex((element:any)=> element.changeID === changeID);
        editorCode = codeArray[changeIndex].code;
    }
    highlightDecoration.dispose();
    editor.edit((editBuilder)=>{
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), editorCode);
    });

    codeHistory.deleteCodeHistory(changeID);

    chatHistory.handleChanges(changeID, wasAccepted);
}