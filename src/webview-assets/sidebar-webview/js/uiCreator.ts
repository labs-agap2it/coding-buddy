import { mount } from "svelte";
import { VsCodeApi } from "./types";
import Chatbox from "../components/chatbox.svelte";
import changeBox from "../components/changeBox.svelte";
import MultipleChangeBox from "../components/multipleChangeBox.svelte";
import InfoDiv from "../components/infoDiv.svelte";

const templates = {
  chatBox: Chatbox,
  multipleChangeBox: MultipleChangeBox,
  changeBox: changeBox,
  infoDiv: InfoDiv,
};

export function renderChatBox(message: string, isUser: boolean) {
  mount(templates.chatBox, {
    target: document.getElementById("chat-container")!,
    props:{
      message : message,
      isUser : isUser,
    }
  });
}

export function renderMultipleChangeBox(vscode: VsCodeApi, response: any) {
  mount(templates.multipleChangeBox,
    { target: document.getElementById("chat-container")!,
      props:{
        vscode: vscode,
        response: response,
      } as any
    });
}

export function renderChangeBox(vscode: VsCodeApi, response: any) {
  mount(templates.changeBox,
    { target: document.getElementById("chat-container")!,
      props:{
        vscode: vscode,
        response: response
      }
    });
}

export function renderInfoDiv(message: string, showsFile: boolean, target: Element) {
  return mount(templates.infoDiv,{
    target: target,
    props:{ message: message, showsFile: showsFile }});
}



