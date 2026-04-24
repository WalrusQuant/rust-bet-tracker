<script lang="ts">
  interface Props {
    message: string;
  }
  let { message }: Props = $props();
</script>

<div class="text-center py-10 text-secondary text-sm">
  {message}
</div>
