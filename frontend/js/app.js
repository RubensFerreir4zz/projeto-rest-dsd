/**
 * Aplicação Principal do Cliente Web (Front-end)
 * Controla a interface, os eventos de upload, visualização de mídia e modais HATEOAS.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Referências DOM
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const userNavInfo = document.getElementById('user-nav-info');
  const usernameDisplay = document.getElementById('nav-username');
  const userPlanDisplay = document.getElementById('nav-plan');
  const logoutBtn = document.getElementById('btn-logout');

  // Abas de Auth
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  // Painel de Cota
  const quotaUsedEl = document.getElementById('quota-used');
  const quotaTotalEl = document.getElementById('quota-total');
  const quotaPercentEl = document.getElementById('quota-percent');
  const quotaBarFill = document.getElementById('quota-bar-fill');
  const btnInspectQuotaHateoas = document.getElementById('btn-inspect-quota');

  // Upload
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadProgress = document.getElementById('upload-progress');

  // Lista de Arquivos
  const filesContainer = document.getElementById('files-container');
  const searchInput = document.getElementById('search-files');
  const btnRefresh = document.getElementById('btn-refresh');

  // Modais
  const jsonModal = document.getElementById('json-modal');
  const jsonViewer = document.getElementById('json-viewer');
  const modalCloseBtns = document.querySelectorAll('.modal-close');

  const previewModal = document.getElementById('preview-modal');
  const previewContainer = document.getElementById('preview-container');
  const previewTitle = document.getElementById('preview-title');

  // Configuração do Gateway
  const btnConfigServer = document.getElementById('btn-config-server');
  const currentServerUrl = document.getElementById('current-server-url');

  let currentFiles = [];
  let currentUserProfile = null;

  // --- Inicialização ---

  function init() {
    updateServerBadge();
    const token = Api.getToken();
    if (token) {
      showDashboard();
    } else {
      showAuth();
    }
  }

  function updateServerBadge() {
    if (currentServerUrl) {
      currentServerUrl.textContent = Api.getBaseUrl();
    }
  }

  // --- Telas (Auth vs Dashboard) ---

  function showAuth() {
    authSection.style.display = 'flex';
    appSection.style.display = 'none';
    userNavInfo.style.display = 'none';
  }

  function showDashboard() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    userNavInfo.style.display = 'flex';
    loadUserData();
    loadFiles();
  }

  // --- Toasts de Notificação ---

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Carregamento de Dados ---

  async function loadUserData() {
    try {
      const user = await Api.getProfile();
      currentUserProfile = user;

      usernameDisplay.textContent = user.username;
      userPlanDisplay.textContent = user.plan || 'Free';

      // Atualiza a Cota
      const usedMb = (user.storage_used / (1024 * 1024)).toFixed(2);
      const totalMb = (user.storage_limit / (1024 * 1024)).toFixed(1);
      const percent = Math.min(100, Math.round((user.storage_used / user.storage_limit) * 100));

      quotaUsedEl.textContent = `${usedMb} MB`;
      quotaTotalEl.textContent = `de ${totalMb} MB`;
      quotaPercentEl.textContent = `${percent}%`;

      quotaBarFill.style.width = `${percent}%`;
      if (percent > 85) {
        quotaBarFill.classList.add('warning');
      } else {
        quotaBarFill.classList.remove('warning');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function loadFiles() {
    filesContainer.innerHTML = '<div class="empty-state"><p>Carregando arquivos...</p></div>';
    try {
      const files = await Api.listFiles();
      currentFiles = files;
      renderFiles(files);
    } catch (err) {
      filesContainer.innerHTML = `<div class="empty-state"><p style="color:var(--danger)">Erro ao carregar arquivos: ${err.message}</p></div>`;
    }
  }

  // --- Renderização de Arquivos ---

  function renderFiles(files) {
    if (!files || files.length === 0) {
      filesContainer.innerHTML = `
        <div class="empty-state">
          <svg class="icon icon-xl" viewBox="0 0 24 24" style="margin-bottom:0.75rem;">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>Nenhum arquivo armazenado</h3>
          <p>Arraste um arquivo para o painel de upload acima para começar.</p>
        </div>
      `;
      return;
    }

    filesContainer.innerHTML = '';
    files.forEach(file => {
      const card = createFileCard(file);
      filesContainer.appendChild(card);
    });
  }

  function createFileCard(file) {
    const card = document.createElement('div');
    card.className = 'file-card';

    const isImage = file.content_type && file.content_type.startsWith('image/');
    const isAudio = file.content_type && file.content_type.startsWith('audio/');
    const isPdf = file.content_type && file.content_type.includes('pdf');
    const isVideo = file.content_type && file.content_type.startsWith('video/');

    // Pega a extensão do arquivo (ex: PDF, PNG, MP3)
    const ext = file.original_name.includes('.') 
      ? file.original_name.split('.').pop().toUpperCase() 
      : 'ARQ';

    let fileIconSvg = `
      <svg class="icon" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    `;

    if (isImage) {
      fileIconSvg = `
        <svg class="icon" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      `;
    } else if (isAudio) {
      fileIconSvg = `
        <svg class="icon" viewBox="0 0 24 24">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
      `;
    } else if (isVideo) {
      fileIconSvg = `
        <svg class="icon" viewBox="0 0 24 24">
          <polygon points="23 7 16 12 23 17 23 7"/>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
        </svg>
      `;
    }

    const dateFormatted = new Date(file.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const downloadUrl = file._links && file._links.download ? Api.getDownloadUrl(file._links.download) : '#';

    card.innerHTML = `
      <div>
        <div class="file-card-top">
          <div class="file-icon-box">
            ${fileIconSvg}
          </div>
          <span class="file-type-pill">${ext}</span>
        </div>

        <div class="file-name-text" title="${file.original_name}">${file.original_name}</div>
        <div class="file-info-row">
          <span>${file.size_mb} MB</span>
          <span>${dateFormatted}</span>
        </div>
      </div>

      <div>
        <div class="file-card-actions">
          ${(isImage || isAudio || isPdf) ? `
            <button class="btn btn-ghost btn-preview" title="Visualizar">
              <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Ver</span>
            </button>
          ` : ''}
          <a href="${downloadUrl}" class="btn btn-ghost" title="Baixar">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Baixar</span>
          </a>
          <button class="btn btn-danger-ghost btn-delete" title="Excluir Arquivo">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>

        <button class="btn btn-ghost btn-inspect-hateoas" style="margin-top:0.45rem; width:100%; font-size:0.725rem;" title="Inspecionar hiperlinks HATEOAS">
          <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span>HATEOAS JSON</span>
        </button>
      </div>
    `;

    // Evento de Visualização (Preview)
    const btnPreview = card.querySelector('.btn-preview');
    if (btnPreview) {
      btnPreview.addEventListener('click', () => openPreviewModal(file));
    }

    // Evento de Exclusão (executa diretamente a ação do HATEOAS _links.delete)
    const btnDelete = card.querySelector('.btn-delete');
    btnDelete.addEventListener('click', async () => {
      if (!confirm(`Deseja excluir "${file.original_name}"? A cota será recalculada.`)) return;

      try {
        btnDelete.disabled = true;
        btnDelete.textContent = '...';
        // Execução HATEOAS pura!
        await Api.executeHateoas(file._links.delete);
        showToast('Arquivo excluído com sucesso!', 'success');
        loadUserData();
        loadFiles();
      } catch (err) {
        showToast(err.message, 'error');
        btnDelete.disabled = false;
        btnDelete.textContent = '🗑️';
      }
    });

    // Evento de Inspecionar HATEOAS do Arquivo
    const btnHateoas = card.querySelector('.btn-inspect-hateoas');
    btnHateoas.addEventListener('click', () => {
      openJsonModal(`HATEOAS: ${file.original_name}`, file);
    });

    return card;
  }

  // --- Upload de Arquivos ---

  async function handleFileUpload(file) {
    if (!file) return;

    uploadProgress.style.display = 'block';
    uploadProgress.textContent = `Enviando "${file.name}"...`;

    try {
      const res = await Api.uploadFile(file);
      showToast(`Arquivo "${file.name}" enviado com sucesso!`, 'success');
      loadUserData();
      loadFiles();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      uploadProgress.style.display = 'none';
      fileInput.value = '';
    }
  }

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  // --- Busca / Filtro ---

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderFiles(currentFiles);
      return;
    }
    const filtered = currentFiles.filter(f => f.original_name.toLowerCase().includes(query));
    renderFiles(filtered);
  });

  btnRefresh.addEventListener('click', () => {
    loadUserData();
    loadFiles();
    showToast('Atualizado!', 'info');
  });

  // --- Modais ---

  function openJsonModal(title, jsonObj) {
    document.getElementById('json-modal-title').textContent = title;
    jsonViewer.textContent = JSON.stringify(jsonObj, null, 2);
    jsonModal.classList.add('active');
  }

  function openPreviewModal(file) {
    previewTitle.textContent = file.original_name;
    previewContainer.innerHTML = '';

    const previewUrl = Api.getPreviewUrl(file._links.preview);

    if (file.content_type && file.content_type.startsWith('image/')) {
      previewContainer.innerHTML = `<img src="${previewUrl}" style="max-width:100%; max-height:70vh; border-radius:8px; display:block; margin:0 auto;" alt="${file.original_name}">`;
    } else if (file.content_type && file.content_type.startsWith('audio/')) {
      previewContainer.innerHTML = `
        <div style="text-align:center; padding: 2.5rem 1rem;">
          <div style="width:56px; height:56px; border-radius:var(--radius-sm); background:var(--bg-app); border:1px solid var(--border-medium); display:inline-flex; align-items:center; justify-content:center; margin-bottom:1.25rem; color:var(--accent-primary);">
            <svg class="icon icon-lg" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
          </div>
          <div>
            <audio controls autoplay style="width:100%; max-width:440px;">
              <source src="${previewUrl}" type="${file.content_type}">
              Seu navegador não suporta o elemento de áudio.
            </audio>
          </div>
        </div>
      `;
    } else if (file.content_type && file.content_type.includes('pdf')) {
      previewContainer.innerHTML = `
        <iframe src="${previewUrl}" style="width:100%; height:70vh; border:none; border-radius:8px;"></iframe>
      `;
    }

    previewModal.classList.add('active');
  }

  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      jsonModal.classList.remove('active');
      previewModal.classList.remove('active');
      previewContainer.innerHTML = '';
    });
  });

  [jsonModal, previewModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        previewContainer.innerHTML = '';
      }
    });
  });

  btnInspectQuotaHateoas.addEventListener('click', () => {
    if (currentUserProfile) {
      openJsonModal('HATEOAS: Perfil & Cota do Usuário', currentUserProfile);
    }
  });

  // --- Autenticação (Login e Cadastro) ---

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formLogin.style.display = 'none';
    formRegister.style.display = 'block';
  });

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;

    const btn = formLogin.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
      const data = await Api.login(email, pass);
      Api.setToken(data.token);
      showToast('Login realizado com sucesso!', 'success');
      showDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar no Drive';
    }
  });

  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const plan = document.getElementById('reg-plan').value;

    const btn = formRegister.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
      const data = await Api.register(user, email, pass, plan);
      Api.setToken(data.token);
      showToast('Conta criada com sucesso!', 'success');
      showDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Criar Conta e Entrar';
    }
  });

  logoutBtn.addEventListener('click', () => {
    Api.removeToken();
    showToast('Você saiu do sistema.', 'info');
    showAuth();
  });

  window.addEventListener('auth:unauthorized', () => {
    showToast('Sessão expirada. Faça login novamente.', 'error');
    showAuth();
  });

  // Configuração do IP do Servidor
  btnConfigServer.addEventListener('click', () => {
    const current = Api.getBaseUrl();
    const newUrl = prompt('Digite o endereço do API Gateway (Porta 8000):', current);
    if (newUrl) {
      Api.setBaseUrl(newUrl);
      updateServerBadge();
      showToast(`Gateway configurado para: ${Api.getBaseUrl()}`, 'success');
      if (Api.getToken()) {
        loadUserData();
        loadFiles();
      }
    }
  });

  // Iniciar
  init();
});
