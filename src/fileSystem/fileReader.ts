import * as vscode from 'vscode';
import { KeywordSearch } from '../model/keywordSearch';

export async function prepareFilesForLLM(filePathArray:KeywordSearch[]):Promise<string[]>{
    let codeArray:string[] = [];
    for(let i = 0; i < filePathArray.length; i++){
        let searchResult = filePathArray[i];
        codeArray.push(await defineFileText(searchResult));
    }
    return codeArray;
}

async function defineFileText(currentSearch:KeywordSearch):Promise<string>{
    let buffer = await vscode.workspace.fs.readFile(currentSearch.searchResult);
    let codeFromFile = setCodeLinesOnText(Buffer.from(buffer).toString());
    let codeWithDirectives = `
    ##Search_Result_Start
      fileUri: ${currentSearch.searchResult}
      keyword: ${currentSearch.keyword}
      wasFound: ${currentSearch.keywordFound}
      ##Full_File_Content_Start
        ${codeFromFile}
      ##Full_File_Content_End
    ##Search_Result_End
    `;
    return codeWithDirectives;
}

function setCodeLinesOnText(code:string):string{
    let lines = code.split(/\r\n|\r|\n/);
    let formattedCode = "";
    for(let i = 0; i < lines.length; i++){
        formattedCode += `${i + 1}: ${lines[i]}\n`;
    }

    return formattedCode;
}