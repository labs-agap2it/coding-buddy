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
exports.changeChat = exports.createNewChat = exports.saveChat = exports.getChatList = exports.getOpenedChat = exports.deleteChat = exports.getChatIndex = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const savedSettings = __importStar(require("../settings/savedSettings"));
function getChatFile() {
    let chatJSON;
    try {
        chatJSON = JSON.parse(fs.readFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json').toString());
    }
    catch (e) {
        chatJSON = createChatFile();
    }
    return chatJSON;
}
function createChatFile() {
    let chatJSON = {
        openedChat: 0,
        chats: []
    };
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
    return chatJSON;
}
function getChatIndex() {
    let chatJSON = getChatFile();
    return chatJSON.openedChat;
}
exports.getChatIndex = getChatIndex;
function deleteChat() {
    let chatJSON = getChatFile();
    if (chatJSON.chats.length <= 1) {
        chatJSON.chats = [];
        chatJSON.openedChat = 0;
        fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
        return;
    }
    chatJSON.chats.splice(chatJSON.openedChat, 1);
    chatJSON.openedChat = chatJSON.chats.length - 1;
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
}
exports.deleteChat = deleteChat;
function getOpenedChat() {
    let chatJSON = getChatFile();
    if (chatJSON.chats[chatJSON.openedChat] === undefined) {
        return undefined;
    }
    console.log(chatJSON.chats[chatJSON.openedChat].messages);
    return chatJSON.chats[chatJSON.openedChat].messages;
}
exports.getOpenedChat = getOpenedChat;
function getChatList() {
    let chatJSON = getChatFile();
    return chatJSON.chats;
}
exports.getChatList = getChatList;
function saveChat(user, llm) {
    let chatJSON = getChatFile();
    let openedChat = chatJSON.openedChat;
    if (chatJSON.chats[openedChat] === undefined) {
        chatJSON.chats[openedChat] = { title: "Chat " + openedChat + 1, messages: [] };
    }
    if (chatJSON.chats[openedChat].messages.length >= savedSettings.getMaxSavedMessages()) {
        chatJSON.chats[openedChat].messages.shift();
    }
    chatJSON.chats[openedChat].messages.push({ userMessage: user, llmResponse: llm });
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
}
exports.saveChat = saveChat;
function createNewChat() {
    let chatJSON = getChatFile();
    chatJSON.openedChat = chatJSON.chats.length;
    chatJSON.chats.push({ title: "Chat " + (chatJSON.chats.length + 1), messages: [] });
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
    return chatJSON.chats[chatJSON.openedChat];
}
exports.createNewChat = createNewChat;
function changeChat(chatIndex) {
    let chatJSON = getChatFile();
    chatJSON.openedChat = chatIndex;
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
    return chatJSON.chats[chatIndex];
}
exports.changeChat = changeChat;
//# sourceMappingURL=chatHistory.js.map