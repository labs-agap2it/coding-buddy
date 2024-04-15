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
exports.getLLMJson = void 0;
const openai_1 = __importDefault(require("openai"));
const assets = __importStar(require("../utils/configUtils"));
const editorUtils = __importStar(require("../utils/editorUtils"));
const llmDirectives_1 = require("./llmDirectives");
const openai = new openai_1.default();
async function getLLMJson(message) {
    openai.apiKey = assets.getUserToken();
    if (!openai.apiKey) {
        return;
    }
    const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        response_format: { "type": "json_object" },
        messages: [
            {
                role: "system",
                content: llmDirectives_1.rulesets //Coding Buddy's Directives
            },
            {
                role: "system",
                content: llmDirectives_1.jsonFormat //Coding Buddy's Response Format
            },
            {
                role: "system",
                content: llmDirectives_1.codeExamples //Respose examples fed into Coding Buddy
            },
            {
                role: "system",
                content: "Message History: " + assets.getMessageHistory() //Last messages exchanged between the user and Coding Buddy. The amount is to be set by the user.
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
    }
    let response = JSON.parse(completion.choices[0].message.content);
    assets.saveMessageHistory(response, message);
    return response;
}
exports.getLLMJson = getLLMJson;
//# sourceMappingURL=llmConnection.js.map