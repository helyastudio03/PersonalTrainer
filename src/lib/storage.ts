import type { AppData } from '../types';
import { emptyAppData } from '../types';

const STORAGE_KEY = 'personal-trainer-data-v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(emptyAppData);
    const parsed = JSON.parse(raw);
    return {
      programs: parsed.programs ?? [],
      strengthSessions: parsed.strengthSessions ?? [],
    };
  } catch {
    return structuredClone(emptyAppData);
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
