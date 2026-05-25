export function createReconnectingSocket(url, { onOpen, onMessage, onClose, onError, maxDelay = 15_000 } = {}) {
  let socket = null;
  let closedByUser = false;
  let reconnectDelay = 750;
  let reconnectTimer = null;

  const connect = () => {
    if (closedByUser) return;
    socket = new WebSocket(url);

    socket.addEventListener('open', (event) => {
      reconnectDelay = 750;
      onOpen?.(event, socket);
    });

    socket.addEventListener('message', (event) => {
      onMessage?.(event, socket);
    });

    socket.addEventListener('error', (event) => {
      onError?.(event, socket);
    });

    socket.addEventListener('close', (event) => {
      onClose?.(event, socket);
      if (closedByUser) return;
      reconnectTimer = window.setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.6, maxDelay);
    });
  };

  connect();

  return {
    get socket() {
      return socket;
    },
    close() {
      closedByUser = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close();
    },
    send(payload) {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    },
  };
}
