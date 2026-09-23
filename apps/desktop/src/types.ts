export type ItemType = "file" | "folder" | "image" | "url" | "text";

export interface PoqitItem {
  id: string;
  contextId: string | null;
  type: ItemType;
  title: string;
  sourcePath: string | null;
  sourceUrl: string | null;
  textValue: string | null;
  mimeType: string | null;
  byteSize: number | null;
  createdAt: string;
  isMissing: boolean;
}

export type ShelfScope = "context" | "general" | "recent";
