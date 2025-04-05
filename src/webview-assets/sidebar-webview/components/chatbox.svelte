<script lang="ts">
  let {
    isUser,
    message,
  }: {
    isUser: boolean;
    message: string;
  } = $props();
  let classBox = isUser ? "chat-user" : "chat-bot";
  let className = isUser ? "user-name" : "bot-name";
</script>

<div class="message-chat-box {classBox}">
  <b class={className}>
    {#if isUser}You{:else}Coding Buddy{/if}
  </b>
  <div class="divider"></div>
  <p class="mtk19">{@html message}</p>
</div>
