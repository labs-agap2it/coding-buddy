import OpenAI from "openai";
import * as editorUtils from "../editor/userEditor";
import * as chatHistory from "../tempManagement/chatHistory";
import { Message } from "../model/chatModel";
import { codeExamples, jsonFormat, rulesets } from "./directives";

export async function buildMessages(userMessage:string):Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
    let userCode = editorUtils.getUserCode();
    let messages:OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: rulesets
        }
    ];

    messages.push(
        {
            role: "system",
            content: jsonFormat
        },
        {
            role: "system",
            content: codeExamples
        }
    );



    let messageHistory = buildHistoryArray();
    if(messageHistory.length > 0){
        for(let i = 0; i < messageHistory.length; i++){
            messages.push(messageHistory[i]);
        }
    }
    

    messages.push(
        {
            role: "system",
            content: userCode
        },
        {
            role: "user",
            content: userMessage
        }
    );

    return messages;
}

function buildHistoryArray():OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    let openedChat:Message[] | undefined = chatHistory.getOpenedChat();
    if(!openedChat || openedChat.length === 0) {
        return [];
    }

    let messageHistory:OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    for(let i = 0; i<openedChat.length; i++){
        messageHistory.push({
            role: "user",
            content: openedChat[i].userMessage
        },
        {
            role: "assistant",
            content: JSON.stringify(openedChat[i].llmResponse)
        }
    );
    }

    return messageHistory;
}