/**
 * Módulo de Integração com o API Gateway (Porta 8000)
 * Responsável pelas requisições JWT e pelo consumo das ações HATEOAS.
 */

const Api = {
  // Permite configurar ou auto-detectar o IP do servidor em rede local
  getBaseUrl() {
    const saved = localStorage.getItem('gateway_url');
    if (saved) return saved;
    
    // Se acessado por outro aparelho via IP (ex: 192.168.x.x), aponta para o mesmo IP na porta 8000
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol.startsWith('http')) {
      return `http://${window.location.hostname}:8000`;
    }
    return 'http://127.0.0.1:8000';
  },

  setBaseUrl(url) {
    let cleanUrl = url.trim().replace(/\/$/, '');
    localStorage.setItem('gateway_url', cleanUrl);
  },

  getToken() {
    return localStorage.getItem('jwt_token');
  },

  setToken(token) {
    localStorage.setItem('jwt_token', token);
  },

  removeToken() {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_cache');
  },

  getAuthHeaders(isMultipart = false) {
    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  },

  async handleResponse(response) {
    if (response.status === 401) {
      this.removeToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const contentType = response.headers.get('content-type');
    let data = {};
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const errorMsg = data.detail || data.error || (data.storage && data.storage[0]) || JSON.stringify(data) || 'Erro na requisição.';
      throw new Error(errorMsg);
    }

    return data;
  },

  // --- Autenticação ---

  async register(username, email, password, plan = 'free') {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, plan })
    });
    return this.handleResponse(res);
  },

  async login(email, password) {
    const res = await fetch(`${this.getBaseUrl()}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return this.handleResponse(res);
  },

  // --- Perfil e Cota ---

  async getProfile() {
    const res = await fetch(`${this.getBaseUrl()}/api/me/`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(res);
  },

  // --- Arquivos ---

  async listFiles() {
    const res = await fetch(`${this.getBaseUrl()}/api/drive/files/`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(res);
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.getBaseUrl()}/api/drive/files/`, {
      method: 'POST',
      headers: this.getAuthHeaders(true),
      body: formData
    });
    return this.handleResponse(res);
  },

  // --- Execução Dinâmica de HATEOAS ---

  /**
   * Executa uma ação diretamente a partir do objeto _links fornecido pelo Gateway.
   * Exemplo: hateoasLink = { href: "/api/drive/files/5/", method: "DELETE" }
   */
  async executeHateoas(hateoasLink, body = null) {
    if (!hateoasLink || !hateoasLink.href) {
      throw new Error('Link HATEOAS inválido.');
    }

    const fullUrl = hateoasLink.href.startsWith('http')
      ? hateoasLink.href
      : `${this.getBaseUrl()}${hateoasLink.href}`;

    const options = {
      method: hateoasLink.method || 'GET',
      headers: this.getAuthHeaders()
    };

    if (body && options.method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(fullUrl, options);
    return this.handleResponse(res);
  },

  getDownloadUrl(hateoasDownloadLink) {
    if (!hateoasDownloadLink || !hateoasDownloadLink.href) return '#';
    return hateoasDownloadLink.href.startsWith('http')
      ? hateoasDownloadLink.href
      : `${this.getBaseUrl()}${hateoasDownloadLink.href}`;
  },

  getPreviewUrl(hateoasPreviewLink) {
    if (!hateoasPreviewLink || !hateoasPreviewLink.href) return '#';
    return hateoasPreviewLink.href.startsWith('http')
      ? hateoasPreviewLink.href
      : `${this.getBaseUrl()}${hateoasPreviewLink.href}`;
  }
};
