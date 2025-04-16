import OpenAI from "openai";
import * as vscode from "vscode";
import * as editorUtils from "../editor/userEditor";
import * as chatHistory from "../tempManagement/chatHistory";
import { Message } from "../model/chatModel";
import {
  stopAskingForInformation,
  codeExamples,
  jsonFormat,
  rulesets,
} from "./directives";
import vectraIndex from "../db/vectra";
import { generateEmbedding } from "./embeddingConnection";
import { llmAdditionalInfo } from "../model/llmResponse";
import { getProjectId } from "../changeDetector/changeDetector";
import { promptHistory } from "../tempManagement/promptHistory";

export async function buildMessages(
  userMessage: string,
  additionalInfo?: llmAdditionalInfo[]
): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam[]> {
  let userCode = editorUtils.getUserCode();
  //console.log(userCode);
  const userEmbedding = await generateEmbedding(userMessage, global.APIKEY!);
  const context = await vectraIndex.queryItems(userEmbedding!, 3, {
    projectId: { $eq: getProjectId() },
  });
  let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: rulesets,
    },
  ];

  let workspaceURI = vscode.workspace.getWorkspaceFolder;
  messages.push(
    {
      role: "system",
      content: jsonFormat,
    },
    {
      role: "system",
      content: codeExamples,
    },
    {
      role: "system",
      content: "### Workspace URI### (" + workspaceURI + ")#",
    }
  );

  context.map((item) => {
    messages.push({
      role: "system",
      content: `###Context_Start
                  fileUri: ${item.item.metadata.path}
                  ##File_Content_Start
                    ${item.item.metadata.content}
                  ##File_Content_End
                ###Context_End`,
    });
  });

  if (promptHistory.length > 0) {
    console.log("promptHistory: ", promptHistory);
    messages.push({
      role: "system",
      content: `###Prompt_History_START
                  ${promptHistory}
                  ###Prompt_History_END
        `,
    });
  }

  if (additionalInfo) {
    for (let i = 0; i < additionalInfo.length; i++) {
      messages.push({
        role: "system",
        content: `##Search_Result_Start
                    fileUri: "${additionalInfo[i].path}"
                    ##Full_File_Content_Start
                      ${additionalInfo[i].content}
                    ##Full_File_Content_End
                  ##Search_Result_End`,
      });
    }
  }

  let messageHistory = buildHistoryArray();
  if (messageHistory.length > 0) {
    for (let i = 0; i < messageHistory.length; i++) {
      messages.push(messageHistory[i]);
    }
  }

  messages.push({
    role: "system",
    content: userCode,
  });

  if (global.numberOfTries && global.numberOfTries >= 3) {
    messages.push({
      role: "system",
      content: stopAskingForInformation,
    });
    global.numberOfTries = 0;
  } else {
    messages.push({
      role: "user",
      content: userMessage,
    });
  }
  return messages;
}

function buildHistoryArray(): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  let openedChat: Message[] | undefined = chatHistory.getOpenedChat();
  if (!openedChat || openedChat.length === 0) {
    return [];
  }

  let messageHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  for (let i = 0; i < openedChat.length; i++) {
    messageHistory.push(
      {
        role: "user",
        content: openedChat[i].userMessage,
      },
      {
        role: "assistant",
        content: JSON.stringify(openedChat[i].llmResponse),
      }
    );
  }

  return messageHistory;
}
