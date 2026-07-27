import { useEffect, useRef } from "react";

/**
 * Feature 4 — Real-Time Dashboard.
 *
 * Runs `callback` immediately and then every `intervalMs`, without a page
 * refresh. Pauses while the browser tab is hidden (saves API calls when the
 * user isn't looking) and always cleans up on unmount.
 *
 * Efficient polling was chosen over WebSockets/SSE here because the existing
 * backend is a stateless REST API behind normal HTTP — polling requires zero
 * new infrastructure (no socket server, no reconnect/backoff logic to get
 * wrong) while still delivering the "no manual refresh" requirement. Swapping
 * this hook out for an EventSource/WebSocket-backed one later would not
 * require touching any page that uses it.
 */
export default function usePolling(callback, intervalMs = 4000, deps = []) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (document.hidden) return;
      try {
        await savedCallback.current();
      } catch {
        // individual pages handle their own error toasts; polling just retries next tick
      }
    };

    const schedule = () => {
      timer = setInterval(tick, intervalMs);
    };

    tick();
    schedule();

    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
