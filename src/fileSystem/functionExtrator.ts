import * as path from "path";
import Parser from "tree-sitter";

// Load language grammars
import Python from "tree-sitter-python";
import JavaScript from "tree-sitter-javascript";
import Java from "tree-sitter-java";
import Cpp from "tree-sitter-cpp";
import CSharp from "tree-sitter-c-sharp";
import type { ContentOfFile, LanguageMap, QueryMap } from "../types/types";

// Map file extensions to languages

const languageMap: LanguageMap = {
  py: Python,
  js: JavaScript,
  ts: JavaScript,
  java: Java,
  cpp: Cpp,
  cs: CSharp,
};

// Map languages to their function query patterns
const queryMap: QueryMap = {
  py: "(function_definition) @function",
  js: `
        (function_declaration) @function
        (variable_declarator 
            value: [(function_expression) (arrow_function)]) @function
        (method_definition) @function
        (pair 
            key: (property_identifier) @method-name 
            value: [(function_expression) (arrow_function)]) @function
    `,
  ts: `
        (function_declaration) @function
        (variable_declarator 
            value: [(function_expression) (arrow_function)]) @function
        (method_definition) @function
        (pair 
            key: (property_identifier) @method-name 
            value: [(function_expression) (arrow_function)]) @function
    `,
  java: "(method_declaration) @function",
  cpp: "(function_definition) @function",
  cs: "(method_declaration) @function",
};

export function extractFunctionsFromFile(file: ContentOfFile) {
  try {
    const extension = path.extname(file.path).slice(1).toLowerCase();
    const language = languageMap[extension];
    const queryString = queryMap[extension];

    if (!language || !queryString) {
      throw new Error(`Unsupported file extension: .${extension}`);
    }

    const parser = new Parser();
    parser.setLanguage(language);

    const tree = parser.parse(file.content);

    const Query = Parser.Query;
    const query = new Query(language, queryString);
    const matches = query.matches(tree.rootNode);

    const functions = matches.map((match) => {
      const node = match.captures[0]!.node;
      const start = node.startIndex;
      const end = node.endIndex;
      return file.content.slice(start, end).trim();
    });

    return functions;
  } catch (error: any) {
    console.error(`Error processing ${file.path}:`, error.message);
    return [];
  }
}
