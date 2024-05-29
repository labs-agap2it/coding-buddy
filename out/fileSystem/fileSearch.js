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
exports.searchForKeywords = void 0;
const vscode = __importStar(require("vscode"));
async function searchForKeywords(response) {
    //alterar parametros
    let additionalInfo = response.additional_info;
    let files = await searchOnFiles(additionalInfo, response.ignoredDirectories);
    return files;
}
exports.searchForKeywords = searchForKeywords;
async function searchOnFiles(additionalInfo, ignoredDirectories) {
    let files = undefined;
    for (let i = 0; i < additionalInfo.length; i++) {
        console.log(additionalInfo[i]);
        let file = await searchForKeywordInFile(additionalInfo[i], ignoredDirectories);
        if (file) {
            if (!files) {
                files = [];
            }
            files.push(file);
        }
    }
    return files;
}
async function searchForKeywordInFile(additionalInfo, ignoredDirectories) {
    console.log(additionalInfo);
    let keyword = additionalInfo.keyword;
    let possiblePath = additionalInfo.possiblePath;
    let searchResult = undefined;
    let workspacePath = vscode.workspace.workspaceFolders?.[0].uri;
    if (possiblePath) {
        possiblePath = vscode.Uri.parse(possiblePath.toString());
        let file = await searchforKeywordInPath(keyword, possiblePath);
        if (!file) {
            searchResult = {
                keyword: keyword,
                searchResult: possiblePath,
                keywordFound: false
            };
        }
        else {
            searchResult = {
                keyword: keyword,
                searchResult: file,
                keywordFound: true
            };
        }
        return searchResult;
    }
    else {
        if (!workspacePath) {
            return undefined;
        }
        let file = await searchLayer(keyword, workspacePath, ignoredDirectories);
        if (file) {
            searchResult = {
                keyword: keyword,
                searchResult: file,
                keywordFound: true
            };
        }
        return searchResult;
    }
}
async function searchforKeywordInPath(keyword, possiblePath) {
    if (!vscode.workspace.fs.stat(possiblePath)) {
        return undefined;
    }
    let file = await vscode.workspace.fs.readFile(possiblePath);
    let content = Buffer.from(file).toString();
    if (content.includes(keyword)) {
        return possiblePath;
    }
    return undefined;
}
async function searchLayer(keyword, layer, ignoredDirectories) {
    let sortedQueue = await splitFilesAndDirectoriesOnURI(layer);
    let queue = sortedQueue.files;
    let directories = sortedQueue.directories;
    if (queue.length >= 1) {
        for (let i = 0; i < queue.length; i++) {
            let file = await searchFile(keyword, queue[i]);
            if (file) {
                return queue[i];
            }
        }
    }
    if (directories.length >= 1) {
        for (let i = 0; i < directories.length; i++) {
            let directory = directories[i];
            if (!willIgnoreDirectory(directory, ignoredDirectories)) {
                let file = await searchLayer(keyword, directory, ignoredDirectories);
                if (file) {
                    return file;
                }
            }
        }
    }
    return undefined;
}
function willIgnoreDirectory(directory, ignoredDirectories) {
    for (let i = 0; i < ignoredDirectories.length; i++) {
        if (directory.toString().includes(ignoredDirectories[i])) {
            return true;
        }
    }
    return false;
}
async function searchFile(keyword, file) {
    let fileContent = await vscode.workspace.fs.readFile(file);
    let content = Buffer.from(fileContent).toString();
    if (content.includes(keyword)) {
        return true;
    }
    return false;
}
async function splitFilesAndDirectoriesOnURI(uri) {
    let files = [];
    let directories = [];
    let originalDir = await vscode.workspace.fs.readDirectory(uri);
    for (let i = 0; i < originalDir.length; i++) {
        if (originalDir[i][1] === vscode.FileType.File) {
            files.push(vscode.Uri.joinPath(uri, originalDir[i][0]));
        }
        else {
            directories.push(vscode.Uri.joinPath(uri, originalDir[i][0]));
        }
    }
    return { files, directories };
}
//# sourceMappingURL=fileSearch.js.map