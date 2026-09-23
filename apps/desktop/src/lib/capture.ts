import { invoke } from "@tauri-apps/api/core";
import { repository } from "./repository";
import type { ItemType } from "../types";

interface InspectedPath {
  type: ItemType;
  title: string;
  sourcePath: string;
  byteSize: number | null;
}

export async function capturePaths(paths: string[]): Promise<void> {
  for (const path of paths) {
    const item = await invoke<InspectedPath>("inspect_path", { path });
    await repository.add(item);
  }
}
