import { llmResponse} from './llmResponse';
export interface ChatData{
    openedChat: number,
    chats: Chat[]
}

export interface Chat{
    title: string,
    messages: Message[]
}

export interface Message{
    userMessage: string,
    llmResponse: llmResponse
}