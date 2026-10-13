/* A tiny same-origin WebSocket event wrapper. Keeps the UI dependency-free. */
(() => {
  class LiveSocket {
    constructor() {
      this.handlers = new Map();
      this.outbox = [];
      this.connected = false;
      this.closedByUser = false;
      this.retryDelay = 1400;
      this.connect();
    }
    on(event, handler) {
      const list = this.handlers.get(event) || [];
      list.push(handler);
      this.handlers.set(event, list);
      if (event === 'connect' && this.connected) queueMicrotask(() => handler());
      return this;
    }
    emit(event, data) {
      const packet = JSON.stringify({ event, data });
      if (this.connected && this.ws?.readyState === WebSocket.OPEN) {
        try { this.ws.send(packet); } catch { this.outbox.push(packet); }
      } else {
        this.outbox.push(packet);
      }
      return this;
    }
    dispatch(event, data) {
      for (const handler of this.handlers.get(event) || []) {
        try { handler(data); } catch (error) { console.error(`Live event ${event} failed:`, error); }
      }
    }
    connect() {
      if (this.closedByUser) return;
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = location.host || 'localhost:3000';
      let ws;
      try { ws = new WebSocket(`${protocol}//${host}/live`); }
      catch { this.scheduleReconnect(); return; }
      this.ws = ws;
      ws.addEventListener('open', () => {
        this.connected = true;
        const queued = this.outbox.splice(0);
        for (const packet of queued) { try { ws.send(packet); } catch { this.outbox.push(packet); } }
        this.dispatch('connect');
      });
      ws.addEventListener('message', event => {
        try {
          const packet = JSON.parse(event.data);
          if (typeof packet.event === 'string') this.dispatch(packet.event, packet.data);
        } catch { /* Ignore malformed frames. */ }
      });
      ws.addEventListener('close', () => {
        const wasConnected = this.connected;
        this.connected = false;
        if (wasConnected) this.dispatch('disconnect');
        this.scheduleReconnect();
      });
      ws.addEventListener('error', () => { /* close will schedule a reconnect */ });
    }
    scheduleReconnect() {
      if (this.closedByUser) return;
      window.setTimeout(() => { if (!this.connected && !this.closedByUser) this.connect(); }, this.retryDelay);
    }
  }
  window.io = () => new LiveSocket();
})();
