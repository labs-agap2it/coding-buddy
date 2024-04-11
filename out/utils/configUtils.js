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
exports.setUserSettings = exports.getUserSettings = exports.setUserToken = exports.getUserToken = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
function getUserToken() {
    let token = "";
    let tokenPath = os.tmpdir() + "\\CodingBuddy\\token.json";
    if (fs.existsSync(tokenPath)) {
        token = JSON.parse(fs.readFileSync(tokenPath, 'utf8')).token;
    }
    return token;
}
exports.getUserToken = getUserToken;
function setUserToken(token) {
    let tokenPath = os.tmpdir() + "\\CodingBuddy\\token.json";
    let tokenJson = JSON.stringify({ "token": token });
    fs.writeFileSync(tokenPath, tokenJson);
}
exports.setUserToken = setUserToken;
function getUserSettings() {
    let settings = "";
    let settingsPath = os.tmpdir() + "\\CodingBuddy\\config.json";
    if (fs.existsSync(settingsPath)) {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')).maxChatNumber;
    }
    return settings;
}
exports.getUserSettings = getUserSettings;
function setUserSettings(maxChatNumber) {
    let settingsPath = os.tmpdir() + "\\CodingBuddy\\config.json";
    let settings = JSON.stringify({
        "maxChatNumber": maxChatNumber
    });
    fs.writeFileSync(settingsPath, settings);
}
exports.setUserSettings = setUserSettings;
//# sourceMappingURL=configUtils.js.map