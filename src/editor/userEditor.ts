import * as vscode from "vscode";
import * as chatHistory from "../tempManagement/chatHistory";
import * as codeHistory from "../tempManagement/codeHistory";
import { llmChange, llmCode, llmResponse } from "../model/llmResponse";
import * as webview from "../extension/webviewChat";
import * as chatService from "../extension/chatService";

export function getUserCode(): string {
  let code = vscode.window.activeTextEditor?.document.getText() || "";
  let lines = code.split(/\r\n|\r|\n/);
  let formattedCode = "";
  for (let i = 0; i < lines.length; i++) {
    formattedCode += `${i + 1}: ${lines[i]}\n`;
  }

  return `
    ### FILE URI: ${vscode.window.activeTextEditor?.document.uri.toString()} ###
    ### OPEN FILE START
    ${formattedCode}
    ### OPEN FILE END`;
}
var highlightDecoration: vscode.TextEditorDecorationType;

export async function insertSnippetsOnEditor(
  changeList: llmChange[],
  changeID: string,
  file: string
) {
  let editor = vscode.window.activeTextEditor;
  let parsedFile = vscode.Uri.parse(file);
  console.log(editor?.document.uri);
  console.log(parsedFile);
  if (!editor || editor.document.uri.toString() !== parsedFile.toString()) {
    let document = await vscode.workspace.openTextDocument(parsedFile);
    editor = await vscode.window.showTextDocument(document);
  }

  highlightDecoration = defineHighlightDecoration();

  let previousCode = editor.document.getText(); //*Codigo antigo do ficheiro
  let previousCodeArray = previousCode.split(/\r\n|\r|\n/); //* Codigo antigo do ficheiro dividido por linhas
  let decorationList: vscode.DecorationOptions[] = [];

  for (let i = changeList.length - 1; i >= 0; i--) {
    let decorationRange = await changeTextOnEditor(
      changeList[i],
      editor,
      previousCodeArray
    );
    decorationList.push(
      showDecorationsOnEditor(decorationRange, changeList[i], previousCodeArray)
    );
  }
  editor.setDecorations(highlightDecoration, decorationList);

  let response = {
    code: previousCode,
    changeID: changeID,
    filePath: file.toString(),
  };
  codeHistory.saveCodeHistory(response);
}

function defineHighlightDecoration(): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    light: {
      backgroundColor: "lightgreen",
    },
    dark: {
      backgroundColor: "green",
    },
  });
}

async function changeTextOnEditor(
  change: llmChange,
  editor: vscode.TextEditor,
  previousCodeArray: string[]
): Promise<vscode.Range> {
  // Get the starting position of the change
  let start = getStartPosition(change, previousCodeArray);

  // Get the ending position of the change
  let end = getEndPosition(change, previousCodeArray, start);

  // Define the editing range
  let range = new vscode.Range(start, end);

  await editor.edit((editBuilder) => {
    applyChanges(editBuilder, change, editor, previousCodeArray, start, range);
  });

  // Define the new end position after inserting the text
  end = calculateNewEndPosition(change, start);
  change.lines.end = end.line;
  return new vscode.Range(start, end);
}

/**
 * Gets the starting position where the change will take place in the editor.
 */
function getStartPosition(
  change: llmChange,
  previousCodeArray: string[]
): vscode.Position {
  if (change.lines.start === 0) {
    return new vscode.Position(0, 0);
  }

  let character = 0;
  const prevLineIndex = change.lines.start - 1;
  const prevLineText = previousCodeArray[prevLineIndex] || "";

  if (!change.willReplaceCode && prevLineText !== "") {
    character = prevLineText.length + 1; // Position after the end of the line
  }

  return new vscode.Position(prevLineIndex, character);
}

/**
 * Gets the ending position where the change will stop in the editor.
 */
function getEndPosition(
  change: llmChange,
  previousCodeArray: string[],
  start: vscode.Position
): vscode.Position {
  if (!change.isSingleLine) {
    return new vscode.Position(change.lines.end, 0);
  }

  const lineExists = previousCodeArray.length >= change.lines.start;
  return lineExists
    ? new vscode.Position(start.line, previousCodeArray[start.line].length)
    : new vscode.Position(change.lines.end - 1, 0);
}

/**
 * Applies the changes to the code editor.
 */
function applyChanges(
  editBuilder: vscode.TextEditorEdit,
  change: llmChange,
  editor: vscode.TextEditor,
  previousCodeArray: string[],
  start: vscode.Position,
  range: vscode.Range
) {
  if (change.willReplaceCode) {
    editBuilder.delete(range);
  }

  ensureLinesExist(editBuilder, previousCodeArray, change.lines.start);

  let lineText = editor.document.getText().split(/\r\n|\r|\n/)[start.line];

  if (!change.willReplaceCode && lineText !== "") {
    change.text += "\n";
  }

  editBuilder.insert(start, change.text);
}

/**
 * Ensures that all necessary lines exist before inserting the change.
 */
function ensureLinesExist(
  editBuilder: vscode.TextEditorEdit,
  previousCodeArray: string[],
  startLine: number
) {
  for (let i = previousCodeArray.length; i < startLine; i++) {
    editBuilder.insert(new vscode.Position(i, 0), "\n");
  }
}

/**
 * Calculates the new end position after inserting the text.
 */
function calculateNewEndPosition(
  change: llmChange,
  start: vscode.Position
): vscode.Position {
  const changeArray = change.text.split(/\r\n|\r|\n/);
  return new vscode.Position(
    start.line + changeArray.length - 1,
    changeArray[changeArray.length - 1].length
  );
}

function showDecorationsOnEditor(
  range: vscode.Range,
  change: llmChange,
  previousCodeArray: string[]
): vscode.DecorationOptions {
  let hoverText = "";
  if (change.willReplaceCode) {
    hoverText = "Replaced: " + previousCodeArray[change.lines.start - 1];
  } else {
    hoverText = "Inserted: " + change.text;
  }
  return { range: range, hoverMessage: hoverText };
}

export async function checkForUserInputOnEditor(
  webview: any,
  changeID: string,
  codeArray: any[]
) {
  let file = codeArray.find(
    (element: any) => element.changeID === changeID
  ).filePath;
  let userCode = vscode.window.activeTextEditor?.document.getText();
  let newCode = vscode.window.activeTextEditor?.document.getText()!;
  while (
    newCode === userCode &&
    vscode.window.activeTextEditor?.document.uri.toString() === file.toString()
  ) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    console.log("waiting");
    if (
      vscode.window.activeTextEditor?.document.uri.toString() ===
      file.toString()
    ) {
      newCode = vscode.window.activeTextEditor?.document.getText()!;
    }
  }
  if (
    vscode.window.activeTextEditor?.document.uri.toString() === file.toString()
  ) {
    verifyChangeOnWebview(webview, changeID);
  }
}

function verifyChangeOnWebview(webview: any, changeID: string) {
  let openedChat = chatHistory.getOpenedChat();
  if (!openedChat || openedChat.length === 0) {
    return;
  }

  let lastMessage = openedChat[openedChat.length - 1];
  let llmResponse = lastMessage.llmResponse as unknown as { code: any[] };
  if (llmResponse.code[0].hasPendingChanges) {
    chatHistory.handleChanges(changeID, true);
    chatService.changeChat(webview);
  }
}

export async function handleUserAcceptance(
  changeID: any,
  wasAccepted: boolean,
  codeArray: any[]
) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  let changeIndex = codeArray.findIndex(
    (element: any) => element.changeID === changeID
  );
  let filePath = vscode.Uri.parse(codeArray[changeIndex].filePath.toString());

  if (filePath.toString() !== editor.document.uri.toString()) {
    let document = await vscode.workspace.openTextDocument(filePath);
    editor = await vscode.window.showTextDocument(document);
  }

  let editorCode = editor.document.getText();
  if (!wasAccepted) {
    if (!codeArray) {
      return;
    }
    let changeIndex = codeArray.findIndex(
      (element: any) => element.changeID === changeID
    );
    editorCode = codeArray[changeIndex].code;
  }

  await replaceCodeOnEditor(editorCode, codeArray[changeIndex].filePath);
  highlightDecoration.dispose();

  codeHistory.deleteCodeHistory(changeID);

  chatHistory.handleChanges(changeID, wasAccepted);
}

export async function replaceCodeOnEditor(editorCode: string, file: string) {
  let editor = vscode.window.activeTextEditor;

  let filePath = vscode.Uri.parse(file.toString());
  if (!editor || editor.document.uri.toString() !== filePath.toString()) {
    let document = await vscode.workspace.openTextDocument(filePath);
    editor = await vscode.window.showTextDocument(document);
  }

  await editor.edit((editBuilder) => {
    editBuilder.replace(
      new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(editor.document.lineCount, 0)
      ),
      editorCode
    );
  });
}

async function getDecorationRangeFromChange(
  change: llmChange,
  editor: vscode.TextEditor,
  previousCodeArray: string[]
): Promise<vscode.Range> {
  let start = new vscode.Position(change.lines.start - 1, 0);
  let end = new vscode.Position(change.lines.end - 1, 0);
  if (change.isSingleLine) {
    end = new vscode.Position(
      change.lines.start - 1,
      previousCodeArray[change.lines.start - 1].length
    );
  } else {
    end = calculateNewEndPosition(change, start);
  }

  let range = new vscode.Range(start, end);
  return range;
}

export async function replaceHighlightedCodeOnEditor(
  changes: llmChange[],
  changeID: string,
  file: string
) {
  let editor = vscode.window.activeTextEditor;
  let parsedFile = vscode.Uri.parse(file);
  if (!editor || editor.document.uri.toString() !== parsedFile.toString()) {
    let document = await vscode.workspace.openTextDocument(parsedFile);
    editor = await vscode.window.showTextDocument(document);
  }

  let editorCode = editor.document.getText();
  let editorCodeArray = editorCode.split(/\r\n|\r|\n/);
  let decorationList: vscode.DecorationOptions[] = [];

  for (let i = 0; i < changes.length; i++) {
    let decorationRange = await getDecorationRangeFromChange(
      changes[i],
      editor,
      editorCodeArray
    );

    decorationList.push(
      showDecorationsOnEditor(decorationRange, changes[i], editorCodeArray)
    );
  }

  editor.setDecorations(highlightDecoration, decorationList);

  let response = {
    code: editorCode,
    changeID: changeID,
    filePath: file.toString(),
  };

  codeHistory.saveCodeHistory(response);
}

export async function changeOpenedFile(filePath: string) {
  let editor = vscode.window.activeTextEditor;

  try {
    const targetUri = vscode.Uri.parse(filePath);

    if (!editor) {
      const document = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(document);
      return;
    }
    const currentUri = editor.document.uri;
    if (targetUri !== currentUri) {
      const document = await vscode.workspace.openTextDocument(targetUri);
      await vscode.window.showTextDocument(document);
    }
  } catch (e) {
    vscode.window.showErrorMessage("Error opening file: ${e}");
  }
}

export async function handleChangesOnEditor(
  webview: webview.CodingBuddyViewProvider,
  response: llmResponse,
  changeID?: string
) {
  if (changeID !== undefined && changeID !== "") {
    let element = response.code.find(
      (element: any) => element.changeID === changeID
    );
    if (!element) {
      return;
    }
    await changeOpenedFile(element.file.toString());
    if (element.hasPendingChanges) {
      await replaceHighlightedCodeOnEditor(
        element.changes,
        element.changeID,
        element.file.toString()
      );
      webview.codeArray = codeHistory.getCodeHistory();
      checkForUserInputOnEditor(webview, changeID, webview.codeArray);
    }
  } else {
    for (let i = response.code.length - 1; i >= 0; i--) {
      let element = response.code[i];
      let filepath = element.file.toString();
      await insertSnippetsOnEditor(element.changes, element.changeID, filepath);
      webview.codeArray = codeHistory.getCodeHistory();
      if (element === response.code[0]) {
        // vscode.workspace.onDidChangeTextDocument(() => {
        //   let openedChat = chatHistory.getOpenedChat();
        //   if (!openedChat || openedChat.length === 0) {
        //     return;
        //   }

        //   let lastMessage = openedChat[openedChat.length - 1];
        //   let llmResponse = lastMessage.llmResponse as unknown as {
        //     code: any[];
        //   };
        //   if (llmResponse.code[0].hasPendingChanges) {
        //     chatHistory.handleChanges(changeID, true);
        //     chatService.changeChat(webview);
        //   }
        // });
        checkForUserInputOnEditor(webview, element.changeID, webview.codeArray);
      }
    }
  }
}
