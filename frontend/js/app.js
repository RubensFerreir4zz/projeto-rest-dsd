document.addEventListener('DOMContentLoaded', () => {
  const authSection = document.getElementById('auth-section');
  const appSection = document.getElementById('app-section');
  const userNavInfo = document.getElementById('user-nav-info');
  const usernameDisplay = document.getElementById('nav-username');
  const userPlanDisplay = document.getElementById('nav-plan');
  const logoutBtn = document.getElementById('btn-logout');

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  const quotaUsedEl = document.getElementById('quota-used');
  const quotaTotalEl = document.getElementById('quota-total');
  const quotaPercentEl = document.getElementById('quota-percent');
  const quotaBarFill = document.getElementById('quota-bar-fill');
  const btnInspectQuotaHateoas = document.getElementById('btn-inspect-quota');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadProgress = document.getElementById('upload-progress');

  const filesContainer = document.getElementById('files-container');
  const searchInput = document.getElementById('search-files');
  const btnRefresh = document.getElementById('btn-refresh');

  const jsonModal = document.getElementById('json-modal');
  const jsonViewer = document.getElementById('json-viewer');
  const modalCloseBtns = document.querySelectorAll('.modal-close');

  const previewModal = document.getElementById('preview-modal');
  const previewContainer = document.getElementById('preview-container');
  const previewTitle = document.getElementById('preview-title');

  const btnConfigServer = document.getElementById('btn-config-server');
  const currentServerUrl = document.getElementById('current-server-url');

  let currentFiles = [];
  let currentUserProfile = null;

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

  function showAuth() {
    authSection.style.display = 'flex';
    appSection.style.display = 'none';
    userNavInfo.style.display = 'none';
    const chatDrawer = document.getElementById('chat-drawer');
    if (chatDrawer) chatDrawer.style.display = 'none';
    ChatClient.disconnect();
  }

  function showDashboard() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    userNavInfo.style.display = 'flex';
    loadUserData();
    loadFiles();
  }

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

  async function loadUserData() {
    try {
      const user = await Api.getProfile();
      currentUserProfile = user;
      initChat(user);

      usernameDisplay.textContent = user.username;
      userPlanDisplay.textContent = user.plan || 'Free';

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
          <div style="display:flex; gap:0.25rem;">
            ${file.protocolo_soap ? `<span class="file-type-pill" style="color:var(--accent-primary);" title="Protocolo: ${file.protocolo_soap}">CERTIFICADO</span>` : ''}
            <span class="file-type-pill">${ext}</span>
          </div>
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
          <button class="btn btn-ghost btn-share-chat" title="Compartilhar no Chat da Equipe">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>Chat</span>
          </button>
          <button class="btn btn-danger-ghost btn-delete" title="Excluir Arquivo">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>

        <div style="display:flex; gap:0.35rem; margin-top:0.45rem;">
          <button class="btn btn-ghost btn-inspect-hateoas" style="flex:1; font-size:0.7rem;" title="Inspecionar hiperlinks HATEOAS">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>HATEOAS</span>
          </button>
          <button class="btn btn-ghost btn-soap-modal" style="flex:1; font-size:0.7rem;" title="Consultar certificado de autenticidade e integridade">
            <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Certificado</span>
          </button>
        </div>
      </div>
    `;

    const btnPreview = card.querySelector('.btn-preview');
    if (btnPreview) {
      btnPreview.addEventListener('click', () => openPreviewModal(file));
    }

    const btnDelete = card.querySelector('.btn-delete');
    btnDelete.addEventListener('click', async () => {
      if (!confirm(`Deseja excluir "${file.original_name}"? A cota será recalculada.`)) return;

      try {
        btnDelete.disabled = true;
        btnDelete.textContent = '...';
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

    const btnHateoas = card.querySelector('.btn-inspect-hateoas');
    btnHateoas.addEventListener('click', () => {
      openJsonModal(`HATEOAS: ${file.original_name}`, file);
    });

    const btnSoap = card.querySelector('.btn-soap-modal');
    btnSoap.addEventListener('click', () => {
      openSoapModal(file);
    });

    const btnShareChat = card.querySelector('.btn-share-chat');
    if (btnShareChat) {
      btnShareChat.addEventListener('click', () => {
        shareFileInChat(file);
      });
    }

    return card;
  }

  async function handleFileUpload(file) {
    if (!file) return;

    uploadProgress.style.display = 'block';
    uploadProgress.textContent = `Enviando "${file.name}"...`;

    try {
      const res = await Api.uploadFile(file);
      showToast(`Upload de "${file.name}" concluído!`, 'success');

      const savedId = (res && res.id) || (res.file && res.file.id);
      if (savedId) {
        uploadProgress.textContent = `Emitindo certificado de autenticidade...`;
        try {
          const cert = await SoapClient.emitirAutenticacao(savedId);
          showToast(`Certificado emitido: ${cert.protocolo}`, 'info');
        } catch (soapErr) {
          console.warn('Erro na emissão automática do certificado:', soapErr);
          showToast(`Arquivo salvo, mas falha ao registrar certificado: ${soapErr.message}`, 'warning');
        }
      }

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
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
      }
      previewContainer.innerHTML = '';
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        previewContainer.innerHTML = '';
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(modal => modal.classList.remove('active'));
      previewContainer.innerHTML = '';
    }
  });

  btnInspectQuotaHateoas.addEventListener('click', () => {
    if (currentUserProfile) {
      openJsonModal('HATEOAS: Perfil & Cota do Usuário', currentUserProfile);
    }
  });

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

  const soapModal = document.getElementById('soap-modal');
  const soapDisplayFilename = document.getElementById('soap-display-filename');
  const soapDisplayProtocolo = document.getElementById('soap-display-protocolo');
  const soapDisplayHash = document.getElementById('soap-display-hash');
  const soapDisplayData = document.getElementById('soap-display-data');
  const soapDisplayStatus = document.getElementById('soap-display-status');

  const soapBtnAuditarSucesso = document.getElementById('soap-btn-auditar-sucesso');
  const soapBtnAuditarFalha = document.getElementById('soap-btn-auditar-falha');
  const soapBtnEmitirAgora = document.getElementById('soap-btn-emitir-agora');

  const soapOutputContainer = document.getElementById('soap-output-container');
  const soapStatusAlert = document.getElementById('soap-status-alert');
  const soapXmlViewer = document.getElementById('soap-xml-viewer');

  let currentSoapFile = null;

  function openSoapModal(file) {
    currentSoapFile = file;
    soapDisplayFilename.textContent = file.original_name;
    soapDisplayProtocolo.textContent = file.protocolo_soap || 'Não emitido';
    soapDisplayHash.textContent = file.hash_sha256 || 'Aguardando registro notarial';
    soapDisplayData.textContent = file.autenticado_em ? new Date(file.autenticado_em).toLocaleString('pt-BR') : (file.created_at ? new Date(file.created_at).toLocaleString('pt-BR') : '-');

    if (file.protocolo_soap) {
      soapDisplayStatus.textContent = 'REGISTRADO';
      soapDisplayStatus.style.color = '#10b981';
      soapBtnEmitirAgora.style.display = 'none';
      soapBtnAuditarSucesso.style.display = 'block';
      soapBtnAuditarFalha.style.display = 'block';
    } else {
      soapDisplayStatus.textContent = 'PENDENTE';
      soapDisplayStatus.style.color = '#f59e0b';
      soapBtnEmitirAgora.style.display = 'block';
      soapBtnAuditarSucesso.style.display = 'none';
      soapBtnAuditarFalha.style.display = 'none';
    }

    soapOutputContainer.style.display = 'none';
    soapModal.classList.add('active');
  }

  soapBtnEmitirAgora.addEventListener('click', async () => {
    if (!currentSoapFile) return;
    soapBtnEmitirAgora.disabled = true;
    soapBtnEmitirAgora.textContent = 'Emitindo Certificado...';

    try {
      const resp = await SoapClient.emitirAutenticacao(currentSoapFile.id);
      currentSoapFile.protocolo_soap = resp.protocolo;
      currentSoapFile.hash_sha256 = resp.hashSha256;
      currentSoapFile.autenticado_em = resp.timestampUtc;

      openSoapModal(currentSoapFile);
      soapStatusAlert.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
      soapStatusAlert.style.color = '#10b981';
      soapStatusAlert.innerHTML = `<strong>Certificado Emitido com Sucesso:</strong> Protocolo <code>${resp.protocolo}</code>`;
      soapXmlViewer.textContent = resp.rawResponseXml;
      soapOutputContainer.style.display = 'block';

      showToast('Certificado emitido com sucesso!', 'success');
      loadFiles();
    } catch (err) {
      soapStatusAlert.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      soapStatusAlert.style.color = '#ef4444';
      soapStatusAlert.innerHTML = `<strong>Falha na Emissão (${err.faultCode || 'Fault'}):</strong> ${err.message}`;
      soapXmlViewer.textContent = err.rawXml || err.message;
      soapOutputContainer.style.display = 'block';
      showToast('Falha na emissão do certificado: ' + err.message, 'error');
    } finally {
      soapBtnEmitirAgora.disabled = false;
      soapBtnEmitirAgora.textContent = 'Emitir Certificado de Autenticidade';
    }
  });

  soapBtnAuditarSucesso.addEventListener('click', async () => {
    if (!currentSoapFile) return;
    soapBtnAuditarSucesso.disabled = true;
    soapBtnAuditarSucesso.textContent = 'Verificando Integridade...';

    try {
      const resp = await SoapClient.validarIntegridade(currentSoapFile.id);
      soapStatusAlert.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
      soapStatusAlert.style.color = '#10b981';
      soapStatusAlert.innerHTML = `<strong>Verificação Concluída:</strong> ${resp.mensagem}`;
      soapXmlViewer.textContent = resp.rawResponseXml;
      soapOutputContainer.style.display = 'block';
      showToast('Integridade confirmada com sucesso!', 'success');
    } catch (err) {
      soapStatusAlert.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      soapStatusAlert.style.color = '#ef4444';
      soapStatusAlert.innerHTML = `<strong>Alerta de Integridade (${err.faultCode || 'Fault'}):</strong> ${err.message}`;
      soapXmlViewer.textContent = err.rawXml || err.message;
      soapOutputContainer.style.display = 'block';
      showToast('Falha de integridade: ' + err.message, 'error');
    } finally {
      soapBtnAuditarSucesso.disabled = false;
      soapBtnAuditarSucesso.textContent = 'Verificar Integridade';
    }
  });

  soapBtnAuditarFalha.addEventListener('click', async () => {
    if (!currentSoapFile) return;
    soapBtnAuditarFalha.disabled = true;
    soapBtnAuditarFalha.textContent = 'Executando Teste de Falha...';

    try {
      await SoapClient.validarIntegridade(currentSoapFile.id, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
      showToast('Atenção: A chamada deveria ter falhado com SOAP Fault!', 'warning');
    } catch (err) {
      soapStatusAlert.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      soapStatusAlert.style.color = '#ef4444';
      soapStatusAlert.innerHTML = `<strong>Falha de Integridade Detectada (${err.faultCode || 'Fault'}):</strong> ${err.message}`;
      soapXmlViewer.textContent = err.rawXml || err.message;
      soapOutputContainer.style.display = 'block';
      showToast('Violação detectada via SOAP Fault!', 'error');
    } finally {
      soapBtnAuditarFalha.disabled = false;
      soapBtnAuditarFalha.textContent = 'Simular Adulteração (Teste de Falha)';
    }
  });

  const chatDrawer = document.getElementById('chat-drawer');
  const chatHeaderBar = document.getElementById('chat-header-bar');
  const chatStatusDot = document.getElementById('chat-status-dot');
  const chatHeaderTitle = document.getElementById('chat-header-title');
  const chatUnreadBadge = document.getElementById('chat-unread-badge');

  const chatTabGlobal = document.getElementById('chat-tab-global');
  const chatTabUsers = document.getElementById('chat-tab-users');
  const chatOnlineCountLabel = document.getElementById('chat-online-count-label');

  const chatDmBar = document.getElementById('chat-dm-bar');
  const chatDmTargetName = document.getElementById('chat-dm-target-name');
  const chatDmBackBtn = document.getElementById('chat-dm-back-btn');

  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatUsersContainer = document.getElementById('chat-users-container');

  const chatBtnAttach = document.getElementById('chat-btn-attach');
  const chatInputText = document.getElementById('chat-input-text');
  const chatBtnSend = document.getElementById('chat-btn-send');

  const chatShareModal = document.getElementById('chat-share-modal');
  const chatShareFilesList = document.getElementById('chat-share-files-list');

  let activeChatRoom = 'global'; // 'global' ou 'direct'
  let activeDirectUser = null;   // { id, username }
  let activeChatTab = 'messages'; // 'messages' ou 'users'
  let chatUnreadCount = 0;
  let chatMessagesList = [];
  let chatOnlineUsers = [];
  let chatInitialized = false;

  function initChat(user) {
    if (!user || !user.id) return;
    chatDrawer.style.display = 'flex';

    if (!chatInitialized) {
      chatInitialized = true;
      setupChatEventListeners();
    }

    ChatClient.connect(user);
  }

  function setupChatEventListeners() {
    chatHeaderBar.addEventListener('click', () => {
      toggleChatDrawer();
    });

    chatTabGlobal.addEventListener('click', () => {
      switchChatTab('global');
    });

    chatTabUsers.addEventListener('click', () => {
      switchChatTab('users');
    });

    chatDmBackBtn.addEventListener('click', () => {
      switchChatTab('global');
    });

    chatBtnSend.addEventListener('click', () => {
      sendChatMessage();
    });

    chatInputText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendChatMessage();
      }
    });

    chatBtnAttach.addEventListener('click', () => {
      openShareFileModal();
    });

    window.addEventListener('chat:status', (e) => {
      if (e.detail.connected) {
        chatStatusDot.classList.add('online');
        chatStatusDot.title = 'Conectado ao WebSocket';
      } else {
        chatStatusDot.classList.remove('online');
        chatStatusDot.title = 'Desconectado do WebSocket';
      }
    });

    window.addEventListener('chat:presence', (e) => {
      chatOnlineUsers = e.detail || [];
      const othersCount = chatOnlineUsers.filter(u => u.id !== currentUserProfile?.id).length;
      chatOnlineCountLabel.textContent = `Pessoas (${othersCount})`;
      if (activeChatTab === 'users') {
        renderOnlineUsers();
      }
    });

    window.addEventListener('chat:history', (e) => {
      if (e.detail && e.detail.messages) {
        chatMessagesList = e.detail.messages;
        if (activeChatTab === 'messages' && activeChatRoom === 'global') {
          renderChatMessages();
        }
      }
    });

    window.addEventListener('chat:message', (e) => {
      const msg = e.detail;
      chatMessagesList.push(msg);

      const isDrawerOpen = chatDrawer.classList.contains('open');
      const isCurrentContext = (activeChatRoom === 'global' && msg.target === 'global') ||
        (activeChatRoom === 'direct' && activeDirectUser && (
          (msg.sender_id === activeDirectUser.id && msg.target_user_id === currentUserProfile?.id) ||
          (msg.sender_id === currentUserProfile?.id && msg.target_user_id === activeDirectUser.id)
        ));

      if (!isDrawerOpen || !isCurrentContext) {
        chatUnreadCount++;
        chatUnreadBadge.textContent = chatUnreadCount;
        chatUnreadBadge.style.display = 'inline-block';
        if (msg.sender_id !== currentUserProfile?.id) {
          showToast(`Nova mensagem de ${msg.sender_name} no chat!`, 'info');
        }
      }

      if (isCurrentContext && activeChatTab === 'messages') {
        renderChatMessages();
      }
    });
  }

  function toggleChatDrawer() {
    const isNowOpen = chatDrawer.classList.toggle('open');
    if (isNowOpen) {
      chatUnreadCount = 0;
      chatUnreadBadge.style.display = 'none';
      if (activeChatTab === 'messages') {
        renderChatMessages();
      } else {
        renderOnlineUsers();
      }
      setTimeout(() => chatInputText.focus(), 150);
    }
  }

  function switchChatTab(tab) {
    if (tab === 'global') {
      activeChatRoom = 'global';
      activeDirectUser = null;
      activeChatTab = 'messages';

      chatTabGlobal.classList.add('active');
      chatTabUsers.classList.remove('active');
      chatDmBar.classList.remove('active');
      chatHeaderTitle.textContent = '# Geral (Broadcast)';

      chatMessagesContainer.style.display = 'flex';
      chatUsersContainer.classList.remove('active');
      renderChatMessages();
    } else if (tab === 'users') {
      activeChatTab = 'users';

      chatTabUsers.classList.add('active');
      chatTabGlobal.classList.remove('active');
      chatDmBar.classList.remove('active');
      chatHeaderTitle.textContent = 'Colegas Online';

      chatMessagesContainer.style.display = 'none';
      chatUsersContainer.classList.add('active');
      renderOnlineUsers();
    }
  }

  function openDirectChat(user) {
    activeChatRoom = 'direct';
    activeDirectUser = user;
    activeChatTab = 'messages';

    chatTabGlobal.classList.remove('active');
    chatTabUsers.classList.remove('active');
    chatDmBar.classList.add('active');
    chatDmTargetName.textContent = user.username;
    chatHeaderTitle.textContent = `@${user.username}`;

    chatMessagesContainer.style.display = 'flex';
    chatUsersContainer.classList.remove('active');
    renderChatMessages();

    if (!chatDrawer.classList.contains('open')) {
      toggleChatDrawer();
    }
  }

  function renderOnlineUsers() {
    chatUsersContainer.innerHTML = '';
    const otherUsers = chatOnlineUsers.filter(u => u.id !== currentUserProfile?.id);

    if (otherUsers.length === 0) {
      chatUsersContainer.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-tertiary); font-size:0.75rem;">
          Nenhum outro colega online no momento.<br>Abra outra aba para simular um segundo usuário!
        </div>
      `;
      return;
    }

    otherUsers.forEach(u => {
      const row = document.createElement('div');
      row.className = 'chat-user-row';
      const initial = (u.username || 'U').charAt(0).toUpperCase();

      row.innerHTML = `
        <div class="chat-user-info">
          <div class="chat-user-avatar">${initial}</div>
          <div>
            <div style="font-weight:600; font-size:0.775rem; color:var(--text-primary);">${escapeHtml(u.username)}</div>
            <div style="font-size:0.65rem; color:#10b981; display:flex; align-items:center; gap:0.25rem;">
              <span class="status-dot online" style="width:6px; height:6px;"></span> Online
            </div>
          </div>
        </div>
        <button class="btn btn-secondary btn-chat-direct" style="font-size:0.675rem; padding:0.25rem 0.5rem;">
          Conversar
        </button>
      `;

      row.querySelector('.btn-chat-direct').addEventListener('click', () => {
        openDirectChat(u);
      });

      chatUsersContainer.appendChild(row);
    });
  }

  function renderChatMessages() {
    chatMessagesContainer.innerHTML = '';

    const filtered = chatMessagesList.filter(m => {
      if (activeChatRoom === 'global') {
        return m.target === 'global';
      }
      if (activeChatRoom === 'direct' && activeDirectUser) {
        return m.target === 'direct' && (
          (m.sender_id === currentUserProfile?.id && Number(m.target_user_id) === Number(activeDirectUser.id)) ||
          (Number(m.sender_id) === Number(activeDirectUser.id) && Number(m.target_user_id) === Number(currentUserProfile?.id))
        );
      }
      return false;
    });

    if (filtered.length === 0) {
      chatMessagesContainer.innerHTML = `
        <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-tertiary); font-size:0.75rem;">
          ${activeChatRoom === 'global' ? 'Canal Geral da Equipe (Broadcast). Envie uma mensagem ou compartilhe um arquivo!' : `Inicie uma conversa direta 1-para-1 com @${activeDirectUser?.username}!`}
        </div>
      `;
      return;
    }

    filtered.forEach(m => {
      const isMine = m.sender_id === currentUserProfile?.id;
      const bubble = document.createElement('div');
      bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;

      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

      let fileHtml = '';
      if (m.file) {
        const downloadUrl = `${Api.getBaseUrl()}/api/drive/files/${m.file.id}/download/`;
        fileHtml = `
          <div class="chat-file-card">
            <div class="chat-file-header">
              <svg class="icon icon-sm" viewBox="0 0 24 24" style="color:var(--accent-primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span class="chat-file-name" title="${escapeHtml(m.file.original_name)}">${escapeHtml(m.file.original_name)}</span>
            </div>
            <div class="chat-file-meta">
              <span>${m.file.size_mb || (m.file.size_bytes ? (m.file.size_bytes / (1024*1024)).toFixed(2) : '0')} MB</span>
              ${m.file.protocolo_soap ? `<span class="file-type-pill" style="color:var(--accent-primary); font-size:0.575rem;" title="Protocolo: ${m.file.protocolo_soap}">CERTIFICADO</span>` : ''}
            </div>
            <div class="chat-file-actions">
              <a href="${downloadUrl}" target="_blank" class="chat-file-btn chat-file-btn-download">
                Baixar
              </a>
              <button class="chat-file-btn chat-file-btn-save" data-file-id="${m.file.id}" ${isMine ? 'title="Você é o proprietário (clique para duplicar)"' : 'title="Copiar para o seu Drive"'}>
                <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                <span>${isMine ? 'Salvar Cópia' : 'Salvar no Drive'}</span>
              </button>
            </div>
          </div>
        `;
      }

      bubble.innerHTML = `
        <div class="chat-bubble-sender">
          <span>${isMine ? 'Você' : escapeHtml(m.sender_name)}</span>
          <span class="chat-bubble-time">${timeStr}</span>
        </div>
        ${m.text ? `<div>${escapeHtml(m.text)}</div>` : ''}
        ${fileHtml}
      `;

      const saveBtn = bubble.querySelector('.chat-file-btn-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          saveBtn.disabled = true;
          saveBtn.innerHTML = '<span>Salvando...</span>';
          try {
            await Api.copyFileToMe(m.file.id);
            showToast(`Arquivo "${m.file.original_name}" salvo no seu Drive com sucesso!`, 'success');
            saveBtn.innerHTML = '<span>Salvo no Drive</span>';
            saveBtn.style.background = 'var(--bg-surface-elevated)';
            saveBtn.style.color = 'var(--text-secondary)';
            loadUserData();
            loadFiles();
          } catch (err) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
              <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              <span>Salvar no Drive</span>
            `;
            showToast('Erro ao salvar no seu Drive: ' + err.message, 'error');
          }
        });
      }

      chatMessagesContainer.appendChild(bubble);
    });

    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function sendChatMessage() {
    const text = chatInputText.value.trim();
    if (!text) return;

    try {
      ChatClient.sendMessage(
        text,
        activeChatRoom,
        activeDirectUser ? activeDirectUser.id : null,
        activeDirectUser ? activeDirectUser.username : null
      );
      chatInputText.value = '';
    } catch (err) {
      showToast(err.message, 'warning');
    }
  }

  function shareFileInChat(file) {
    if (!file || !file.id) return;
    if (!chatDrawer.classList.contains('open')) {
      toggleChatDrawer();
    }

    try {
      ChatClient.shareFile(
        file,
        '',
        activeChatRoom,
        activeDirectUser ? activeDirectUser.id : null,
        activeDirectUser ? activeDirectUser.username : null
      );
      showToast(`Arquivo "${file.original_name}" compartilhado no chat!`, 'info');
    } catch (err) {
      showToast(err.message, 'warning');
    }
  }

  function openShareFileModal() {
    chatShareFilesList.innerHTML = '';

    if (!currentFiles || currentFiles.length === 0) {
      chatShareFilesList.innerHTML = `
        <div style="text-align:center; padding:1.5rem; color:var(--text-secondary); font-size:0.8rem;">
          Você não possui arquivos no seu Drive para compartilhar.
        </div>
      `;
      chatShareModal.classList.add('active');
      return;
    }

    currentFiles.forEach(f => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius-sm); cursor:pointer;';
      item.innerHTML = `
        <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:280px;">
          <div style="font-weight:600; font-size:0.8rem; color:var(--text-primary);">${escapeHtml(f.original_name)}</div>
          <div style="font-size:0.7rem; color:var(--text-secondary);">${f.size_mb || (f.size_bytes / (1024*1024)).toFixed(2)} MB</div>
        </div>
        <button class="btn btn-primary" style="font-size:0.7rem; padding:0.25rem 0.6rem;">
          Compartilhar
        </button>
      `;

      item.addEventListener('click', () => {
        chatShareModal.classList.remove('active');
        shareFileInChat(f);
      });

      chatShareFilesList.appendChild(item);
    });

    chatShareModal.classList.add('active');
  }

  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
      }
    });
  }

  init();
});
