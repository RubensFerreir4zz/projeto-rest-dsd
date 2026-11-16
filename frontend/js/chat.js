const ChatClient = {
  socket: null,
  currentUser: null,
  reconnectTimer: null,
  isConnected: false,

  getWsUrl() {
    const saved = localStorage.getItem('ws_url');
    if (saved) return saved;

    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol.startsWith('http')) {
      return `ws://${window.location.hostname}:8004/`;
    }
    return 'ws://127.0.0.1:8004/';
  },

  connect(user) {
    if (!user || !user.id) return;
    this.currentUser = user;

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.getWsUrl());

      this.socket.onopen = () => {
        this.isConnected = true;
        this._updateStatus(true);
        this.socket.send(JSON.stringify({
          type: 'join',
          user_id: user.id,
          username: user.username
        }));
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._handleIncomingMessage(data);
        } catch (e) {
          console.warn('Erro ao processar mensagem WebSocket:', e);
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this._updateStatus(false);
        if (Api.getToken()) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = setTimeout(() => this.connect(this.currentUser), 4000);
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket error:', err);
      };
    } catch (err) {
      console.error('Falha ao instanciar conexão WebSocket:', err);
    }
  },

  disconnect() {
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
    this._updateStatus(false);
  },

  sendMessage(text, target = 'global', targetUserId = null, targetUsername = null) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Chat desconectado do servidor WebSocket.');
    }

    const payload = {
      type: 'chat_message',
      target: target,
      target_user_id: targetUserId,
      target_username: targetUsername,
      text: text
    };

    this.socket.send(JSON.stringify(payload));
  },

  shareFile(fileObj, text = '', target = 'global', targetUserId = null, targetUsername = null) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('Chat desconectado do servidor WebSocket.');
    }

    const payload = {
      type: 'file_share',
      target: target,
      target_user_id: targetUserId,
      target_username: targetUsername,
      text: text,
      file: {
        id: fileObj.id,
        original_name: fileObj.original_name,
        size_bytes: fileObj.size_bytes,
        size_mb: fileObj.size_mb,
        content_type: fileObj.content_type,
        hash_sha256: fileObj.hash_sha256 || '',
        protocolo_soap: fileObj.protocolo_soap || ''
      }
    };

    this.socket.send(JSON.stringify(payload));
  },

  _handleIncomingMessage(data) {
    if (data.type === 'presence') {
      window.dispatchEvent(new CustomEvent('chat:presence', { detail: data.online_users }));
    } else if (data.type === 'history') {
      window.dispatchEvent(new CustomEvent('chat:history', { detail: data }));
    } else if (data.type === 'chat_message' || data.type === 'file_share') {
      window.dispatchEvent(new CustomEvent('chat:message', { detail: data }));
    }
  },

  _updateStatus(connected) {
    window.dispatchEvent(new CustomEvent('chat:status', { detail: { connected } }));
  }
};