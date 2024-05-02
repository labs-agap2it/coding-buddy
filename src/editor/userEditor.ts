import * as vscode from 'vscode';
import * as chatHistory from '../chat/chatHistory';

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

export async function insertSnippetsOnEditor(changeList: ChatData[], changeID: string){
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        return;
    }
    //insert snippet
    let previousCode = editor.document.getText();
    for(let i = 0; i < changeList.length; i++){
        let change = changeList[i];
        let start = new vscode.Position(change.lines.start -1 , 0);
        let end = new vscode.Position(change.lines.end -1 , 0);
        if(change.isSingleLine){
            end = new vscode.Position(change.lines.start - 1, previousCode.split(/\r\n|\r|\n/)[change.lines.start - 1].length);
        }
        let range = new vscode.Range(start, end);
        await editor.edit((editBuilder)=>{
            if(change.willReplaceCode){
                editBuilder.delete(range);
            }
            editBuilder.insert(start, change.text + change.signature);
        });
    };

    let response = {
        code: previousCode,
        changeID: changeID,
        signature: changeList[0].signature
    };
    return response;
    //store code temporarily
}

export async function checkForUserInputOnEditor(webview: any){
    let userCode = vscode.window.activeTextEditor?.document.getText();
    let newCode = vscode.window.activeTextEditor?.document.getText()!;
    while(newCode === userCode){
            await new Promise(resolve => setTimeout(resolve, 1000));
            newCode = vscode.window.activeTextEditor?.document.getText()!;
    }
    verifyChangeOnWebview(webview);
}

function verifyChangeOnWebview(webview:any){
    let openedChat = chatHistory.getOpenedChat();
    if(!openedChat || openedChat.length === 0){
        return;
    }
    let lastMessage = openedChat[openedChat.length - 1];
    let llmResponse = lastMessage.llmResponse as unknown as { code: any[]};
    if(llmResponse.code[0].hasPendingChanges){
        // accept changes without modifying code
        chatHistory.handleChanges(llmResponse.code[0].changeID, true);
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

export function acceptChanges(changeID: any, signature: string) {
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        return;
    }

    //remove "coding buddy" comments
    let previousCode = editor.document.getText();
    previousCode = previousCode.replaceAll(signature, "");

    //insert new code
    editor.edit((editBuilder)=>{
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), previousCode);
    });

    chatHistory.handleChanges(changeID, true);
}
export function declineChanges(changeID: any, codeArray: any[]) {
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        return;
    }

    //restore old code from array
    let changeIndex = codeArray.findIndex((element:any)=> element.changeID === changeID);
    let previousCode = codeArray[changeIndex].code;
    editor.edit((editBuilder)=>{
        editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(editor.document.lineCount, 0)), previousCode);
    });

    chatHistory.handleChanges(changeID, false);
}