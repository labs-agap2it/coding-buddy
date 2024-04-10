import * as fs from 'fs';
import * as os from 'os';

export function getUserToken(): string {
    let token = "";
    let tokenPath = os.tmpdir() + "\\CodingBuddy\\token.json";
    if (fs.existsSync(tokenPath)) {
        token = JSON.parse(fs.readFileSync(tokenPath, 'utf8')).token;
    }
    return token;
}

export function setUserToken(token: string) {
    let tokenPath = os.tmpdir() + "\\CodingBuddy\\token.json";

    let tokenJson = JSON.stringify({ "token": token });
    fs.writeFileSync(tokenPath, tokenJson);
}

export function getUserSettings(): string {
    let settings = "";
    let settingsPath = os.tmpdir() + "\\CodingBuddy\\config.json";
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')).maxChatNumber;
    }
    return settings;
}

export function setUserSettings(maxChatNumber: number) {
    let settingsPath = os.tmpdir() + "\\CodingBuddy\\config.json";

    let settings = JSON.stringify({
        "maxChatNumber": maxChatNumber
    });
    fs.writeFileSync(settingsPath, settings);
}

export function getMessageHistory(){
  try{
    let chatHistory = fs.readFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json');
    if(chatHistory){
      return chatHistory.toString();
    }else{
      return "";
    }
  }catch(e){
    return "";
  }
}

export function saveMessageHistory(response:any, message:string){
    
  let chatHistory = getMessageHistory();
  let jsonHistory = [];
  if(chatHistory !== ""){
    try{
      jsonHistory = JSON.parse(chatHistory.toString());
    }catch{}
  }
  let newMessage  = {
    "user-message": message,
    "llm-response": response
  };
  jsonHistory.push(newMessage);
  let maxChatNumber = getUserSettings();
  
  if(!maxChatNumber){
    return;
  }

  if(jsonHistory.length > maxChatNumber){
    jsonHistory.shift();
  }

  fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\chatHistory.json', JSON.stringify(jsonHistory));
}