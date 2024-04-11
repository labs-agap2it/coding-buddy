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
exports.deleteChat = exports.changeChat = exports.openNewChat = void 0;
const vscode = __importStar(require("vscode"));
const chatHistory = __importStar(require("../chat/chatHistory"));
function openNewChat(webview) {
    chatHistory.createNewChat();
    webview.clearChat();
}
exports.openNewChat = openNewChat;
function changeChat(webview) {
    let chatList = getChatListAsQuickPickItems();
    vscode.window.showQuickPick(chatList).then((chat) => {
        if (chat) {
            chatHistory.changeChat(chatList.indexOf(chat));
            webview.changeChat();
        }
    });
}
exports.changeChat = changeChat;
function deleteChat(webview) {
    let openedChat = chatHistory.getChatList();
    vscode.window.showInformationMessage("Delete " + openedChat[chatHistory.getChatIndex()].title + "?", "Yes", "No").then((value) => {
        if (value === "Yes") {
            chatHistory.deleteChat();
            webview.changeChat();
        }
    });
}
exports.deleteChat = deleteChat;
function getChatListAsQuickPickItems() {
    let chatList = chatHistory.getChatList();
    let chatListItems = [];
    chatList.forEach((chat) => {
        chatListItems.push({ label: chat.title });
    });
    return chatListItems;
}
//# sourceMappingURL=chatService.js.map