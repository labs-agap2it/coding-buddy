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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAPIKey = exports.getLLMJson = void 0;
const openai_1 = __importDefault(require("openai"));
const savedSettings = __importStar(require("../settings/savedSettings"));
const editorUtils = __importStar(require("../editor/userEditor"));
const vscode = __importStar(require("vscode"));
const chatHistory = __importStar(require("../tempManagement/chatHistory"));
const directives_1 = require("./directives");
const openai = new openai_1.default();
async function getLLMJson(message) {
    let apiKey = savedSettings.getAPIKey();
    let userModel = savedSettings.getModel();
    if (!apiKey || apiKey === undefined) {
        return;
    } //TODO talvez fosse melhor devolveres uma estruturazinha, do tipo { status:"success/error", content:<conteúdo> }
    openai.apiKey = apiKey;
    let messageHistory = JSON.stringify(chatHistory.getOpenedChat());
    //TODO em vez de passar o objeto logo, chamar uma função que o constroi devidamente, e retorna como parâmetro
    const completion = await openai.chat.completions.create({
        model: userModel,
        response_format: {
            "type": "json_object"
        },
        top_p: 0.4,
        messages: [
            {
                role: "system",
                content: directives_1.rulesets //Coding Buddy's Directives
            },
            {
                role: "system",
                content: directives_1.jsonFormat //Coding Buddy's Response Format
            },
            {
                role: "system",
                content: directives_1.codeExamples //Respose examples fed into Coding Buddy
            },
            //TODO: em vez da estrutura infra, deves inserir aqui uma lista de jsons (não me string) onde cada estrutura tem o formato { role:"user", content:<conteúdo> }, {role:"assistant", content:<conteúdo>}
            {
                role: "system",
                content: `##HISTORY START
                ${messageHistory}
                ##HISTORY END
                ` //Last messages exchanged between the user and Coding Buddy. The amount is to be set by the user.
            },
            {
                role: "system",
                content: editorUtils.getUserCode() //User's code
            },
            {
                role: "user",
                content: message //The user's request
            }
        ]
    });
    if (!completion.choices[0].message.content) {
        return;
    } //TODO talvez fosse melhor devolveres uma estruturazinha, do tipo { status:"success/error", content:<conteúdo> }
    let response = JSON.parse(completion.choices[0].message.content);
    response.code.forEach((element) => {
        element.changeID = Math.random().toString(36).substring(7); // TODO refatorizar para uma funçãozinha
    });
    chatHistory.saveChat(message, response); //TODO isto não devia estar aqui mas numa camada acima
    return response;
}
exports.getLLMJson = getLLMJson;
async function testAPIKey(apiKey) {
    openai.apiKey = apiKey;
    let isValid = false;
    try {
        let response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "test, return true."
                }
            ]
        });
        if (response.choices[0].message.content) {
            isValid = true;
        }
    }
    catch (e) {
        vscode.window.showErrorMessage("Invalid API Key\n" + e);
        isValid = false;
    }
    return isValid;
}
exports.testAPIKey = testAPIKey;
//# sourceMappingURL=connection.js.map