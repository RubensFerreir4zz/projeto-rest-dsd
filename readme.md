# SafoDrive - Sistema Distribuído de Armazenamento

**Disciplina:** Desenvolvimento de Sistemas Distribuídos - IFRN  
**Aluno:** Rubens Ferreira Campos Neto  

---

## 📌 Visão Geral

O **SafoDrive** é uma aplicação distribuída baseada em arquitetura de microsserviços para gerenciamento e transmissão de arquivos com autenticação centralizada, hipermídia (HATEOAS) e documentação interativa.

### Arquitetura do Sistema
* **API Gateway (`:8000`)**: Ponto central de entrada, roteamento, validação de tokens JWT, injeção de links HATEOAS e documentação OpenAPI/Swagger.
* **Service Accounts (`:8001`)**: Microsserviço responsável pelo gerenciamento de usuários e autenticação.
* **Service Storage (`:8002`)**: Microsserviço para upload, armazenamento, download e exclusão de arquivos.
* **Cliente Web (`:3000`)**: Interface web intuitiva para acesso aos recursos disponibilizados pelo Gateway.

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** Python, Django, Django REST Framework (DRF)
- **Autenticação:** JWT (JSON Web Tokens)
- **Documentação:** OpenAPI 3 / Swagger (`drf-spectacular`)
- **Padrões:** REST, HATEOAS, API Gateway Pattern
- **Frontend:** HTML5, CSS3, JavaScript

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Python 3.10+
- Ambiente virtual configurado e dependências instaladas:
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2. Migrações do Banco de Dados (se necessário)
```bash
python backend/service_accounts/manage.py migrate
python backend/service_storage/manage.py migrate
python backend/gateway/manage.py migrate
```

### 3. Inicialização Rápida
Execute o script PowerShell para iniciar todos os serviços simultaneamente:
```powershell
.\run_servers.ps1
```

O script inicializará automaticamente:
1. `Service Accounts` em `http://127.0.0.1:8001`
2. `Service Storage` em `http://127.0.0.1:8002`
3. `Service Soap` em `http://127.0.0.1:8003`
4. `Service Chat` em `htpp:/127.0.0.1:8004`
3. `API Gateway` em `http://127.0.0.1:8000`
4. `Cliente Web` em `http://127.0.0.1:3000`

---

## 🔗 Endereços de Acesso

- **Aplicação Web (Frontend):** [http://localhost:3000](http://localhost:3000)
- **Documentação Swagger (Gateway):** [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- **Documentação ReDoc (Gateway):** [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)
- **Schema OpenAPI:** [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)
- **Contrato WSDL (Serviço SOAP):** [http://localhost:8003/?wsdl](http://localhost:8003/?wsdl)
- **Servidor WebSocket (Chat em Tempo Real):** `ws://localhost:8004/`

---

## 🏛️ Serviço SOAP & Interoperabilidade (Notarização e Integridade)

Além dos microsserviços REST, a aplicação conta com um serviço SOAP funcional:
* **Servidor Provedor (`:8003`):** Implementado em Python com a biblioteca **Spyne**, integrado diretamente ao banco de dados do Django (`storage.models.File`). É responsável por emitir hashes SHA-256 criptográficos e auditar a integridade dos arquivos em disco via contrato WSDL.
* **Cliente Consumidor:** O próprio **Front-end Web em JavaScript** (`:3000`), comprovando interoperabilidade entre tecnologias distintas (Python no servidor e JavaScript no cliente).

---

## 💬 Serviço WebSocket & Colaboração em Tempo Real (Chat e Compartilhamento)

Comunicação bidirecional contínua via protocolo `ws://` puro utilizando a biblioteca **websockets** em Python:
* **Servidor WebSocket (`:8004`):** Gerencia conexões ativas, presença online, histórico recente, **Broadcast** no canal `#geral` e roteamento de mensagens privadas **1-para-1**.
* **Gaveta Flutuante (Estilo LinkedIn / Facebook):** Integrada no canto inferior direito do cliente web, permitindo conversar, acompanhar quem está online e compartilhar arquivos do Drive em tempo real.
* **Adicionar ao meu Drive:** Ao receber um arquivo no chat, o destinatário pode cloná-lo diretamente para seu próprio armazenamento com um clique via REST, mantendo o hash SHA-256 e a certidão notarial SOAP intactos.

### Inicialização Unificada:
O script PowerShell já inicia todos os 6 serviços automaticamente (Accounts, Storage, Gateway, SOAP, WebSocket e Frontend):
```powershell
.\run_servers.ps1
```
