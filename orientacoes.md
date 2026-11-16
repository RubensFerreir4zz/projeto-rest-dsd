# Meta Criar um serviço REST, implementar e documentar um API Gateway
## Regras

- Desenvolver ao menos um API Gateway
- Implementar o conceito de HATEOAS no Gateway
- Implementar o acesso via token JWT
- Criar a documentação de API para o Gateway (ex. SOAP UI, Swagger, etc.)
- Implementar ou utilizar ao menos 2 API para simular a arquitetura interna de um sistema
- Desenvolver um Cliente Web para acessar o Gateway
- Criar projeto no Github e compartilhar link

## Para a apresentação

- Utilizar uma das máquinas do laboratório como servidor e colocar o sistema em execução;
- Na máquina principal, apresentar o cliente do sistema em funcionamento, sem erros de execução;
- Apresentação presencial (responder dúvidas e permitir que o código seja testado pelos presentes).

## Estudo de caso

- Livre escolha com os seguintes casos de sugestão transmissão de arquivo (texto, imagem, vídeo),
- implementação de um jogo simples entre players remotos, sistemas de gerenciamento de contas online,
- etc.
- Linguagem de programação de livre escolha

# Meta SOAP

Projetar, implementar e validar um Serviço Web SOAP funcional, composto por um servidor provedor e um cliente consumidor, demonstrando interoperabilidade entre tecnologias distintas.

Ao final da atividade, o aluno deverá ser capaz de:
- Definir e compreender um contrato de serviço via WSDL;
- Publicar um endpoint SOAP funcional;
- Consumir o serviço a partir de outra linguagem ou ferramenta;
- Validar requisições e respostas usando SoapUI;
- Analisar diferenças arquiteturais entre SOAP e REST, justificando decisões técnicas tomadas durante a implementação.

## Regras

A atividade consiste na construção de um micro-serviço SOAP acadêmico, com tema livre e operações simples e objetivas (por exemplo: cálculo financeiro, conversão de unidades, verificação acadêmica, consulta simulada de dados institucionais).

Escopo obrigatório

Cada grupo deverá implementar:
- Um servidor SOAP (ex: C#, Java - JAX-WS, Python - Spyne);
- Um contrato WSDL funcional e acessível;
- Pelo menos duas operações expostas;
- Um cliente consumidor em linguagem diferente do servidor (C#, Java, Python com zeep, etc.);
- Testes completos realizados no SoapUI;
- Exportação da documentação do serviço via SoapUI.

## Restrições técnicas

Não é permitido:
- Utilizar REST ou JSON como mecanismo principal de comunicação;
- Usar frameworks que abstraiam totalmente o SOAP (como Spring Boot com autogeração sem intervenção do aluno).

### Requisitos mínimos obrigatórios

O serviço deve demonstrar:

- Uso correto de Envelope, Body e namespaces SOAP;
- Publicação local do endpoint;
- Geração automática ou manual do WSDL;
- Validação de chamadas bem-sucedidas;
- Tratamento básico de erro (entrada inválida ou exceção simulada).

### Simplificações permitidas

Podem ser usados:
- Dados simulados em memória;
- Operações síncronas;
- Endpoints locais (localhost);
- Estrutura procedural simples.

### Restrições adicionais
- O serviço deve ser funcional, mas pequeno;
- O foco está na compreensão do protocolo, não em interface gráfica;
- Não é necessário deploy externo;
- Evitar código repetitivo extenso;
- O grupo deve justificar decisões técnicas tomadas;
- A solução deve evidenciar entendimento de interoperabilidade SOAP.


# Meta WebSocket

Desenvolver uma aplicação simples de comunicação em tempo real utilizando WebSocket, capaz de demonstrar a diferença entre o modelo tradicional de requisição-resposta do HTTP e o modelo bidirecional de comunicação contínua.

Ao final da atividade, o aluno deverá ser capaz de:
- Estabelecer uma conexão WebSocket entre cliente e servidor;
- Enviar e receber mensagens em tempo real;
- Compreender o ciclo de vida de uma conexão WebSocket (abertura, envio, recebimento e encerramento);
- Tomar decisões sobre como gerenciar múltiplos clientes conectados;
- Justificar tecnicamente por que o WebSocket é mais adequado que polling ou REST para determinados cenários.

## Regras

### Escopo da atividade

Cada grupo deverá implementar um Estudo de caso que utilize de atualizações em Tempo Real.

O sistema deve possuir:
- Um servidor WebSocket;
- Uma interface web simples (HTML + JavaScript);
- Um mecanismo para envio de atualizações;
- Atualização automática da interface dos clientes conectados.

**Exemplos de notificações:**
- Novo pedido recebido;
- Novo aluno conectado;
- Nova mensagem do sistema;
- Alerta de monitoramento.

*O tema da atualização é livre.*

### Requisitos mínimos obrigatórios

A implementação deve obrigatoriamente:
- Utilizar o protocolo WebSocket (`ws://`) para comunicação (não serão aceitas libs que deixem o protocolo `ws://` transparente);
- Possuir ao menos dois clientes conectados simultaneamente;
- Permitir envio de mensagens do cliente para o servidor;
- Permitir envio de mensagens do servidor para todos os clientes conectados (*broadcast*);
- Exibir visualmente as mensagens recebidas;
- Registrar no console do servidor:
  - Abertura de conexão;
  - Recebimento de mensagem;
  - Encerramento de conexão.

### Tomada de decisão obrigatória

O grupo deverá decidir e justificar:
- Como identificar os clientes conectados;
- Como armazenar as conexões ativas;
- Como tratar clientes desconectados;
- Qual formato de mensagem será utilizado (texto simples ou JSON).

*As decisões devem ser descritas brevemente na entrega.*

### Recomendações de Tecnologias

Recomenda-se utilizar:

| Linguagem | Biblioteca | Tipo / Escopo | Principal Característica |
| :--- | :--- | :--- | :--- |
| **Node.js** | `ws` | Servidor / Cliente | Padrão da comunidade, rápida e estável. |
| **Node.js** | `uWebSockets.js` | Servidor | Performance extrema, baseada em C++. |
| **Python** | `websockets` | Servidor / Cliente | Assíncrona (asyncio), moderna e limpa. |
| **Python** | `websocket-client` | Cliente | Síncrona, ideal para scripts e automações. |
| **Go** | `gorilla/websocket` | Servidor / Cliente | Biblioteca mais tradicional, robusta e amplamente utilizada. |
| **Go** | `nhooyr/websocket` | Servidor / Cliente | Moderna, minimalista e com excelente suporte a contextos. |
| **Java / Kotlin** | `Java-WebSocket` | Servidor / Cliente | Pura, sem dependências externas, compatível com Android. |
| **Java / Kotlin** | `Tyrus` | Servidor / Cliente | Implementação de referência oficial da especificação Jakarta WebSocket. |
| **C# (.NET)** | `System.Net.WebSockets` | Servidor / Cliente | Nativa do .NET, integrada ao ecossistema oficial da plataforma. |
| **C# (.NET)** | `WebSocketSharp` | Servidor / Cliente | Muito utilizada em projetos legados e aplicações Unity. |
| **Rust** | `tungstenite` | Servidor / Cliente | Implementação leve e robusta de WebSocket puro. |
| **Rust** | `tokio-tungstenite` | Servidor / Cliente | Integrada ao ecossistema assíncrono Tokio. |
| **C++** | `uWebSockets` | Servidor | Uma das implementações WebSocket mais rápidas do mercado. |
| **C++** | `Boost.Beast` | Servidor / Cliente | Integrada ao Boost.Asio, altamente escalável e flexível. |

*A interface pode ser minimalista.*

### Possíveis simplificações

Caso o grupo não conclua a interface completa:
- O servidor poderá enviar mensagens automáticas a cada 10 segundos;
- O cliente poderá apenas receber mensagens;
- As mensagens poderão ser exibidas somente em uma lista HTML simples.

> **Importante:** Entretanto, o uso de WebSocket e o broadcast continuam obrigatórios.