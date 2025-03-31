import * as vscode from "vscode";
import { KeywordSearch } from "../model/keywordSearch";

export async function prepareFilesForLLM(
  filePathArray: KeywordSearch[]
): Promise<string[]> {
  let codeArray: string[] = [];
  for (let i = 0; i < filePathArray.length; i++) {
    let searchResult = filePathArray[i];
    codeArray.push(await defineFileText(searchResult));
  }
  return codeArray;
}

async function defineFileText(currentSearch: KeywordSearch): Promise<string> {
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

function setCodeLinesOnText(code: string): string {
  let lines = code.split(/\r\n|\r|\n/);
  let formattedCode = "";
  for (let i = 0; i < lines.length; i++) {
    formattedCode += `${i + 1}: ${lines[i]}\n`;
  }

  return formattedCode;
}

export async function readProjectFiles(): Promise<vscode.Uri[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace open.");
    return [];
  }

  const rootUri = workspaceFolders[0].uri;
  return getFilesRecursively(rootUri);
}

async function getFilesRecursively(dirUri: vscode.Uri): Promise<vscode.Uri[]> {
  let results: vscode.Uri[] = [];
  const files = await vscode.workspace.fs.readDirectory(dirUri);

  for (const file of files) {
    const fileUri = vscode.Uri.joinPath(dirUri, file[0]);
    const stat = vscode.workspace.fs.stat(fileUri);

    if ((await stat).type === vscode.FileType.Directory) {
      results = results.concat(await getFilesRecursively(fileUri));
    } else {
      results.push(fileUri);
    }
  }
  return results;
}
