import * as vscode from "vscode";
import * as crypto from "crypto";
import { ignoredDirectories, ignoredFiles } from "../ignoreDB/ignoreDB";
import hashDatabase from "../db/hashDatabase";
import vectraIndex from "../db/vectra";

export function getProjectId(): string {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return "unknown_project";
  }

  const rootPath = workspaceFolders[0].uri.fsPath;
  return crypto.createHash("sha256").update(rootPath).digest("hex");
}

async function readProjectFiles(): Promise<vscode.Uri[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return [];
  }

  const rootUri = workspaceFolders[0].uri;
  return getFilesRecursively(rootUri);
}

async function getFilesRecursively(dirUri: vscode.Uri): Promise<vscode.Uri[]> {
  let results: vscode.Uri[] = [];
  const entries = await vscode.workspace.fs.readDirectory(dirUri);

  for (const entry of entries) {
    const fileName = entry[0];
    const fileType = entry[1];
    const fileUri = vscode.Uri.joinPath(dirUri, fileName);

    if (fileType === vscode.FileType.Directory) {
      if (!ignoredDirectories.includes(fileName)) {
        results = results.concat(await getFilesRecursively(fileUri));
      }
    } else {
      if (isIgnoredFile(fileName)) {
        continue;
      }
      results.push(fileUri);
    }
  }
  return results;
}
export async function generateProjectSnapshot(): Promise<{
  newFiles: Map<string, any>;
  modifiedFiles: Map<string, any>;
  unchangedFiles: Map<string, any>;
  deletedFiles: Map<string, any>;
}> {
  const projectId = getProjectId();

  const oldSnapshot = await hashDatabase.all(
    `SELECT file_path, hash FROM file_hashes WHERE project_id = ?`,
    [projectId]
  );

  const oldSnapshotMap = new Map<string, string>();
  oldSnapshot.forEach((row) => {
    oldSnapshotMap.set(row.file_path, row.hash);
  });

  const newFiles = new Map<string, any>();
  const modifiedFiles = new Map<string, any>();
  const unchangedFiles = new Map<string, any>();
  const deletedFiles = new Map<string, any>();

  const files = await readProjectFiles();

  for (const fileUri of files) {
    const filePath = fileUri.fsPath;
    const hash = await generateFileHash(fileUri);

    if (!oldSnapshotMap.has(filePath)) {
      newFiles.set(filePath, { projectId, hash });
      oldSnapshotMap.delete(filePath);
    } else if (oldSnapshotMap.get(filePath) !== hash) {
      modifiedFiles.set(filePath, { projectId, hash });
      oldSnapshotMap.delete(filePath);
    } else {
      unchangedFiles.set(filePath, { projectId, hash });
      oldSnapshotMap.delete(filePath);
    }
  }
  oldSnapshotMap.forEach((hash, filePath) => {
    deletedFiles.set(filePath, { projectId, hash });
  });

  console.log("New files:", newFiles.size);
  console.log("Files modified:", modifiedFiles.size);
  console.log("Files unchanged:", unchangedFiles.size);
  console.log("Files deleted:", deletedFiles.size);

  return { newFiles, modifiedFiles, unchangedFiles, deletedFiles };
}

export async function generateFileHash(fileUri: vscode.Uri): Promise<string> {
  const content = await vscode.workspace.fs.readFile(fileUri);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function isIgnoredFile(fileName: string): boolean {
  return ignoredFiles.some((pattern) => {
    if (pattern.startsWith("*.")) {
      return fileName.endsWith(pattern.slice(1));
    }
    return fileName === pattern;
  });
}

export async function initializeHashDatabase() {
  const snapshots = await generateProjectSnapshot();

  if (snapshots.newFiles.size > 0) {
    await handleNewFiles();
    const newFiles = Array.from(snapshots.newFiles.entries());
    await Promise.all(
      newFiles.map(async ([filePath, value]) => {
        const insertQuery = `
        INSERT INTO file_hashes (file_path, project_id, hash)
        VALUES (?, ?, ?)
      `;
        hashDatabase.run(insertQuery, [filePath, value.projectId, value.hash]);
      })
    );

    const newFilePaths = newFiles.map(([filePath]) => filePath);
    await vectraIndex.prepareFilesForIndexing(newFilePaths);
  }

  if (snapshots.modifiedFiles.size > 0) {
    const modifiedFiles = Array.from(snapshots.modifiedFiles.entries());
    await Promise.all(
      modifiedFiles.map(async ([filePath, value]) => {
        const updateQuery = `
        UPDATE file_hashes
        SET hash = ?
        WHERE file_path = ?
      `;
        hashDatabase.run(updateQuery, [value.hash, filePath]);
        await vectraIndex.deleteItemByPath(filePath);
      })
    );

    const modifiedFilePaths = modifiedFiles.map(([filePath]) => filePath);
    await vectraIndex.prepareFilesForIndexing(modifiedFilePaths);
  }

  if (snapshots.deletedFiles.size > 0) {
    await Promise.all(
      Array.from(snapshots.deletedFiles).map(async ([filePath]) => {
        const deleteQuery = `
        DELETE FROM file_hashes
        WHERE file_path = ?
      `;
        hashDatabase.run(deleteQuery, [filePath]);
        await vectraIndex.deleteItemByPath(filePath);
      })
    );
  }
}

async function handleNewFiles() {}

export async function onSaveTextDocumentEvent(event: vscode.TextDocument) {
  console.log("File saved event triggered:", event.uri.fsPath);
  const hash = await generateFileHash(event.uri);
  const checkQuery = `
    SELECT * FROM file_hashes WHERE file_path = ?
  `;
  const doesfileExist = await hashDatabase.get(checkQuery, [event.uri.fsPath]);
  if (doesfileExist) {
    const updateQuery = `
    UPDATE file_hashes
    SET hash = ?
    WHERE file_path = ?
  `;
    hashDatabase.run(updateQuery, [hash, event.uri.fsPath]);
  } else {
    const insertQuery = `
    INSERT INTO file_hashes (file_path, project_id, hash)
    VALUES (?, ?, ?)
  `;
    hashDatabase.run(insertQuery, [event.uri.fsPath, getProjectId(), hash]);
  }

  await vectraIndex.updateItemByPath(event.uri.fsPath);
}

export async function onDeleteTextDocumentEvent(event: vscode.FileDeleteEvent) {
  console.log("File deleted event triggered:", event.files[0].fsPath);
  const deleteQuery = `
          DELETE FROM file_hashes
          WHERE file_path = ?
        `;

  await Promise.all(
    event.files.map(async (file) => {
      hashDatabase.run(deleteQuery, [file.fsPath]);
      await vectraIndex.deleteItemByPath(file.fsPath);
    })
  );
}

export async function onRenameTextDocumentEvent(event: vscode.FileRenameEvent) {
  console.log("File renamed event triggered:", event.files);
  const updateQuery = `
          UPDATE file_hashes
          SET file_path = ?
          WHERE file_path = ?
        `;

  for (const file of event.files) {
    hashDatabase.run(updateQuery, [file.newUri.fsPath, file.oldUri.fsPath]);
    await vectraIndex.prepareFilesForIndexing([file.newUri.fsPath]);
    await vectraIndex.deleteItemByPath(file.oldUri.fsPath);
  }
}
