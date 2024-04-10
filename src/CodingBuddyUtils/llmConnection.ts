import OpenAI from 'openai';
import * as assets from '../utils/configUtils';
import * as editorUtils from '../utils/editorUtils';
import { codeExamples, rulesets, jsonFormat } from "./codingBuddyDirectives";

const openai = new OpenAI();

export async function getLLMJson(message:string){
    openai.apiKey = assets.getUserToken();
    if(!openai.apiKey){ return; }
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
                content: "Message History: " + assets.getMessageHistory() //Last messages exchanged between the user and Coding Buddy. The amount is to be set by the user.
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

    assets.saveMessageHistory(response, message);
    return response;
}