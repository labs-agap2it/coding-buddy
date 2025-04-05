<script lang="ts">
  let { vscode, response } = $props();
  let changeID = response.code[0].changeID;
  let file = response.code[0].file.split(/[/\\]/).pop();
  let message = response.code[0].explanation;
  let hasPendingChanges = $state(response.code[0].hasPendingChanges);
  let wasAccepted = $state(response.code[0].wasAccepted);
  let className = $derived(hasPendingChanges ? "hidden" : "state");
  function declineChanges(changeID: string) {
    wasAccepted = false;
    hasPendingChanges = false;
    vscode.postMessage({
      type: "decline-changes",
      value: changeID,
    });
    enableInputBox();
  }
  function acceptChanges(changeID: string) {
    wasAccepted = true;
    hasPendingChanges = false;
    vscode.postMessage({
      type: "accept-changes",
      value: changeID,
    });
    enableInputBox();
  }
  function enableInputBox() {
    (document.getElementById("message-box") as HTMLInputElement).disabled =
      false;
  }
</script>

<div class="message-chat-box chat-bot">
  <b class="bot-name">Coding Buddy</b>
  <div class="divider"></div>
  <p>Here are your changes!</p>
  <div class="explanation-box">
    <div class="file-name-container">
      <i class="codicon codicon-file"></i>
      <p>{file}</p>
      <p class=" {className}">
        {#if wasAccepted}- accepted{:else}- declined{/if}
      </p>
    </div>
    <div class="divider"></div>
    <p>{@html message}</p>
    {#if hasPendingChanges}
      <div class="divider"></div>
      <div class="button-container">
        <button onclick={() => acceptChanges(changeID)} class="accept-button"
          >Accept</button
        >
        <button onclick={() => declineChanges(changeID)} class="decline-button"
          >Decline</button
        >
      </div>
    {/if}
  </div>
</div>
