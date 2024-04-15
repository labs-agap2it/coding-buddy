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
exports.getAPIKey = void 0;
const vscode = __importStar(require("vscode"));
function getAPIKey() {
    let apiKey = vscode.workspace.getConfiguration().get("coding-buddy.apiKey");
    if (apiKey === "" || apiKey === undefined) {
        vscode.window.showErrorMessage("No API Key provided. Do you want to open the settings page to provide an API Key?", "Yes", "No").then((value) => {
            if (value === "Yes") {
                vscode.commands.executeCommand("workbench.action.openSettings", "coding-buddy.apiKey");
            }
        });
    }
    return apiKey; //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
}
exports.getAPIKey = getAPIKey;
//# sourceMappingURL=savedData.js.map