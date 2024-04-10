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
const codingBuddyChat_1 = require("./extension/codingBuddyChat");
const settingEditor_1 = require("./extension/settingEditor");
function activate(context) {
    const provider = new codingBuddyChat_1.CodingBuddyViewProvider(context.extensionUri);
    const codingBuddyWebviewProvider = vscode.window.registerWebviewViewProvider(codingBuddyChat_1.CodingBuddyViewProvider.viewType, provider);
    const settingEditor = vscode.commands.registerCommand('coding-buddy.setDefaults', async () => (0, settingEditor_1.addUserDefaults)());
    context.subscriptions.push(codingBuddyWebviewProvider, settingEditor);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map