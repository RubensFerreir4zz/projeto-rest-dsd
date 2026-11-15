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
