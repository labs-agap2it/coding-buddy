import * as vscode from "vscode";
import { llmResponse, llmAdditionalInfo } from "../model/llmResponse";
import { KeywordSearch } from "../model/keywordSearch";

// export async function searchForKeywords(response:llmResponse):Promise<KeywordSearch[] | undefined >{
//     //alterar parametros
//     let additionalInfo:llmAdditionalInfo[] = response.additional_info;
//     let files = await searchOnFiles(additionalInfo, response.ignoredDirectories);
//     return files;
// }

// async function searchOnFiles(additionalInfo:llmAdditionalInfo[], ignoredDirectories:string[]):Promise<KeywordSearch[] | undefined>{
//     let files:KeywordSearch[] | undefined = undefined;
//     for(let i = 0; i < additionalInfo.length; i++){
//         console.log(additionalInfo[i]);
//         let file = await searchForKeywordInFile(additionalInfo[i], ignoredDirectories);
//         if(file){
//             if(!files){
//                 files = [];
//             }
//             files.push(file);
//         }
//     }
//     return files;
// }

// async function searchForKeywordInFile(additionalInfo:llmAdditionalInfo, ignoredDirectories:string[]):Promise<KeywordSearch | undefined>{
//     console.log(additionalInfo);
//     let keyword = additionalInfo.keyword;
//     let possiblePath = additionalInfo.possiblePath;
//     let ignoredFile = additionalInfo.ignoredFile;
//     let searchResult:KeywordSearch | undefined = undefined;
//     let workspacePath = vscode.workspace.workspaceFolders?.[0].uri;
//     if(possiblePath){
//             possiblePath = vscode.Uri.parse(possiblePath.toString());
//             let file = await searchforKeywordInPath(keyword, possiblePath);
//             if(!file){
//                 searchResult = {
//                     keyword: keyword,
//                     searchResult: possiblePath,
//                     keywordFound:false
//                 };
//             }else{
//                 searchResult = {
//                     keyword: keyword,
//                     searchResult: file,
//                     keywordFound:true
//                 };
//             }

//             return searchResult;
//     }else{
//         if(!workspacePath){return undefined;}
//         let file = await searchLayer(keyword, workspacePath, ignoredDirectories, ignoredFile);
//         if(file){
//             searchResult = {
//                 keyword: keyword,
//                 searchResult: file,
//                 keywordFound:true
//             };
//         }
//         return searchResult;
//     }
// }

// async function searchforKeywordInPath(keyword:string, possiblePath:vscode.Uri): Promise<vscode.Uri | undefined >{
//     if(!vscode.workspace.fs.stat(possiblePath)){return undefined;}
//     let file = await vscode.workspace.fs.readFile(possiblePath);
//     let content = Buffer.from(file).toString();
//     if(content.includes(keyword)){
//         return possiblePath;
//     }
//     return undefined;
// }

// async function searchLayer(keyword:string, layer:vscode.Uri, ignoredDirectories:string[], ignoredFile:vscode.Uri):Promise<vscode.Uri | undefined>{
//     let sortedQueue = await splitFilesAndDirectoriesOnURI(layer);
//     let queue = sortedQueue.files;
//     let directories = sortedQueue.directories;
//     if(queue.length >= 1){
//         for(let i= 0; i < queue.length; i++){
//             if(queue[i].toString() !== ignoredFile.toString()){
//                 let file = await searchFile(keyword, queue[i]);
//                 if(file){
//                     return queue[i];
//                 }
//             }else{
//                 console.log("conflict found");
//             }
//         }
//     }
//     if(directories.length >= 1){
//         for(let i = 0; i < directories.length; i++){
//             let directory = directories[i];
//             if(!willIgnoreDirectory(directory, ignoredDirectories)){
//                 let file = await searchLayer(keyword, directory, ignoredDirectories, ignoredFile);
//                 if(file){
//                     return file;
//                 }
//             }
//         }
//     }

//     return undefined;
// }

// function willIgnoreDirectory(directory:vscode.Uri, ignoredDirectories:string[]):boolean{
//     for(let i = 0; i < ignoredDirectories.length; i++){
//         if(directory.toString().includes(ignoredDirectories[i])){
//             return true;
//         }
//     }
//     return false;
// }

// async function searchFile(keyword:string, file:vscode.Uri):Promise<boolean>{
//     let fileContent = await vscode.workspace.fs.readFile(file);
//     let content = Buffer.from(fileContent).toString();
//     if(content.includes(keyword)){
//         return true;
//     }
//     return false;
// }

// async function splitFilesAndDirectoriesOnURI(uri:vscode.Uri):Promise<{files:vscode.Uri[], directories:vscode.Uri[]}>{
//     let files:vscode.Uri[] = [];
//     let directories:vscode.Uri[] = [];
//     let originalDir = await vscode.workspace.fs.readDirectory(uri);
//     for(let i = 0; i < originalDir.length; i++){
//         if(originalDir[i][1] === vscode.FileType.File){
//             files.push(vscode.Uri.joinPath(uri, originalDir[i][0]));
//         }else{
//             directories.push(vscode.Uri.joinPath(uri, originalDir[i][0]));
//         }
//     }
//     return {files, directories};
// }
