/* ===================== CONFIGURAÇÃO DA HOMOLOGAÇÃO ===================== */
// Cole aqui as URLs geradas pelo gatilho "Quando uma solicitação HTTP for recebida"
// de cada fluxo do Power Automate (Guia de Construção - Portal, seção dos fluxos).

// Fluxo "Portal - Consultar processo": valida código + chave e devolve o checklist do fornecedor.
const URL_CONSULTAR_PROCESSO = "https://default652084859ace472dbf5e46ef7be77d.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/26bc2b653cb24a748430174d538ec54c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lVOy5-7cfGLkqQCpMKSXz0wjrUg8sYv3bp5lctXuOlU";

// Fluxo "Portal - Receber questionário": grava o FR-SUP-001 nas listas do SharePoint.
const URL_ENVIAR_QUESTIONARIO = "https://default652084859ace472dbf5e46ef7be77d.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/10/workflows/96745c45fd704a87aab0a6ab3944ca07/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=KvQe93tbDAEOi4bYh7l6PnKrLmVfVSJhvMUItDuJ5-g";

// Fluxo "Portal - Receber documento": salva um arquivo na pasta do fornecedor e atualiza o checklist.
const URL_ENVIAR_DOCUMENTO = "https://default652084859ace472dbf5e46ef7be77d.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/10/workflows/98b447ea9dd34a18ad50743c7265a793/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=scsLoabKvALsrtm6SzRleIJxm3R0SldrSr7RRRa-khw";

// Mesmo fluxo de consulta de CNPJ usado no cadastro da reforma tributária (../js/app.js).
const URL_CONSULTA_CNPJ = "https://default652084859ace472dbf5e46ef7be77d.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/24/workflows/fb3d9aa269fd4415bb53d24087d4ba6c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8ucCN-LOnOeSi3Kmsye4I78pzN_kL9lOuMp_Rp0OHKY";

// Tamanho máximo por documento (MB).
const TAMANHO_MAXIMO_MB = 20;
