export interface ContentOfFile {
  projectId: string;
  content: string;
  path: string;
}
export interface DbItem extends ContentOfFile {
  embedding: number[];
}
export type LanguageMap = {
  [key: string]: any;
};
export type QueryMap = {
  [key: string]: any;
};
