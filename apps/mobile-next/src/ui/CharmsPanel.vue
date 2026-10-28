<script setup lang="ts">
import { computed, ref } from 'vue';
import { charmViews } from '../chapter/charms';
import { readChapterProgress } from '../chapter/progress';
import type { ChapterProgress } from '../chapter/progress';
import type { SaveRepository, SaveSlot } from '../storage/SaveRepository';
/**
 * The charms page, and the only page in the app that *writes* progress (D30).
 *
 * Equipping is one `transactOnce`: the operation id carries the slot revision, so a retry after a
 * dropped connection is idempotent while a genuine second equip (unequip, then equip again) is a
 * new operation. Without the revision in the id, the third click would hit the first one's receipt
 * and report success without writing anything.
 */
const props = defineProps<{ repository: SaveRepository; active: SaveSlot }>();
const emit = defineEmits<{ selected: [slot: SaveSlot]; back: []; busy: [value: boolean] }>();
const busy = ref(false), error = ref(''), notice = ref('');
/** Reading can fail on a save from a newer build; that is a message, not a blank page. */
const read = computed<{ progress: ChapterProgress | null; error: string }>(() => {
  try { return { progress: readChapterProgress(props.active.save), error: '' }; }
  catch (cause) { return { progress: null, error: cause instanceof Error ? cause.message : '存档进度读不出来。' }; }
});
const rows = computed(() => read.value.progress ? charmViews(read.value.progress) : []);
const equippedName = computed(() => rows.value.find(row => row.equipped)?.name ?? '未装备');
async function equip(id: string | null) {
  if (busy.value || !read.value.progress) return;
  busy.value = true; emit('busy', true); error.value = ''; notice.value = '';
  try {
    const saved = await props.repository.transactOnce(props.active.id, `chapter1-v1:charm:${props.active.revision}:${id ?? 'none'}`, props.active.revision, save => {
      const next = readChapterProgress(save);
      next.charms.equipped = id;
      save.mobileChapter = next;
      return id;
    });
    emit('selected', saved.slot);
    notice.value = id ? `已装备 ${rows.value.find(row => row.id === id)?.name ?? id}，下一局生效。` : '已卸下护符，下一局按原样开打。';
  }
  catch (cause) { error.value = cause instanceof Error ? cause.message : '护符尚未确认保存，请重试。'; }
  finally { busy.value = false; emit('busy', false); }
}
</script>

<template>
  <section class="charms">
    <small class="eyebrow">战备</small>
    <h1>六枚护符</h1>
    <p class="lede">
      一次只戴一枚。每一枚只改一个数，改多少写在下面 —— 没有一枚是「什么都改一点」的。
      三枚开局就有，另外三枚要靠打赢、觉醒、凑出两条羁绊才会掉。
    </p>
    <p class="now">当前：<strong>{{ equippedName }}</strong></p>

    <p v-if="read.error" class="warn" role="alert">{{ read.error }}</p>
    <p v-if="error" class="warn" role="alert">{{ error }}</p>
    <p v-if="notice" class="notice" role="status">{{ notice }}</p>

    <ul class="list">
      <li v-for="row in rows" :key="row.id" :data-equipped="row.equipped" :data-unlocked="row.unlocked">
        <div class="head">
          <strong>{{ row.name }}</strong>
          <span class="tag" data-kind="state">{{ row.equipped ? '已装备' : row.unlocked ? '已解锁' : '未获得' }}</span>
        </div>
        <p>{{ row.detail }}</p>
        <div class="act">
          <button v-if="row.equipped" :disabled="busy" @click="equip(null)">卸下</button>
          <button v-else :disabled="busy || !row.unlocked" :aria-label="`装备 ${row.name}`" @click="equip(row.id)">
            {{ row.unlocked ? '装备' : '尚未获得' }}
          </button>
        </div>
      </li>
    </ul>

    <p class="boundary">
      装备会立刻写进存档，下一局按它开打。章节出战入口（R3-U06）尚未接入大厅，所以现在装备之后
      还没有可点开的一局 —— 这一条写在页面上，不藏在代码里。
    </p>
    <button class="primary" @click="$emit('back')">返回大厅</button>
  </section>
</template>

<style scoped>
.charms { max-width: 760px; margin: 34px auto 80px; }
.charms h1 { font-size: 32px; margin: 14px 0 16px; }
.lede { font-size: 13px; line-height: 1.9; color: var(--muted); }
.now { margin-top: 14px; font-size: 12px; letter-spacing: .08em; color: var(--gold); }
.warn { margin-top: 14px; padding: 10px 12px; border-left: 2px solid #e08a6a; background: #2a1b16; font-size: 12px; line-height: 1.8; }
.notice { margin-top: 14px; font-size: 12px; color: #7eefce; }
.list { list-style: none; padding: 0; margin: 18px 0 0; display: grid; gap: 10px; }
.list li { border: 1px solid var(--line); border-radius: 6px; padding: 14px 16px; background: #0f1f1c; }
.list li[data-equipped="true"] { border-color: var(--gold); }
.list li[data-unlocked="false"] { opacity: .62; }
.head { display: flex; align-items: center; gap: 10px; }
.head strong { font-size: 15px; letter-spacing: .06em; }
.head .tag { margin-left: auto; font-size: 11px; padding: 3px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); }
.list li[data-equipped="true"] .tag { color: var(--gold); border-color: var(--gold); }
.list p { font-size: 12px; line-height: 1.8; color: var(--muted); margin-top: 8px; }
.act { margin-top: 10px; display: flex; justify-content: flex-end; }
.act button { font-size: 12px; padding: 6px 16px; }
.boundary { margin-top: 24px; font-size: 12px; line-height: 1.9; color: #8fa79b; }
.charms > button { margin-top: 22px; width: 100%; }
</style>
