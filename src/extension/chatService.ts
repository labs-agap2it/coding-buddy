import * as vscode from 'vscode';
import * as chatHistory from '../tempManagement/chatHistory';
import * as webview from '../extension/webviewChat';

export function openNewChat(webview:webview.CodingBuddyViewProvider){
    chatHistory.createNewChat();
    webview.clearChat();
}

export function changeChat(webview:webview.CodingBuddyViewProvider){
    let chatList = getChatListAsQuickPickItems();

    vscode.window.showQuickPick(chatList).then((chat) => {
        if(chat){
            chatHistory.changeChat(chatList.indexOf(chat));
            webview.changeChat();
        }
    });
}

export function deleteChat(webview:webview.CodingBuddyViewProvider){
    webview.toggleChatDeletion();
}

function getChatListAsQuickPickItems():vscode.QuickPickItem[]{
    let chatList = chatHistory.getChatList();
    let chatListItems:vscode.QuickPickItem[] = [];
    chatList.forEach((chat) => {
        chatListItems.push({label: chat.title});
    });

    return chatListItems;
}

export function editChatName(webview: webview.CodingBuddyViewProvider) {
    webview.editChatName();
}
