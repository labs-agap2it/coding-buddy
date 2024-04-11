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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const webviewChat_1 = require("./extension/webviewChat");
const chatService = __importStar(require("./extension/chatService"));
function activate(context) {
    const provider = new webviewChat_1.CodingBuddyViewProvider(context.extensionUri);
    const codingBuddyWebviewProvider = vscode.window.registerWebviewViewProvider(webviewChat_1.CodingBuddyViewProvider.viewType, provider);
    const newChatWebview = vscode.commands.registerCommand('coding-buddy.newChat', async () => {
        chatService.openNewChat(provider);
    });
    const deleteChatWebview = vscode.commands.registerCommand('coding-buddy.deleteChat', async () => {
        chatService.deleteChat(provider);
    });
    const changeChatWebview = vscode.commands.registerCommand('coding-buddy.changeChat', async () => {
        chatService.changeChat(provider);
    });
    const openSettings = vscode.commands.registerCommand('coding-buddy.goToSettings', async () => vscode.commands.executeCommand('workbench.action.openSettings', 'coding-buddy'));
    context.subscriptions.push(codingBuddyWebviewProvider, openSettings);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map