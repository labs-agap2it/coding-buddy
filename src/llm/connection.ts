import OpenAI from 'openai';
import * as savedSettings from '../settings/savedSettings';
import * as vscode from 'vscode';
import {v4 as uuid} from 'uuid';
import { buildMessages } from "./requestBuilder";
import { llmMessage, llmResponse, llmStatusEnum } from '../model/llmResponse';

let openai:OpenAI | undefined = undefined;

export async function getLLMJson(message:string, additionalInfo?:string[]):Promise<llmMessage>{
    let apiKey = savedSettings.getAPIKey();
    let userModel = savedSettings.getModel();
    if(!apiKey || apiKey === undefined ){ return {status: llmStatusEnum.noApiKey}; }
    openai = new OpenAI({apiKey});
    let llmMessages = await buildMessages(message, additionalInfo);
    let completion;
    let response;
    try{
        completion = await openai.chat.completions.create({
            model: userModel,
            response_format:{
                "type":"json_object"
            },
            top_p:0.4,
            messages: llmMessages
        });
        if(!completion.choices[0].message.content){ return {status: llmStatusEnum.noResponse};}
        response = JSON.parse(completion.choices[0].message.content);
    }catch(e){
        vscode.window.showErrorMessage("Error! " + e);
        return{status: llmStatusEnum.error};
    }
    for (let i = 0; i < response.code.length; i++) {
        response.code[i].changeID = generateChangeID();
        response.code[i].hasPendingChanges = true;
        response.code[i].wasAccepted = false;
    }
    return { status: llmStatusEnum.success, content:response };
}

function generateChangeID(){
    let changeID = uuid();
    return changeID;
}

export async function testAPIKey(apiKey: string){
    if(apiKey === "" || apiKey === undefined){
        return;
    }
    openai = new OpenAI({apiKey});
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