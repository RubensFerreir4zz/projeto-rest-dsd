const SoapClient = {
  getSoapUrl() {
    const saved = localStorage.getItem("soap_url");
    if (saved) return saved;

    if (
      window.location.hostname &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1" &&
      window.location.protocol.startsWith("http")
    ) {
      return `http://${window.location.hostname}:8003/`;
    }
    return "http://127.0.0.1:8003/";
  },

  setSoapUrl(url) {
    let cleanUrl = url.trim().replace(/\/$/, "") + "/";
    localStorage.setItem("soap_url", cleanUrl);
  },

  async sendSoapRequest(xmlEnvelope) {
    const response = await fetch(this.getSoapUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: '""',
      },
      body: xmlEnvelope,
    });

    const responseText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, "text/xml");

    const fault =
      xmlDoc.querySelector("Fault") ||
      xmlDoc.querySelector("soap11env\\:Fault") ||
      xmlDoc.querySelector("soapenv\\:Fault");
    if (fault) {
      const faultCode =
        fault.querySelector("faultcode")?.textContent || "Client.Unknown";
      const faultString =
        fault.querySelector("faultstring")?.textContent ||
        "Erro desconhecido retornado pelo servidor SOAP.";
      const err = new Error(faultString);
      err.faultCode = faultCode;
      err.rawXml = responseText;
      throw err;
    }

    return {
      xmlDoc,
      rawXml: responseText,
    };
  },

  async emitirAutenticacao(arquivoId) {
    const xmlEnvelope = `<?xml version="1.0" encoding="utf-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:saf="safodrive.soap.notary">
    <soapenv:Header/>
    <soapenv:Body>
      <saf:emitir_autenticacao_arquivo>
        <saf:arquivo_id>${arquivoId}</saf:arquivo_id>
      </saf:emitir_autenticacao_arquivo>
    </soapenv:Body>
  </soapenv:Envelope>`;

    const { xmlDoc, rawXml } = await this.sendSoapRequest(xmlEnvelope);
    const resultNode =
      xmlDoc.querySelector("emitir_autenticacao_arquivoResult") ||
      xmlDoc.querySelector("tns\\:emitir_autenticacao_arquivoResult");

    return {
      protocolo:
        resultNode?.querySelector("protocolo, tns\\:protocolo")?.textContent ||
        "",
      arquivoId: Number(
        resultNode?.querySelector("arquivo_id, tns\\:arquivo_id")
          ?.textContent || 0,
      ),
      nomeArquivo:
        resultNode?.querySelector("nome_arquivo, tns\\:nome_arquivo")
          ?.textContent || "",
      tamanhoBytes: Number(
        resultNode?.querySelector("tamanho_bytes, tns\\:tamanho_bytes")
          ?.textContent || 0,
      ),
      hashSha256:
        resultNode?.querySelector("hash_sha256, tns\\:hash_sha256")
          ?.textContent || "",
      timestampUtc:
        resultNode?.querySelector("timestamp_utc, tns\\:timestamp_utc")
          ?.textContent || "",
      status:
        resultNode?.querySelector("status, tns\\:status")?.textContent || "",
      mensagem:
        resultNode?.querySelector("mensagem, tns\\:mensagem")?.textContent ||
        "",
      rawRequestXml: xmlEnvelope,
      rawResponseXml: rawXml,
    };
  },

  async validarIntegridade(arquivoId, hashConferencia = "") {
    const xmlEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:saf="safodrive.soap.notary">
  <soapenv:Header/>
  <soapenv:Body>
    <saf:validar_integridade_arquivo>
      <saf:arquivo_id>${arquivoId}</saf:arquivo_id>
      <saf:hash_conferencia>${this._escapeXml(hashConferencia)}</saf:hash_conferencia>
    </saf:validar_integridade_arquivo>
  </soapenv:Body>
</soapenv:Envelope>`;

    const { xmlDoc, rawXml } = await this.sendSoapRequest(xmlEnvelope);
    const resultNode =
      xmlDoc.querySelector("validar_integridade_arquivoResult") ||
      xmlDoc.querySelector("tns\\:validar_integridade_arquivoResult");

    return {
      arquivoId: Number(
        resultNode?.querySelector("arquivo_id, tns\\:arquivo_id")
          ?.textContent || 0,
      ),
      protocolo:
        resultNode?.querySelector("protocolo, tns\\:protocolo")?.textContent ||
        "",
      autentico:
        (
          resultNode?.querySelector("autentico, tns\\:autentico")
            ?.textContent || ""
        ).toLowerCase() === "true",
      hashOficial:
        resultNode?.querySelector("hash_oficial, tns\\:hash_oficial")
          ?.textContent || "",
      status:
        resultNode?.querySelector("status, tns\\:status")?.textContent || "",
      mensagem:
        resultNode?.querySelector("mensagem, tns\\:mensagem")?.textContent ||
        "",
      rawRequestXml: xmlEnvelope,
      rawResponseXml: rawXml,
    };
  },

  _escapeXml(unsafe) {
    if (!unsafe) return "";
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "&":
          return "&amp;";
        case "'":
          return "&apos;";
        case '"':
          return "&quot;";
      }
    });
  },
};
