import { OpenAI } from 'openai';
import * as vscode from 'vscode';

const openai = new OpenAI();

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