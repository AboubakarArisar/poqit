import type { ItemType, PoqitItem, ShelfScope } from "../types";
import { isTauri } from "./runtime";

const DB_URL = "sqlite:poqit.db";
const STORAGE_KEY = "poqit.items.v1";

type NewItem = Pick<PoqitItem, "type" | "title"> & Partial<PoqitItem>;

function rowToItem(row: Record<string, unknown>): PoqitItem {
  return {
    id: String(row.id), contextId: row.context_id ? String(row.context_id) : null,
    type: String(row.type) as ItemType, title: String(row.title),
    sourcePath: row.source_path ? String(row.source_path) : null,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    textValue: row.text_value ? String(row.text_value) : null,
    mimeType: row.mime_type ? String(row.mime_type) : null,
    byteSize: typeof row.byte_size === "number" ? row.byte_size : null,
    createdAt: String(row.created_at), isMissing: Number(row.is_missing) === 1
  };
}

class Repository {
  private database: import("@tauri-apps/plugin-sql").default | null = null;

  private async db() {
    if (!this.database) {
      const { default: Database } = await import("@tauri-apps/plugin-sql");
      this.database = await Database.load(DB_URL);
    }
    return this.database;
  }

  async list(scope: ShelfScope): Promise<PoqitItem[]> {
    if (!isTauri()) {
      const items = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as PoqitItem[];
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const database = await this.db();
    const where = scope === "general" ? "WHERE context_id IS NULL" : "";
    const rows = await database.select<Record<string, unknown>[]>(`SELECT * FROM items ${where} ORDER BY created_at DESC LIMIT 250`);
    return rows.map(rowToItem);
  }

  async add(input: NewItem): Promise<PoqitItem> {
    const item: PoqitItem = {
      id: crypto.randomUUID(), contextId: input.contextId ?? null, type: input.type,
      title: input.title.trim() || "Untitled item", sourcePath: input.sourcePath ?? null,
      sourceUrl: input.sourceUrl ?? null, textValue: input.textValue ?? null,
      mimeType: input.mimeType ?? null, byteSize: input.byteSize ?? null,
      createdAt: new Date().toISOString(), isMissing: false
    };
    if (!isTauri()) {
      const items = await this.list("recent");
      localStorage.setItem(STORAGE_KEY, JSON.stringify([item, ...items.filter(existing => existing.id !== item.id)]));
      return item;
    }
    const database = await this.db();
    await database.execute(
      `INSERT INTO items (id, context_id, type, title, source_path, source_url, text_value, mime_type, byte_size, created_at, is_missing)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,0)
       ON CONFLICT(source_path) WHERE source_path IS NOT NULL
       DO UPDATE SET created_at = excluded.created_at, is_missing = 0`,
      [item.id,item.contextId,item.type,item.title,item.sourcePath,item.sourceUrl,item.textValue,item.mimeType,item.byteSize,item.createdAt]
    );
    return item;
  }

  async remove(id: string): Promise<void> {
    if (!isTauri()) {
      const items = await this.list("recent");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter(item => item.id !== id)));
      return;
    }
    await (await this.db()).execute("DELETE FROM items WHERE id = $1", [id]);
  }

  async close(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }
}

export const repository = new Repository();
