<script lang="ts">
  let {
    showsFile,
    message,
  }: {
    showsFile: boolean;
    message: string;
  } = $props();
</script>

<div class="info-wrapper">
  {#if showsFile}
    <i class="codicon codicon-file"></i>
  {/if}
  <p>{@html message}</p>
</div>
