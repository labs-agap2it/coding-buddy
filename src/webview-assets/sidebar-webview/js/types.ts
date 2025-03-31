import * as vscode from "vscode";

export interface Message {
  type: string;
  value?: any;
}

export interface VsCodeApi {
  postMessage(message: Message): void;
}
export interface llmResponse {
  chat: string;
  code: llmCode[];
  willNeedMoreInfo: boolean;
  ignoredDirectories: string[];
  additional_info: llmAdditionalInfo[];
  explanation: string;
  intent: string;
}

export interface llmCode {
  file: vscode.Uri;
  explanation: string;
  changes: llmChange[];
  changeID: string;
  hasPendingChanges: boolean;
  wasAccepted: boolean;
}

export interface llmChange {
  text: string;
  lines: { start: number; end: number };
  willReplaceCode: boolean;
  isSingleLine: boolean;
}

export interface llmAdditionalInfo {
  possiblePath: vscode.Uri;
  keyword: string;
  ignoredFile: vscode.Uri;
}
