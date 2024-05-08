import * as fs from 'fs';
import * as os from 'os';

export function saveCodeHistory(codeHistory: any){

    let oldCodeHistory: any[] = getCodeHistory();
    
    oldCodeHistory.push(codeHistory);

    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\codeHistory.json', JSON.stringify(oldCodeHistory));
}

export function getCodeHistory():[]{
    if(!fs.existsSync(os.tmpdir() + '\\CodingBuddy\\codeHistory.json')){
        fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\codeHistory.json', JSON.stringify([]));
    }
    let codeHistory = fs.readFileSync(os.tmpdir() + '\\CodingBuddy\\codeHistory.json');
    return JSON.parse(codeHistory.toString());
}

export function deleteCodeHistory(changeID: any) {
    let codeHistory = getCodeHistory();
    let newCodeHistory = codeHistory.filter((element: any) => element.changeID !== changeID);
    fs.writeFileSync(os.tmpdir() + '\\CodingBuddy\\codeHistory.json', JSON.stringify(newCodeHistory));
}
