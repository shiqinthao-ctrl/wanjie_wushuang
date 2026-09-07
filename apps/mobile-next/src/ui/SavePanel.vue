<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue';
import type { SaveRepository, SaveSlot } from '../storage/SaveRepository';
import { MAX_IMPORT_BYTES, previewBlocker } from '../storage/schema30';
const props = defineProps<{ repository: SaveRepository; active: SaveSlot }>();
const emit = defineEmits<{ selected: [slot: SaveSlot]; back: []; busy: [value: boolean] }>();
const slots = shallowRef<SaveSlot[]>([]);
const busy = ref(false), error = ref(''), notice = ref('');
async function perform(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true; emit('busy', true); error.value = ''; notice.value = '';
  try { await action(); slots.value = await props.repository.list(); }
  catch (cause) { error.value = cause instanceof DOMException ? '本地存档写入失败，请检查存储空间与权限后重试。已有存档未被覆盖。' : cause instanceof Error ? cause.message : '存档操作失败，请重试。'; }
  finally { busy.value = false; emit('busy', false); }
}
function create() { void perform(async () => { emit('selected', await props.repository.createFresh()); notice.value = '已创建独立的新存档。'; }); }
function select(id: string) { void perform(async () => { emit('selected', await props.repository.select(id)); notice.value = '已切换当前存档。'; }); }
async function importFile(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0];
  if (!file) return;
  await perform(async () => {
    if (file.size > MAX_IMPORT_BYTES) throw new Error('存档文件超过 5 MB，请使用单个存档文件。');
    let raw: string;
    try { raw = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await file.arrayBuffer()); }
    catch { throw new Error('文件编码无效，请使用 UTF-8 JSON 存档。'); }
    emit('selected', await props.repository.importJson(raw, file.name.replace(/\.json$/i, '')));
    notice.value = '已导入独立副本，并保留导入原件。';
  });
  input.value = '';
}
function download(original = false) {
  void perform(async () => {
    const raw = original ? await props.repository.exportOriginal(props.active.id) : await props.repository.exportJson(props.active.id);
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url;
    link.download = `wanjie-${original ? 'original' : 'schema30'}-${Date.now()}.json`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice.value = '已准备下载文件。';
  });
}
onMounted(() => { void perform(async () => {}); });
</script>

<template>
  <section class="save-panel">
    <small class="eyebrow">保存每一段征途</small><h1>本地存档</h1>
    <p>存档保存在当前浏览器。导入会建立独立副本；请定期导出备份，跨设备或端口使用文件转移。</p>
    <p v-if="error" class="save-error" role="alert">{{ error }}</p>
    <p v-if="notice" class="save-notice" role="status">{{ notice }}</p>
    <ul class="save-list" aria-label="存档列表">
      <li v-for="slot in slots" :key="slot.id" :class="{ selected: slot.id === active.id }">
        <div><h2>{{ slot.label }} <small v-if="slot.id === active.id">当前</small></h2>
          <p>金币 {{ slot.save.gold }} · {{ slot.imported ? '导入副本' : '新征途' }}</p>
          <p v-if="previewBlocker(slot.save)" class="save-boundary">{{ previewBlocker(slot.save) }}</p>
        </div>
        <button :disabled="busy || slot.id === active.id" :aria-label="`使用 ${slot.label}`" @click="select(slot.id)">{{ slot.id === active.id ? '使用中' : '使用' }}</button>
      </li>
    </ul>
    <div class="save-actions">
      <button :disabled="busy" class="primary" @click="create">创建新存档</button>
      <button :disabled="busy" @click="download(false)">导出当前进度</button>
      <button v-if="active.imported" :disabled="busy" @click="download(true)">导出导入原件</button>
      <label class="save-import">导入存档文件<input :disabled="busy" aria-label="导入存档文件" type="file" accept=".json,application/json" @change="importFile" /><small>单个 Schema30 JSON，最大 5 MB</small></label>
    </div>
    <button :disabled="busy" @click="emit('back')">返回大厅</button>
  </section>
</template>
