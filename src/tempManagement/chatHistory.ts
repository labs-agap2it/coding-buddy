import * as fs from 'fs';
import * as os from 'os';
import * as savedSettings from '../settings/savedSettings';
import { Chat, ChatData, Message } from '../model/chatModel';
import { llmResponse } from '../model/llmResponse';


let chatFilePath = os.tmpdir() + '\\CodingBuddy\\chatHistory.json';

function getChatFile():ChatData{
    let chatJSON:ChatData;
    try{
        chatJSON = JSON.parse(fs.readFileSync(chatFilePath).toString());
    }catch(e){
        chatJSON = createChatFile();  
    }

    return chatJSON;
}

export function deleteChat(){
    let chatJSON:ChatData = getChatFile();
    if(chatJSON.chats.length <= 1){
        chatJSON.chats = [];
        chatJSON.openedChat = 0;
        fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));
        return;
    }

    chatJSON.chats.splice(chatJSON.openedChat, 1);
    chatJSON.openedChat = chatJSON.chats.length - 1;

    fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));

}

export function saveChat(user:string, llm:string){
    let chatJSON:ChatData = getChatFile();
    let openedChat = chatJSON.openedChat;

    if(chatJSON.chats[openedChat] === undefined){
        chatJSON.chats[openedChat] = {title: "Chat " + openedChat + 1, messages: []};
    }

    if(chatJSON.chats[openedChat].messages.length >= savedSettings.getMaxSavedMessages()){
        chatJSON.chats[openedChat].messages.shift();
    }
    chatJSON.chats[openedChat].messages.push({userMessage: user, llmResponse: createModificationStateOnLlmMessage(llm)});
    fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));
}

export function getChatIndex():number{
    let chatJSON:ChatData = getChatFile();
    return chatJSON.openedChat;
}

export function getOpenedChat():Message[] | undefined{
    let chatJSON:ChatData = getChatFile();
    if(chatJSON.chats[chatJSON.openedChat] === undefined){ return undefined; }
    return chatJSON.chats[chatJSON.openedChat].messages;
}

export function getChatList():Chat[]{
    let chatJSON:ChatData = getChatFile();
    return chatJSON.chats;
}


export function createNewChat():Chat{
    let chatJSON:ChatData = getChatFile();
    chatJSON.openedChat = chatJSON.chats.length;
    chatJSON.chats.push({title: "Chat " + (chatJSON.chats.length+1), messages: []});
    fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));
    return chatJSON.chats[chatJSON.openedChat];
}

export function changeChat(chatIndex:number):Chat{
    let chatJSON:ChatData = getChatFile();
    chatJSON.openedChat = chatIndex;
    fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));
    return chatJSON.chats[chatIndex];
}

export function handleChanges(changeID: any, wasAccepted: boolean) {
    let llmCode = getOpenedChatCode();
    for(let i = 0; i < llmCode.length; i++){
        if(llmCode[i].changeID === changeID){
            llmCode[i].hasPendingChanges = false;
            llmCode[i].wasAccepted = wasAccepted;
            llmCode[i].changeID = "";
        }
    }
    modifyChatCode(llmCode);
}

function getOpenedChatCode(){
    let chatJSON:ChatData = getChatFile();
    return chatJSON.chats[chatJSON.openedChat].messages[chatJSON.chats[chatJSON.openedChat].messages.length - 1].llmResponse.code;
}

function modifyChatCode(llmCode:llmResponse["code"]){
    let chatJSON:ChatData = getChatFile();
    chatJSON.chats[chatJSON.openedChat].messages[chatJSON.chats[chatJSON.openedChat].messages.length - 1].llmResponse.code = llmCode;
    fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));
}


function createChatFile(){
    let chatJSON:ChatData = {
        openedChat: 0,
        chats: []
    };
    fs.writeFileSync(chatFilePath, JSON.stringify(chatJSON));
    return chatJSON;
}


function createModificationStateOnLlmMessage(llmResponse:any):llmResponse{
    let intent = llmResponse.intent;
    if(intent === "generate" || intent === "fix"){
        let code = llmResponse.code;
        for(let i = 0; i < code.length; i++){
            code[i].hasPendingChanges = true;
            code[i].wasAccepted = false;
        }

        let response = llmResponse;
        response.code = code;
        return response;
    }
    return llmResponse;
}