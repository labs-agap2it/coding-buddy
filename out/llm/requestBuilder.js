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
exports.buildMessages = void 0;
const editorUtils = __importStar(require("../editor/userEditor"));
const chatHistory = __importStar(require("../tempManagement/chatHistory"));
const directives_1 = require("./directives");
async function buildMessages(userMessage, additionalInfo) {
    let userCode = editorUtils.getUserCode();
    let messages = [
        {
            role: "system",
            content: directives_1.rulesets
        }
    ];
    messages.push({
        role: "system",
        content: directives_1.jsonFormat
    }, {
        role: "system",
        content: directives_1.codeExamples
    });
    if (additionalInfo) {
        for (let i = 0; i < additionalInfo.length; i++) {
            messages.push({
                role: "system",
                content: additionalInfo[i]
            });
        }
    }
    let messageHistory = buildHistoryArray();
    if (messageHistory.length > 0) {
        for (let i = 0; i < messageHistory.length; i++) {
            messages.push(messageHistory[i]);
        }
    }
    messages.push({
        role: "system",
        content: userCode
    }, {
        role: "user",
        content: userMessage
    });
    return messages;
}
exports.buildMessages = buildMessages;
function buildHistoryArray() {
    let openedChat = chatHistory.getOpenedChat();
    if (!openedChat || openedChat.length === 0) {
        return [];
    }
    let messageHistory = [];
    for (let i = 0; i < openedChat.length; i++) {
        messageHistory.push({
            role: "user",
            content: openedChat[i].userMessage
        }, {
            role: "assistant",
            content: JSON.stringify(openedChat[i].llmResponse)
        });
    }
    return messageHistory;
}
//# sourceMappingURL=requestBuilder.js.map