import OpenAI from 'openai';
import * as savedSettings from '../settings/savedSettings';
import * as editorUtils from '../utils/editorUtils';
import * as vscode from 'vscode';
import * as chatHistory from '../chat/chatHistory';
import { codeExamples, rulesets, jsonFormat } from "./directives";

const openai = new OpenAI();

export async function getLLMJson(message:string){
    let apiKey = savedSettings.getAPIKey();
    if(!apiKey || apiKey === undefined ){ return; }
    openai.apiKey = apiKey;
    let messageHistory = JSON.stringify(chatHistory.getOpenedChat());
    console.log(messageHistory);
    const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        response_format:{"type":"json_object"},
        messages: [
            {
                role: "system",
                content: rulesets //Coding Buddy's Directives
            },
            {
                role: "system",
                content: jsonFormat //Coding Buddy's Response Format
            },
            {
                role: "system",
                content: codeExamples //Respose examples fed into Coding Buddy
            },
            {
                role: "system",
                content: "Message History: " + messageHistory //Last messages exchanged between the user and Coding Buddy. The amount is to be set by the user.
            },
            {
                role: "system",
                content:editorUtils.getUserCode() //User's code
            },
            {
                role: "user",
                content:message //The user's request
            }
        ]
    });
    if(!completion.choices[0].message.content){ return;}
    let response = JSON.parse(completion.choices[0].message.content);

    chatHistory.saveChat(message, response);
    return response;
}

export async function testAPIKey(apiKey: string){

    openai.apiKey = apiKey;
    let isValid = false;
    try{
        let response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages:[
                {
                    role: "system",
                    content: "test, return true."
                }
            ]
        });

        if(response.choices[0].message.content){
            isValid = true;
        }
    }catch(e){
        vscode.window.showErrorMessage("Invalid API Key\n" + e);
        isValid = false;
    }
    return isValid;
}