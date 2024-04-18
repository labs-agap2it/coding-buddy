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
    console.log("ALGO aconteceu. Não sei o quê, mas aconteceu. Sques o loader ligou ou desligou. Já vemos.");
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
    console.log("clicked!");
    let messageBox = document.getElementById('message-box');
    if(!messageBox.value){ return; }
    messageBox.ariaDisabled = true;
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
            console.log("pallette message received");
            toggleLoader();
            addNewChatBox(message.value, true);
            console.log("waiting for LLM response");
        break;
        case 'response':
            console.log("response received");
            processLLMResponse(message.value);
            toggleLoader();
            document.getElementById('message-box').ariaDisabled = false;
        break;
        case 'history':
            let messages = message.value;
            if(messages.length === 0){
                return;
            }
            messages.forEach(element =>{
                addNewChatBox(element.userMessage, true);
                if(element.llmResponse.chat){
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
    }
});
console.log(document.getElementById('send-button'));
}());

function processLLMResponse(response){
    ///document.getElementById('info-container').classList.add("hidden");
    if(response.chat){
        addNewChatBox(response.chat, false);
    }else if(response.explanation){
        addNewChatBox(response.explanation, false);
    }else if(response.additional_info_needed){
        showNeededInfo(response.additional_info_needed);
    }
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
    });
}