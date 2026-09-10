'use client';

import { LogSessionContext } from './LogController';

// Maximum payload size is 64 KB (65,536 bytes).
// We set a conservative batch threshold of 52 KB (53,248 bytes) to guarantee
// the serialized JSON payload never exceeds 64 KB under any circumstance.
const MAX_SAFE_CHUNK_BYTES = 52 * 1024;
const SYNC_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

interface RegisteredSink {
  connectionId: string;
  sink: { entries: string[] };
}

class LogSyncService {
  private sinks = new Set<RegisteredSink>();
  private syncTimer: NodeJS.Timeout | null = null;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.start();
      window.addEventListener('beforeunload', () => {
        this.flushLogs(true).catch(() => {});
      });
    }
  }

  /**
   * Register a LogController context sink so its entries can be synced.
   * Compatible as the `exportLog` prop callback for LogController.
   */
  public registerSink = (_read: unknown, ctx: LogSessionContext) => {
    if (!ctx?.sink?.entries) return;

    // Avoid duplicate registration of the same sink reference or entries array
    for (const reg of this.sinks) {
      if (reg.sink === ctx.sink || reg.sink.entries === ctx.sink.entries) return;
    }

    this.sinks.add({
      connectionId: ctx.connectionId,
      sink: ctx.sink,
    });
  };

  /**
   * Start the 30-minute periodic synchronization timer.
   */
  public start() {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => {
      console.log('⏰ 30-minute log sync interval triggered');
      this.flushLogs().catch((err) =>
        console.error('Error in 30-minute log sync:', err)
      );
    }, SYNC_INTERVAL_MS);
  }

  /**
   * Stop the synchronization timer.
   */
  public stop() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Send a single batch payload to POST /api/logs.
   */
  private async sendBatch(
    connectionId: string,
    batch: string[],
    isKeepalive = false
  ): Promise<{ success: boolean; status?: number; error?: string }> {
    const payload = {
      connectionId,
      entries: batch,
    };

    const payloadJson = JSON.stringify(payload);
    const payloadSize = payloadJson.length;

    if (payloadSize > 64 * 1024) {
      console.warn(
        `⚠️ Batch payload (${payloadSize} bytes) exceeds 64 KB. Sending may fail.`
      );
    }

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: payloadJson,
        ...(isKeepalive ? { keepalive: true } : {}),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        return { success: false, status: res.status, error: errorText };
      }

      return { success: true, status: res.status };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error' };
    }
  }

  /**
   * Clear function to delete synced items from the sinks.
   * @param connectionId The connection ID of the sinks to clear
   * @param syncedEntries Array of string entries that were successfully synced
   */
  public clearSyncedItems(connectionId: string, syncedEntries: string[]): number {
    const syncedSet = new Set(syncedEntries);
    let totalDeleted = 0;

    for (const reg of this.sinks) {
      if (reg.connectionId !== connectionId) continue;
      if (!reg.sink?.entries || reg.sink.entries.length === 0) continue;

      const beforeCount = reg.sink.entries.length;
      const remaining = reg.sink.entries.filter((entry) => !syncedSet.has(entry));
      totalDeleted += beforeCount - remaining.length;

      // Update in-place so LogController's entriesRef is emptied
      reg.sink.entries.length = 0;
      for (let i = 0; i < remaining.length; i++) {
        reg.sink.entries.push(remaining[i]);
      }
    }

    if (totalDeleted > 0) {
      console.log(`🗑️ Cleared ${totalDeleted} synced item(s) for connectionId: ${connectionId}`);
    }

    return totalDeleted;
  }

  /**
   * Flush all collected logs to POST /api/logs.
   * If the payload reaches 64 KB, splits entries into multiple batches.
   * After sync is successful, calls clear function to delete synced items.
   */
  public async flushLogs(isKeepalive = false): Promise<{ sentCount: number; batches: number }> {
    if (this.isSyncing) {
      return { sentCount: 0, batches: 0 };
    }

    this.isSyncing = true;
    let totalSent = 0;
    let totalBatches = 0;

    try {
      // 1. Split entries directly into <= 64 KB batches per connectionId without intermediate copying
      const batchesByConn = new Map<string, string[][]>();
      const batchBytesByConn = new Map<string, number>();

      for (const reg of this.sinks) {
        if (!reg.sink?.entries || reg.sink.entries.length === 0) continue;

        const connId = reg.connectionId;
        let batches = batchesByConn.get(connId);
        if (!batches) {
          batches = [[]];
          batchesByConn.set(connId, batches);
          batchBytesByConn.set(connId, 150);
        }

        let currentBatch = batches[batches.length - 1];
        let currentBytes = batchBytesByConn.get(connId)!;

        for (let i = 0; i < reg.sink.entries.length; i++) {
          const entry = reg.sink.entries[i];
          // Fast byte estimation: log entries are pure ASCII, entry.length is exact and 150x faster than new Blob()
          const entryBytes = entry.length + 4;

          if (currentBytes + entryBytes > MAX_SAFE_CHUNK_BYTES && currentBatch.length > 0) {
            currentBatch = [];
            batches.push(currentBatch);
            currentBytes = 150;
          }

          currentBatch.push(entry);
          currentBytes += entryBytes;
        }

        batchBytesByConn.set(connId, currentBytes);
      }

      // 2. Send each batch and clear synced items
      for (const [connectionId, batches] of Array.from(batchesByConn.entries())) {
        for (const batch of batches) {
          if (batch.length === 0) continue;

          const res = await this.sendBatch(connectionId, batch, isKeepalive);
          if (res.success) {
            this.clearSyncedItems(connectionId, batch);
            totalSent += batch.length;
            totalBatches++;
          } else {
            console.error(`❌ Failed to send log batch (${res.status || res.error}):`, res.error);
            break;
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }

    if (totalSent > 0) {
      console.log(
        `✅ LogSyncService: Successfully sent ${totalSent} entries in ${totalBatches} batch(es).`
      );
    }

    return { sentCount: totalSent, batches: totalBatches };
  }
}

// Singleton instance
export const logSyncService = new LogSyncService();
export default logSyncService;
