export class Emitter<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<(payload: any) => void>>();

  on<K extends keyof T>(type: K, fn: (payload: T[K]) => void): () => void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(fn as any);
    this.listeners.set(type, set);
    return () => set.delete(fn as any);
  }

  emit<K extends keyof T>(type: K, payload: T[K]) {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const fn of set) fn(payload);
  }
}
