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

document.getElementById('chatName-input').addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
        document.getElementById('edit-chatName').click();
    }
});

document.getElementById('message-box').addEventListener('keypress', (e)=>{
    if(e.key === 'Enter'){
        document.getElementById('send-button').click();
    }
});

document.getElementById('edit-chatName').addEventListener('click', ()=> {
    let nameBox = document.getElementById('chatName-input');
    if(!nameBox.value){ return; }
    let newChatName = nameBox.value;
    nameBox.value = "";
    nameBox.placeholder = newChatName;
    document.getElementById('deletion-label').innerHTML = "Are you sure you want to delete chat " + newChatName + "?";
    vscode.postMessage({type:'chat-name-edited', value: newChatName});

    toggleNameChangeBox();
});

document.getElementById('confirm-deletion').addEventListener('click', ()=>{
    vscode.postMessage({type: "chat-deletion-requested"});
    toggleChatDeleteBox();
} );
document.getElementById('deny-deletion').addEventListener('click', ()=>{
    toggleChatDeleteBox();
});

window.addEventListener('keydown', (e)=>{
    if(!document.querySelector('.button-container')){return;}
    if(document.activeElement === document.querySelector('#message-box')){return;}
    if(e.key === 'Y' || e.key === 'y'){
        document.querySelector('.accept-button').click();
    }else if(e.key === 'N' || e.key === 'n'){
        document.querySelector('.decline-button').click();
    }

});

window.addEventListener('message', event =>{
    const message = event.data;
    switch(message.type){
        case 'pallette-message':
            toggleLoader();
            addNewChatBox(message.value, true);
            document.getElementById('message-box').disabled = true;
        break;
        case 'llm-response':
            processLLMResponse(vscode,message.value);
            toggleLoader();
        break;
        case 'searched-files':
            let foundFiles = message.value;
            showFoundFiles(foundFiles);
        break;
        case 'history':
            console.log(1);
            let messages = message.value.history;
            let chatName = message.value.chatName;
            document.getElementById('chatName-input').placeholder = chatName;
            document.getElementById('deletion-label').innerHTML = "Are you sure you want to delete chat " + chatName + "?";
            console.log(message.value);
            if(messages === undefined){
                return;
            }

            messages.forEach(element =>{
                addNewChatBox(element.userMessage, true);
                processLLMResponse(vscode, element.llmResponse);
            });
            let container = document.getElementById('chat-container');
            container.scrollTop = container.scrollHeight;
            if(document.querySelector('.button-container')){
                document.getElementById('message-box').disabled = true;
            }
        break;
        case 'clear-chat':
            let loader = document.getElementById('message-loader');
            if(!loader.classList.contains('hidden')){
                toggleLoader();
            }
            removeMessages();
            document.getElementById('message-box').disabled = false;
            
        break;
        case 'edit-name':
            toggleNameChangeBox();
            break;
        case 'error':
            toggleLoader();
            document.getElementById('message-box').disabled = false;
            addNewChatBox("There was an error processing your request. Please try again!", false);
        break;
        case 'toggle-chat-deletion':
            toggleChatDeleteBox();
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

function removeMessages(){
    let chatNameBox = document.getElementById('chatNameBox');
    let chatDeletionBox = document.getElementById('chat-deletion');
    document.getElementById('chat-container').innerHTML = "";
    document.getElementById('chat-container').appendChild(chatDeletionBox);
    document.getElementById('chat-container').appendChild(chatNameBox);
}

function processLLMResponse(vscode, response){
    if(response.intent === 'fix' || response.intent === 'generate'){
        if(response.code){
            if(response.code.length === 1){
                createChangeBox(vscode, response.code[0].explanation, response.code[0].file, response.code[0].hasPendingChanges, response.code[0].wasAccepted, response.code[0].changeID);
            }else{
                createMultipleChangeBox(vscode, response);
            }
        }else if(response.additional_info_needed){
            showNeededInfo(response.additional_info_needed);
        }
    }else{
        if(response.chat){
            addNewChatBox(response.chat, false);
        }else if(response.explanation){
            addNewChatBox(response.explanation, false);
        }
        document.getElementById('message-box').disabled = false;
    }
}

function createMultipleChangeBox(vscode, response){
    let responseCode = response.code;
    let changeWrapper = document.createElement('div');
    changeWrapper.className = 'message-chat-box chat-bot dropdown';

    //coding buddy's name
    let name = document.createElement('b');
    name.className = 'bot-name';
    name.innerHTML = 'Coding Buddy';

    //divider declaration
    let divider1 = document.createElement('div');
    divider1.className = 'divider';

    //message displayed before the change explanation
    let changeMessage = document.createElement('p');
    changeMessage.innerHTML = "Here are your changes!";
    changeWrapper.appendChild(name);
    changeWrapper.appendChild(divider1);
    changeWrapper.appendChild(changeMessage);

    //change loop for all changes

    let dropdownWrapper = document.createElement('div');
    dropdownWrapper.className = 'dropdown-wrapper';
    let pendingChanges = false;
    for(let i = 0; i < responseCode.length; i++){
        let change = responseCode[i];
        let dropdown = document.createElement('div');
        dropdown.className = 'dropdown';

        let fileName = change.file.split('/').pop();

        let name = document.createElement('p');
        name.innerHTML = fileName;

        let state = document.createElement('p');
        state.className = change.hasPendingChanges ? 'hidden' : 'state';
        state.innerHTML = change.wasAccepted ? '- accepted' : '- declined';

        let icon = document.createElement('i');
        icon.classList.add('codicon','codicon-file');

        let title = document.createElement('div');
        title.className = 'title';
        title.onclick = function(){toggleDropdown(change.changeID);};

        title.appendChild(icon);
        title.appendChild(name);
        title.appendChild(state);

        let dropdownMarker = document.createElement('i');
        if(i === 0){
            dropdownMarker.classList.add('codicon','codicon-chevron-up');
        }else{
            dropdownMarker.classList.add('codicon','codicon-chevron-down');
        }
        dropdownMarker.id = 'marker' + change.changeID;
        dropdownMarker.onclick = function(){toggleDropdown(change.changeID);};

        let openFile = document.createElement('i');
        openFile.classList.add('codicon','codicon-open-preview');
        openFile.onclick = function(){switchOpenedFile(vscode, response, change.changeID);};


        let options = document.createElement('div');
        options.className = 'options';
        options.appendChild(dropdownMarker);
        options.appendChild(openFile);

        let header = document.createElement('div');
        header.className = 'dropdown-header';

        header.appendChild(title);
        header.appendChild(options);

        let content = document.createElement('div');
        if(i === 0){
            content.className = 'dropdown-content';
        }else{
            content.className = 'dropdown-content hidden';
        }
        content.id = change.changeID;
        if(i === responseCode.length - 1){
            content.classList.add('last');
        }

        let explanation = document.createElement('p');
        explanation.innerHTML = change.explanation;

        let buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';

        let acceptButton = document.createElement('button');
        acceptButton.className = 'accept-button';
        acceptButton.innerHTML = 'Accept';
        acceptButton.onclick = acceptChanges(vscode,change.changeID);
        let declineButton = document.createElement('button');
        declineButton.className = 'decline-button';
        declineButton.innerHTML = 'Decline';
        declineButton.onclick = declineChanges(vscode,change.changeID);

        buttonContainer.appendChild(declineButton);
        buttonContainer.appendChild(acceptButton);

        content.appendChild(explanation);
        if(change.hasPendingChanges){
            content.appendChild(buttonContainer);
            pendingChanges = true;
        }

        dropdown.appendChild(header);
        dropdown.appendChild(content);
        let divider = document.createElement('div');
        divider.className = 'divider';

        
        dropdownWrapper.appendChild(dropdown);
        if(i !== responseCode.length - 1)
            {
            dropdownWrapper.appendChild(divider);
        }
    }

    let globalButtonContainer = document.createElement('div');
    globalButtonContainer.className = 'button-container all-changes';
    let acceptAllButton = document.createElement('button');
    acceptAllButton.className = 'accept-button';
    acceptAllButton.innerHTML = 'Accept All';
    acceptAllButton.onclick = function(){ 
        vscode.postMessage({type: 'accept-all-changes', value: responseCode});
        document.getElementById('message-box').disabled = false;
    };
    let declineAllButton = document.createElement('button');
    declineAllButton.className = 'decline-button';
    declineAllButton.innerHTML = 'Decline All';
    declineAllButton.onclick = function(){ 
        vscode.postMessage({type: 'decline-all-changes', value: responseCode});
        document.getElementById('message-box').disabled = false;
    };
    globalButtonContainer.appendChild(declineAllButton);
    globalButtonContainer.appendChild(acceptAllButton);

    let divider2 = divider1.cloneNode(true);
    changeWrapper.appendChild(dropdownWrapper);
    
    if(pendingChanges){
        changeWrapper.appendChild(divider2);
        changeWrapper.appendChild(globalButtonContainer);
    }

    document.getElementById('chat-container').appendChild(changeWrapper);
    if(document.querySelector('#info-container').innerHTML !== ''){
        document.querySelector('#info-container').classList.add('hidden');
        document.querySelector('#info-container').innerHTML = '';
    }
}

function switchOpenedFile(vscode, response, changeID){
    vscode.postMessage({type: 'change-opened-file', value: {response:response, changeID:changeID}});
}

function toggleDropdown(id){
    let dropdown = document.getElementById(id);
    dropdown.classList.toggle('hidden');
    let marker = document.getElementById('marker' + id);
    if(marker.classList.contains('codicon-chevron-down')){
        marker.classList.remove('codicon-chevron-down');
        marker.classList.add('codicon-chevron-up');
    }else{
        marker.classList.remove('codicon-chevron-up');
        marker.classList.add('codicon-chevron-down');
    }
}

function createChangeBox(vscode, message, filePath, pending, wasAccepted, changeID){
    //main container
    let changeBox = document.createElement('div');
    changeBox.className = 'message-chat-box chat-bot';

    //coding buddy's name
    let name = document.createElement('b');
    name.className = 'bot-name';
    name.innerHTML = 'Coding Buddy';

    //divider declaration

    //message displayed before the change explanation
    let changeMessage = document.createElement('p');
    changeMessage.innerHTML = "Here are your changes!";
    
    let divider1 = document.createElement('div');
    divider1.className = 'divider';

    let divider2 = divider1.cloneNode(true);
    let divider3 = divider1.cloneNode(true);
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
    if(document.querySelector('#info-container').innerHTML !== ''){
        document.querySelector('#info-container').classList.add('hidden');
        document.querySelector('#info-container').innerHTML = '';
    }
}

function toggleChatDeleteBox(){
    document.getElementById('chat-deletion').classList.toggle('hidden');
    let nameChange = document.getElementById('chatNameBox');
    if(!nameChange.classList.contains('hidden')){
        nameChange.classList.toggle('hidden');
    }
}
function toggleNameChangeBox(){
    document.getElementById('chatNameBox').classList.toggle('hidden');
    let deleteChat = document.getElementById('chat-deletion');
    if(!deleteChat.classList.contains('hidden')){
        deleteChat.classList.add('hidden');
    }
}

function acceptChanges(vscode,changeID){
    return function(){
        vscode.postMessage({type: 'accept-changes', value: changeID});
        document.getElementById('message-box').disabled = false;
    };
}

function declineChanges(vscode,changeID){
    return function(){
        vscode.postMessage({type: 'decline-changes', value: changeID});
        document.getElementById('message-box').disabled = false;
    };
}

function showFoundFiles(files){
    console.log(files);
    let infoContainer = document.querySelector('#info-container');
    if(infoContainer.classList.contains('hidden')){
        infoContainer.classList.remove('hidden');
    }
    infoContainer.innerHTML = '';
    //compare file paths on list to check for duplicates
    files = files.filter((file, index) => files.indexOf(file).searchResult === index.searchResult);
    files.forEach(element => {
        let filename = element.searchResult.fsPath.split('\\').pop();
        let message = "Sending file " + filename;
        let fileDiv = createInformationDiv(message, true);
        infoContainer.appendChild(fileDiv);
    });
}

function createInformationDiv(message, showsFile){
    let wrapper = document.createElement('div');
    wrapper.className = 'info-wrapper';
    let text = document.createElement('p');
    text.innerHTML = message;
    if(showsFile){
        let fileIcon = document.createElement('i');
        fileIcon.classList.add('codicon','codicon-file');
        wrapper.appendChild(fileIcon);
    }
    wrapper.appendChild(text);
    return wrapper;
}