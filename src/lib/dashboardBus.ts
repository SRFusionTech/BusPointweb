/** Tiny in-tab event bus: pages announce data changes so badges / dashboards refresh at once. */
type Handler = () => void;
const handlers = new Map<string, Set<Handler>>();

export const dashboardBus = {
  on(event: string, fn: Handler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(fn);
    return () => handlers.get(event)?.delete(fn);
  },
  emit(event: string): void {
    handlers.get(event)?.forEach((fn) => fn());
  },
};
