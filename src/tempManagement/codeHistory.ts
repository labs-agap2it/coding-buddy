import * as fs from 'fs';
import * as os from 'os';

let codeDir = os.tmpdir() + '\\CodingBuddy\\codeHistory.json';


export function saveCodeHistory(codeHistory: any){

    let oldCodeHistory: any[] = getCodeHistory();
    
    oldCodeHistory.push(codeHistory);

    fs.writeFileSync(codeDir, JSON.stringify(oldCodeHistory));
}

export function getCodeHistory(): any[]{
    if(!fs.existsSync(codeDir)){
        fs.writeFileSync(codeDir, JSON.stringify([]));
    }
    let codeHistory = fs.readFileSync(codeDir);
    return JSON.parse(codeHistory.toString());
}

export function deleteCodeHistory(changeID: any) {
    let codeHistory = getCodeHistory();
    let newCodeHistory = codeHistory.filter((element: any) => element.changeID !== changeID);
    fs.writeFileSync(codeDir, JSON.stringify(newCodeHistory));
}

export function deleteWholeCodeHistory(){
    fs.writeFileSync(codeDir, JSON.stringify([]));
}