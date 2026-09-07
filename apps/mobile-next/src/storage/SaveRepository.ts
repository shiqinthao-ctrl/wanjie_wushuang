import fresh from '../data/freshSave.json';
import type { GameSave } from '../core/saveTypes';
import { parseSchema30 } from './schema30';

export const SAVE_DATABASE = 'wanjie-mobile-next';
export interface SaveSlot { id: string; label: string; save: GameSave; revision: number; updatedAt: number; imported: boolean }
interface Receipt<T> { slotId: string; operationId: string; result: T }
const request = <T>(query: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => {
  query.onsuccess = () => resolve(query.result); query.onerror = () => reject(query.error);
});
const required = (slot: SaveSlot | undefined): SaveSlot => {
  if (!slot) throw new Error('未找到存档，请重新选择。');
  return { ...slot, save: parseSchema30(JSON.stringify(slot.save)) };
};

/** Owns only the mobile database. No legacy localStorage keys are written. */
export class SaveRepository {
  private constructor(private db: IDBDatabase) { db.onversionchange = () => db.close(); }
  static open(name = SAVE_DATABASE): Promise<SaveRepository> {
    return new Promise((resolve, reject) => {
      let abandoned = false;
      const opening = indexedDB.open(name, 1);
      opening.onupgradeneeded = () => {
        const db = opening.result;
        db.createObjectStore('slots', { keyPath: 'id' });
        db.createObjectStore('meta');
        db.createObjectStore('backups', { keyPath: 'slotId' });
        db.createObjectStore('receipts', { keyPath: ['slotId', 'operationId'] });
      };
      opening.onsuccess = () => { if (abandoned) opening.result.close(); else resolve(new SaveRepository(opening.result)); };
      opening.onerror = () => reject(new Error('无法打开本地存档，请检查浏览器存储权限后重试。'));
      opening.onblocked = () => { abandoned = true; reject(new Error('存档正在被其他页面使用，请关闭旧页面后重试。')); };
    });
  }
  private async transaction<T>(stores: string[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => Promise<T>): Promise<T> {
    const tx = this.db.transaction(stores, mode);
    const done = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error || new Error('存档写入中断，本次改动未保存。'));
      tx.onerror = () => { /* Abort determines whether the transaction committed. */ };
    });
    void done.catch(() => {});
    try { const value = await work(tx); await done; return value; }
    catch (error) { try { tx.abort(); } catch { /* Already aborted/completed. */ } await done.catch(() => {}); throw error; }
  }
  private makeSlot(label: string, save: GameSave, imported = false): SaveSlot {
    return { id: crypto.randomUUID(), label: label.trim().slice(0, 80) || '新征途', save, revision: 0, updatedAt: Date.now(), imported };
  }
  initialize(): Promise<SaveSlot> {
    return this.transaction(['slots', 'meta'], 'readwrite', async tx => {
      const slots = tx.objectStore('slots'), meta = tx.objectStore('meta');
      const active = await request(meta.get('active')) as string | undefined;
      if (active) return required(await request(slots.get(active)));
      const existing: SaveSlot[] = await request(slots.getAll());
      const slot = existing[0] || this.makeSlot('新征途 1', parseSchema30(JSON.stringify(fresh)));
      if (!existing.length) slots.add(slot);
      meta.put(slot.id, 'active');
      return required(slot);
    });
  }
  list(): Promise<SaveSlot[]> {
    return this.transaction(['slots'], 'readonly', async tx => {
      const slots: SaveSlot[] = await request(tx.objectStore('slots').getAll());
      return slots.map(required).sort((a, b) => a.updatedAt - b.updatedAt);
    });
  }
  get(id: string): Promise<SaveSlot> { return this.transaction(['slots'], 'readonly', async tx => required(await request(tx.objectStore('slots').get(id)))); }
  select(id: string): Promise<SaveSlot> {
    return this.transaction(['slots', 'meta'], 'readwrite', async tx => {
      const slot = required(await request(tx.objectStore('slots').get(id)));
      tx.objectStore('meta').put(id, 'active'); return slot;
    });
  }
  createFresh(): Promise<SaveSlot> {
    return this.transaction(['slots', 'meta'], 'readwrite', async tx => {
      const count = await request(tx.objectStore('slots').count());
      const slot = this.makeSlot(`新征途 ${count + 1}`, parseSchema30(JSON.stringify(fresh)));
      tx.objectStore('slots').add(slot); tx.objectStore('meta').put(slot.id, 'active'); return slot;
    });
  }
  importJson(raw: string, label: string): Promise<SaveSlot> {
    // Validate before opening a write transaction. An import always gets a new ID.
    const slot = this.makeSlot(label, parseSchema30(raw), true);
    return this.transaction(['slots', 'meta', 'backups'], 'readwrite', async tx => {
      tx.objectStore('backups').add({ slotId: slot.id, raw, importedAt: slot.updatedAt });
      tx.objectStore('slots').add(slot); tx.objectStore('meta').put(slot.id, 'active'); return slot;
    });
  }
  async exportJson(id: string): Promise<string> { return JSON.stringify((await this.get(id)).save, null, 2); }
  exportOriginal(id: string): Promise<string> {
    return this.transaction(['backups'], 'readonly', async tx => {
      const backup = await request(tx.objectStore('backups').get(id)) as { raw: string } | undefined;
      if (!backup) throw new Error('此存档没有导入原件。');
      return backup.raw;
    });
  }
  transactOnce<T>(slotId: string, operationId: string, revision: number, update: (save: GameSave) => T): Promise<{ applied: boolean; slot: SaveSlot; result: T }> {
    if (!operationId || operationId.length > 200) return Promise.reject(new Error('无效的存档操作编号。'));
    return this.transaction(['slots', 'receipts'], 'readwrite', async tx => {
      const slots = tx.objectStore('slots'), receipts = tx.objectStore('receipts');
      const receipt = await request(receipts.get([slotId, operationId])) as Receipt<T> | undefined;
      const slot = required(await request(slots.get(slotId)));
      if (receipt) return { applied: false, slot, result: receipt.result };
      if (slot.revision !== revision) throw new Error('存档已更新，请返回大厅重新载入后继续。');
      // The reducer is synchronous; all reads, changes and receipt writes share this transaction.
      const result = update(slot.save);
      if (result && typeof (result as { then?: unknown }).then === 'function') throw new Error('存档更新不允许异步操作。');
      slot.save = parseSchema30(JSON.stringify(slot.save));
      slot.revision++; slot.updatedAt = Date.now();
      slots.put(slot);
      receipts.add({ slotId, operationId, result });
      return { applied: true, slot, result };
    });
  }
  close(): void { this.db.close(); }
}
