"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmStatusEnum = void 0;
var llmStatusEnum;
(function (llmStatusEnum) {
    llmStatusEnum[llmStatusEnum["success"] = 0] = "success";
    llmStatusEnum[llmStatusEnum["error"] = 1] = "error";
    llmStatusEnum[llmStatusEnum["noApiKey"] = 2] = "noApiKey";
    llmStatusEnum[llmStatusEnum["noResponse"] = 3] = "noResponse";
})(llmStatusEnum || (exports.llmStatusEnum = llmStatusEnum = {}));
//# sourceMappingURL=llmResponse.js.map