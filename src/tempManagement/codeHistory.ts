import * as fs from 'fs';
import * as os from 'os';

let codeDir = os.tmpdir() + '\\CodingBuddy\\codeHistory.json';


export function saveCodeHistory(codeHistory: any){

    let oldCodeHistory: any[] = getCodeHistory();
    
    oldCodeHistory.push(codeHistory);

    fs.writeFileSync(codeDir, JSON.stringify(oldCodeHistory));
}

export function getCodeHistory(): any[]{
    let codeJSON:any[];
    try{
        codeJSON = JSON.parse(fs.readFileSync(codeDir).toString());
    }catch(e){
        codeJSON = createCodeFile();
    }
    return codeJSON;
}

export function deleteCodeHistory(changeID: any) {
    let codeHistory = getCodeHistory();
    let newCodeHistory = codeHistory.filter((element: any) => element.changeID !== changeID);
    fs.writeFileSync(codeDir, JSON.stringify(newCodeHistory));
}

function createCodeFile():any[]{
    try{
        fs.writeFileSync(codeDir, JSON.stringify([]));
    }catch(e){
        fs.mkdirSync(os.tmpdir()+'\\CodingBuddy');
        fs.writeFileSync(codeDir, JSON.stringify([]));
    }
    return [];
}

export function deleteWholeCodeHistory(){
    fs.writeFileSync(codeDir, JSON.stringify([]));
}