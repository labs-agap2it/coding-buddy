import OpenAI from 'openai';
import * as savedSettings from '../settings/savedSettings';
import * as editorUtils from '../editor/userEditor';
import * as vscode from 'vscode';
import * as chatHistory from '../tempManagement/chatHistory';
import { codeExamples, rulesets, jsonFormat } from "./directives";

const openai = new OpenAI();

export async function getLLMJson(message:string){
    let apiKey = savedSettings.getAPIKey();
    let userModel = savedSettings.getModel();
    if(!apiKey || apiKey === undefined ){ return; } //TODO talvez fosse melhor devolveres uma estruturazinha, do tipo { status:"success/error", content:<conteúdo> }
    openai.apiKey = apiKey;
    let messageHistory = JSON.stringify(chatHistory.getOpenedChat());
    //TODO em vez de passar o objeto logo, chamar uma função que o constroi devidamente, e retorna como parâmetro
    const completion = await openai.chat.completions.create({
        model: userModel,
        response_format:{
            "type":"json_object"
        },
        top_p:0.4,
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
            //TODO: em vez da estrutura infra, deves inserir aqui uma lista de jsons (não me string) onde cada estrutura tem o formato { role:"user", content:<conteúdo> }, {role:"assistant", content:<conteúdo>}
            {
                role: "system",
                content: 
                `##HISTORY START
                ${messageHistory}
                ##HISTORY END
                ` //Last messages exchanged between the user and Coding Buddy. The amount is to be set by the user.
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
    if(!completion.choices[0].message.content){ return;} //TODO talvez fosse melhor devolveres uma estruturazinha, do tipo { status:"success/error", content:<conteúdo> }
    let response = JSON.parse(completion.choices[0].message.content);
    response.code.forEach((element:any) => {
        element.changeID = Math.random().toString(36).substring(7); // TODO refatorizar para uma funçãozinha
    });
    chatHistory.saveChat(message, response); //TODO isto não devia estar aqui mas numa camada acima
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