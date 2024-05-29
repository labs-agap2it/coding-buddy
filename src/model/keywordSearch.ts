import * as vscode from 'vscode';

export interface KeywordSearch{
    keyword: string,
    searchResult:vscode.Uri,
    keywordFound:boolean
}