//displayable message handling
window.addEventListener('message', event =>{
    const message = event.data;
    switch(message.type){
        case 'display-message':
            addNewChatBox(message.value, false);
        break;
    }
});

function toggleLoader(){
    let loader = document.getElementById('message-loader');
    loader.classList.toggle('hidden');
}

function addNewChatBox(message, isUser){
    let chatBox = document.createElement('div');
    chatBox.className = 'message-chat-box';
    if(isUser){
        chatBox.classList.add('chat-user');
    }else{
        chatBox.classList.add('chat-bot');
    }
    let name = document.createElement('b');
    if(isUser){
        name.className = 'user-name';
    }else{
        name.className = 'bot-name';
    }
    name.innerHTML = isUser ? 'You' : 'Coding Buddy';
    let divider = document.createElement('div');
    divider.className = 'divider';
    let messageBox = document.createElement('p');
    messageBox.innerHTML = message;

    chatBox.appendChild(name);
    chatBox.appendChild(divider);
    chatBox.appendChild(messageBox);

    let container = document.getElementById('chat-container');
    container.appendChild(chatBox);
    container.scrollTop = container.scrollHeight;

}

(function(){
const vscode = acquireVsCodeApi();

window.onload = function(){
    vscode.postMessage({type: 'requesting-history'});
};

document.getElementById('send-button').addEventListener('click', ()=>{
    let messageBox = document.getElementById('message-box');
    if(!messageBox.value){ return; }
    messageBox.disabled = true;
    vscode.postMessage({type: 'user-prompt', value: messageBox.value});
    toggleLoader();
    addNewChatBox(messageBox.value, true);
    messageBox.value = '';
});

document.getElementById('message-box').addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
        document.getElementById('send-button').click();
    }
});

window.addEventListener('message', event =>{
    const message = event.data;
    switch(message.type){
        case 'pallette-message':
            toggleLoader();
            addNewChatBox(message.value, true);
        break;
        case 'response':
            processLLMResponse(vscode,message.value);
            toggleLoader();
            document.getElementById('message-box').disabled = false;
        break;
        case 'history':
            let messages = message.value;
            if(messages === undefined){
                return;
            }
            messages.forEach(element =>{
                addNewChatBox(element.userMessage, true);
                if(element.llmResponse.intent === "generate" || element.llmResponse.intent === "fix"){
                    createChangeBox(vscode, element.llmResponse.explanation, element.llmResponse.code[0].file, element.llmResponse.code[0].hasPendingChanges, element.llmResponse.code[0].wasAccepted, element.llmResponse.code[0].changeID);
                }else if(element.llmResponse.chat){
                    addNewChatBox(element.llmResponse.chat, false);
                }else{
                    addNewChatBox(element.llmResponse.explanation, false);
                }
            });
            document.getElementById('message-box').focus();
            
        break;
        case 'clear-chat':
            document.getElementById('chat-container').innerHTML = '';
        break;
        case 'error':
            toggleLoader();
            document.getElementById('message-box').disabled = false;
            addNewChatBox("There was an error processing your request. Please try again!", false);
        break;
        default:
            if(document.getElementById('message-loader').classList.contains('hidden')){
                toggleLoader();
                document.getElementById('message-box').disabled = false;
            }
        break;
    }
});
}());

function processLLMResponse(vscode, response){
    if(response.intent === 'fix' || response.intent === 'generate'){
        if(response.explanation){
            createChangeBox(vscode, response.explanation, response.code[0].file, response.code[0].hasPendingChanges, response.code[0].wasAccepted, response.code[0].changeID);
        }else if(response.additional_info_needed){
            showNeededInfo(response.additional_info_needed);
        }
    }else{
        if(response.chat){
            addNewChatBox(response.chat, false);
        }else if(response.explanation){
            addNewChatBox(response.explanation, false);
        }
    }
}

function createChangeBox(vscode,message, filePath, pending, wasAccepted, changeID){
    //main container
    let changeBox = document.createElement('div');
    changeBox.className = 'message-chat-box chat-bot';

    //coding buddy's name
    let name = document.createElement('b');
    name.className = 'bot-name';
    name.innerHTML = 'Coding Buddy';

    //divider declaration
    let divider1 = document.createElement('div');
    divider1.className = 'divider';

    let divider2 = divider1.cloneNode(true);
    let divider3 = divider1.cloneNode(true);

    //message displayed before the change explanation
    let changeMessage = document.createElement('p');
    changeMessage.innerHTML = "Here are your changes!";

    //change explanation box
    let explanationBox = document.createElement('div');
    explanationBox.className = 'explanation-box';

    //div for filename/image
    let fileDiv = document.createElement('div');
    fileDiv.className = 'file-name-container';

    //image
    let img = document.createElement('i');
    img.classList.add('codicon','codicon-file');

    //filename
    let fileName = document.createElement('p');
    fileName.innerHTML = filePath.split('/').pop() + ' ';

    let state = document.createElement('p');
    state.className = pending ? 'hidden' : 'state';
    state.innerHTML = wasAccepted ? '- accepted' : '- declined';

    //explanation about changed code
    let explanation = document.createElement('p');
    explanation.innerHTML = message;

    //button container
    let buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';

    //accept and decline buttons
    let acceptButton = document.createElement('button');
    acceptButton.className = 'accept-button';
    acceptButton.innerHTML = 'Accept';
    acceptButton.onclick = acceptChanges(vscode,changeID);
    let declineButton = document.createElement('button');
    declineButton.className = 'decline-button';
    declineButton.innerHTML = 'Decline';
    declineButton.onclick = declineChanges(vscode,changeID);

    changeBox.appendChild(name);
    changeBox.appendChild(divider1);
    changeBox.appendChild(changeMessage);

    fileDiv.appendChild(img);
    fileDiv.appendChild(fileName);
    fileDiv.appendChild(state);

    buttonContainer.appendChild(declineButton);
    buttonContainer.appendChild(acceptButton);

    explanationBox.appendChild(fileDiv);
    explanationBox.appendChild(divider2);
    explanationBox.appendChild(explanation);

    if(pending){
    explanationBox.appendChild(divider3);
    explanationBox.appendChild(buttonContainer);
    }
    
    changeBox.appendChild(explanationBox);

    document.getElementById('chat-container').appendChild(changeBox);
}

function acceptChanges(vscode,changeID){
    return function(){
        vscode.postMessage({type: 'accept-changes', value: changeID});
    };
}

function declineChanges(vscode,changeID){
    return function(){
        vscode.postMessage({type: 'decline-changes', value: changeID});
    };
}

function showNeededInfo(info){
    let infoContainer = document.getElementById('info-container');
    infoContainer.classList.remove("hidden");
    infoContainer.innerHTML = '';
    info.forEach(element =>{
        let wrapper = document.createElement('div');
        wrapper.className = 'info-wrapper';
        let text = document.createElement('p');
        text.innerHTML = "Searching for '" + element.keyword + "' in your code...";
        wrapper.appendChild(text);
        infoContainer.appendChild(wrapper);
    });
}