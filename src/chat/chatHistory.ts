import * as fs from 'fs';
import * as os from 'os';
import * as savedSettings from '../settings/savedSettings';

interface ChatData{
    openedChat: number,
    chats: Chat[]
}

interface Chat{
    title: string,
    messages: Message[]
}

interface Message{
    userMessage: string,
    llmResponse: string
}

function getChatFile():ChatData{
    let chatJSON:ChatData;
    try{
        chatJSON = JSON.parse(fs.readFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json').toString());
    }catch(e){
        chatJSON = createChatFile();  
    }

    return chatJSON;
}

function createChatFile(){
    let chatJSON:ChatData = {
        openedChat: 0,
        chats: []
    };
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
    return chatJSON;
}

export function getChatIndex():number{
    let chatJSON:ChatData = getChatFile();
    return chatJSON.openedChat;
}

export function deleteChat(){
    let chatJSON:ChatData = getChatFile();
    if(chatJSON.chats.length <= 1){
        chatJSON.chats = [];
        chatJSON.openedChat = 0;
        fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
        return;
    }

    chatJSON.chats.splice(chatJSON.openedChat, 1);
    chatJSON.openedChat = chatJSON.chats.length - 1;

    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));

}

export function getOpenedChat():Message[] | undefined{
    let chatJSON:ChatData = getChatFile();
    if(chatJSON.chats[chatJSON.openedChat] === undefined){ return undefined; }
    console.log(chatJSON.chats[chatJSON.openedChat].messages);
    return chatJSON.chats[chatJSON.openedChat].messages;
}

export function getChatList():Chat[]{
    let chatJSON:ChatData = getChatFile();
    return chatJSON.chats;
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

    chatJSON.chats[openedChat].messages.push({userMessage: user, llmResponse: llm});
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
}


export function createNewChat():Chat{
    let chatJSON:ChatData = getChatFile();
    chatJSON.openedChat = chatJSON.chats.length;
    chatJSON.chats.push({title: "Chat " + (chatJSON.chats.length+1), messages: []});
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
    return chatJSON.chats[chatJSON.openedChat];
}

export function changeChat(chatIndex:number):Chat{
    let chatJSON:ChatData = getChatFile();
    chatJSON.openedChat = chatIndex;
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));
    return chatJSON.chats[chatIndex];
}