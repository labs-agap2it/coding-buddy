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
        //TODO evitar magic strings, colocar no início do ficheiro
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
function verifyIntent(llmResponse:any):string{ //TODO renomear para algo que explique melhor o seu objetivo ou propósito
    let intent = llmResponse.intent;
    if(intent === "generate" || intent === "fix"){
        let code = llmResponse.code;
        for(let i = 0; i < code.length; i++){
            code[i].hasPendingChanges = true;
            code[i].wasAccepted = false;
        }

        let response = llmResponse;
        response.code = code;
        return JSON.stringify(response);
    }
    return JSON.stringify(llmResponse); // TODO evitar devolver em string tendo em conta que fazes parse logo a seguir a teres chamado
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
    chatJSON.chats[openedChat].messages.push({userMessage: user, llmResponse: JSON.parse(verifyIntent(llm))});
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

//TODO considerar separar funções de plumbing de mensagens para disco e disco para mensagens de outras funções com lógica de negócio
export function handleChanges(changeID: any, accepted: boolean) {
    let chatJSON:ChatData = getChatFile();
    let openedChat = chatJSON.openedChat;
    let chat = chatJSON.chats[openedChat];
    let messages = chat.messages;
    let message = messages[messages.length - 1];
    let response = message.llmResponse as unknown as { code: any[], hasPendingChanges?: boolean }; // Update the type of response
    let codeItems = response.code;
    for(let i = 0; i < codeItems.length; i++){
        if(codeItems[i].changeID === changeID){
            let change = codeItems[i];
            change.hasPendingChanges = false;
            change.wasAccepted = accepted;
            change.changeID = "";
            codeItems[i] = change;
        }
    }
    message.llmResponse = response as unknown as string;
    messages[messages.length - 1] = message;
    chat.messages = messages;
    chatJSON.chats[openedChat] = chat;
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(chatJSON));

}

