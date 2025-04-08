<script lang="ts">
  let { vscode, response } = $props();
  let responseState = $state(
    response.code.map((change: any) => ({ ...change, isSelected: false }))
  );
  let pendingChanges = $derived(
    responseState.some((change: any) => change.hasPendingChanges)
  );
  function enableInputBox() {
    (document.getElementById("message-box") as HTMLInputElement).disabled =
      false;
  }
  let processedResponse = $derived(() =>
    responseState.map((change: any, index: number) => {
      const className = change.hasPendingChanges ? "hidden" : "state";
      let dropdownIcon = change.isSelected
        ? "codicon-chevron-up"
        : "codicon-chevron-down";
      let isOpen = change.isSelected ? "last" : "hidden";
      return { ...change, index, className, dropdownIcon, isOpen };
    })
  );

  function toggleDropdown(index: number) {
    responseState[index].isSelected = !responseState[index].isSelected;
  }
</script>

<div class="message-chat-box chat-bot dropdown">
  <b class="bot-name">Coding Buddy</b>
  <div class="divider"></div>
  <p>Here are your changes!</p>

  <div class="dropdown-wrapper">
    {#each processedResponse() as { changeID, file, explanation, hasPendingChanges, wasAccepted, className, dropdownIcon, isOpen, index }}
      <div class="dropdown">
        <div class="dropdown-header">
          <div id="title{changeID}" class="title">
            <i class="codicon codicon-file"></i>
            <p>{file.split(/[/\\]/).pop()}</p>
            <p class={className}>
              {#if wasAccepted}- accepted{:else}- declined{/if}
            </p>
          </div>
          <div class="options">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <i
              id="marker{changeID}"
              aria-label="Dropdown toggle"
              onclick={() => toggleDropdown(index)}
              class="codicon {dropdownIcon} pointer"
            ></i>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <i
              id="file{changeID}"
              class="codicon codicon-open-preview pointer"
              onclick={() =>
                vscode.postMessage({
                  type: "change-opened-file",
                  value: { changeID, response },
                })}
            ></i>
          </div>
        </div>
        <div id={changeID} class="dropdown-content {isOpen}">
          <p>{explanation}</p>
          {#if hasPendingChanges}
            <div class="button-container">
              <button
                class="accept-button"
                onclick={() => {
                  responseState[index].wasAccepted = true;
                  responseState[index].hasPendingChanges = false;
                  vscode.postMessage({
                    type: "accept-changes",
                    value: changeID,
                  });
                  const hasMorePendingChanges = responseState.some(
                    (r: any) => r.hasPendingChanges
                  );

                  if (!hasMorePendingChanges) {
                    enableInputBox();
                  }
                }}>Accept</button
              >
              <button
                class="decline-button"
                onclick={() => {
                  responseState[index].wasAccepted = false;
                  responseState[index].hasPendingChanges = false;
                  vscode.postMessage({
                    type: "decline-changes",
                    value: changeID,
                  });
                  const hasMorePendingChanges = responseState.some(
                    (r: any) => r.hasPendingChanges
                  );

                  if (!hasMorePendingChanges) {
                    enableInputBox();
                  }
                }}>Decline</button
              >
            </div>
          {/if}
        </div>
        {#if response.length - 1 === index}
          <div class="divider"></div>
        {/if}
      </div>
    {/each}
  </div>

  {#if pendingChanges}
    <div class="divider"></div>
    <div class="button-container all-changes">
      <button
        class="decline-button decline-all-changes"
        onclick={() => {
          responseState.map((change: any) => {
            change.wasAccepted = false;
            change.hasPendingChanges = false;
          });
          vscode.postMessage({
            type: "decline-all-changes",
            value: response,
          });
          enableInputBox();
        }}>Decline All</button
      >
      <button
        class="accept-button accept-all-changes"
        onclick={() => {
          responseState.map((change: any) => {
            change.wasAccepted = true;
            change.hasPendingChanges = false;
          });
          vscode.postMessage({
            type: "accept-all-changes",
            value: response,
          });
          enableInputBox();
        }}>Accept All</button
      >
    </div>
  {/if}
</div>
