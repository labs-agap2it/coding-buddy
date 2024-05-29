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
exports.prepareFilesForLLM = void 0;
const vscode = __importStar(require("vscode"));
async function prepareFilesForLLM(filePathArray) {
    let codeArray = [];
    for (let i = 0; i < filePathArray.length; i++) {
        let searchResult = filePathArray[i];
        codeArray.push(await defineFileText(searchResult));
    }
    return codeArray;
}
exports.prepareFilesForLLM = prepareFilesForLLM;
async function defineFileText(currentSearch) {
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
function setCodeLinesOnText(code) {
    let lines = code.split(/\r\n|\r|\n/);
    let formattedCode = "";
    for (let i = 0; i < lines.length; i++) {
        formattedCode += `${i + 1}: ${lines[i]}\n`;
    }
    return formattedCode;
}
//# sourceMappingURL=fileReader.js.map