import * as vscode from 'vscode';
export interface llmResponse{
    chat:string,
    code:llmCode[],
    additional_info:llmAdditionalInfo[],
    explanation:string,
    intent:string
}

export interface llmCode{
    file:vscode.Uri,
    explanation:string,
    changes:llmChange[],
    changeID:string,
    hasPendingChanges:boolean,
    wasAccepted:boolean
}

export interface llmChange{
    text:string,
    lines:{start:number, end:number},
    willReplaceCode:boolean,
    isSingleLine:boolean,
}

export interface llmAdditionalInfo{
    possiblePath:vscode.Uri,
    keywords:string[]
}