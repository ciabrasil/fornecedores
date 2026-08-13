/* ===================== CONFIGURAÇÃO ===================== */
// Cole aqui a URL gerada pelo gatilho "Quando uma solicitação HTTP for recebida"
// do seu fluxo no Power Automate.
const POWER_AUTOMATE_URL = "https://default652084859ace472dbf5e46ef7be77d.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/be9d66080fc140088bd465940b20f463/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=TqArhrd0mbALHJyAyunmE7mKrm_MKomzvZHk-c1FBg0";
const CONSULTA_CNPJ_URL = "https://default652084859ace472dbf5e46ef7be77d.8f.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/24/workflows/fb3d9aa269fd4415bb53d24087d4ba6c/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=8ucCN-LOnOeSi3Kmsye4I78pzN_kL9lOuMp_Rp0OHKY"

const TOTAL_ETAPAS = 6;
let etapaAtual = 1;
let cnaesSecundarios = [];
let listaCnaeCompleta = null; // cache da lista de CNAEs da BrasilAPI

/* ===================== NAVEGAÇÃO ENTRE TELAS ===================== */
function irParaFormulario() {
    document.getElementById("tela-boas-vindas").classList.add("oculto");
    document.getElementById("tela-formulario").classList.remove("oculto");
    renderStepper();

    document.getElementById("btnVoltar").style.visibility = "hidden";
    document.getElementById("btnAvancar").classList.remove("oculto");
    document.getElementById("btnEnviar").classList.add("oculto");
}

/* ===================== STEPPER ===================== */
const nomesEtapas = [
    "Dados Cadastrais",
    "Dados Tributários",
    "Produtos e Serviços",
    "Operacionalização Fiscal",
    "Contratos e Financeiro",
    "Responsável"
];

function renderStepper() {
    const stepper = document.getElementById("stepper");
    stepper.innerHTML = "";
    for (let i = 1; i <= TOTAL_ETAPAS; i++) {
        const item = document.createElement("div");
        item.className = "stepper-item";
        if (i === etapaAtual) item.classList.add("ativo");
        if (i < etapaAtual) item.classList.add("concluido");
        item.textContent = `${i}. ${nomesEtapas[i - 1]}`;
        stepper.appendChild(item);
    }
}

function mudarEtapa(direcao) {
    if (direcao === 1 && !validarEtapaAtual()) return;

    const novaEtapa = etapaAtual + direcao;
    if (novaEtapa < 1 || novaEtapa > TOTAL_ETAPAS) return;

    document.querySelector(`.step[data-step="${etapaAtual}"]`).classList.add("oculto");
    etapaAtual = novaEtapa;
    document.querySelector(`.step[data-step="${etapaAtual}"]`).classList.remove("oculto");

    document.getElementById("btnVoltar").style.visibility = etapaAtual === 1 ? "hidden" : "visible";
    document.getElementById("btnAvancar").classList.toggle("oculto", etapaAtual === TOTAL_ETAPAS);
    document.getElementById("btnEnviar").classList.toggle("oculto", etapaAtual !== TOTAL_ETAPAS);

    renderStepper();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function validarEtapaAtual() {
    const campos = document.querySelectorAll(`.step[data-step="${etapaAtual}"] [required]`);
    for (const campo of campos) {
        if (!campo.value.trim()) {
            campo.focus();
            alert("Preencha o campo obrigatório: " + (campo.previousElementSibling?.textContent || campo.id));
            return false;
        }
    }
    return true;
}

/* ===================== CONSULTA DE CNPJ ===================== */
async function consultarCNPJ() {
    const statusEl = document.getElementById("statusConsulta");
    const cnpj = document.getElementById("cnpj").value.replace(/\D/g, "");

    if (cnpj.length !== 14) {
        alert("Digite um CNPJ válido (14 dígitos).");
        return;
    }

    statusEl.textContent = "Consultando...";
    try {
        const resposta = await fetch(CONSULTA_CNPJ_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify({ cnpj: cnpj })
        });
        if (!resposta.ok) throw new Error("Falha na consulta");

        let dados = await resposta.json();
        if (typeof dados === "string") {
            dados = JSON.parse(dados);
        }

        document.getElementById("razaoSocial").value = dados.razao_social || "";
        document.getElementById("nomeFantasia").value = dados.nome_fantasia || dados.razao_social || "";
        document.getElementById("cidade").value = dados.municipio || "";
        document.getElementById("uf").value = dados.uf || "";
        document.getElementById("telefone").value = dados.ddd_telefone_1 || "";
        document.getElementById("cnaePrincipal").value =
            dados.cnae_fiscal ? `${dados.cnae_fiscal} - ${dados.cnae_fiscal_descricao}` : "";

        const partesEndereco = [
            dados.descricao_tipo_de_logradouro,
            dados.logradouro,
            dados.numero,
            dados.bairro
        ].filter(Boolean).join(", ");
        document.getElementById("endereco").value = partesEndereco;

        (dados.cnaes_secundarios || []).forEach(c => {
            if (c.codigo) adicionarCnaeSecundario(c.codigo, c.descricao || "");
        });

        statusEl.textContent = "Dados carregados. Confira e complete o restante do formulário.";
    } catch (erro) {
        console.error(erro);
        statusEl.textContent = "Não foi possível consultar. Preencha os dados manualmente.";
    }
}

/* ===================== REGIME TRIBUTÁRIO: SIMPLES NACIONAL (ANEXO/FAIXA) ===================== */
// Mostra/oculta e torna obrigatórios os campos de Anexo e Faixa apenas quando
// o regime selecionado for "Simples Nacional".
const selectRegime = document.getElementById("regime");
const campoAnexo = document.getElementById("campoAnexoSimples");
const campoFaixa = document.getElementById("campoFaixaSimples");
const selectAnexo = document.getElementById("anexoSimples");
const selectFaixa = document.getElementById("faixaSimples");

function atualizarCamposSimplesNacional() {
    const ehSimplesNacional = selectRegime.value === "Simples Nacional";

    campoAnexo.classList.toggle("oculto", !ehSimplesNacional);
    campoFaixa.classList.toggle("oculto", !ehSimplesNacional);

    selectAnexo.required = ehSimplesNacional;
    selectFaixa.required = ehSimplesNacional;

    if (!ehSimplesNacional) {
        selectAnexo.value = "";
        selectFaixa.value = "";
    }
}
selectRegime.addEventListener("change", atualizarCamposSimplesNacional);

/* ===================== CNAEs SECUNDÁRIOS ===================== */
async function carregarListaCnae() {
    if (listaCnaeCompleta) return listaCnaeCompleta;
    try {
        const resposta = await fetch("https://brasilapi.com.br/api/cnae/v1");
        listaCnaeCompleta = await resposta.json();
    } catch (erro) {
        console.error("Erro ao carregar lista de CNAEs", erro);
        listaCnaeCompleta = [];
    }
    return listaCnaeCompleta;
}

const inputBuscaCnae = document.getElementById("buscaCnaeSecundario");
const listaSugestoesEl = document.getElementById("listaSugestoesCnae");

inputBuscaCnae.addEventListener("input", async () => {
    const termo = inputBuscaCnae.value.trim().toLowerCase();
    if (termo.length < 2) {
        listaSugestoesEl.classList.add("oculto");
        return;
    }
    const lista = await carregarListaCnae();
    const filtrados = lista
        .filter(c =>
            String(c.codigo).includes(termo) ||
            (c.descricao || "").toLowerCase().includes(termo)
        )
        .slice(0, 15);

    listaSugestoesEl.innerHTML = "";
    filtrados.forEach(c => {
        const div = document.createElement("div");
        div.textContent = `${c.codigo} - ${c.descricao}`;
        div.onclick = () => adicionarCnaeSecundario(c.codigo, c.descricao);
        listaSugestoesEl.appendChild(div);
    });
    listaSugestoesEl.classList.toggle("oculto", filtrados.length === 0);
});

function adicionarCnaeSecundario(codigo, descricao) {
    if (cnaesSecundarios.some(c => c.codigo === codigo)) return;
    cnaesSecundarios.push({ codigo, descricao });
    renderChipsCnae();
    inputBuscaCnae.value = "";
    listaSugestoesEl.classList.add("oculto");
}

function removerCnaeSecundario(codigo) {
    cnaesSecundarios = cnaesSecundarios.filter(c => c.codigo !== codigo);
    renderChipsCnae();
}

function renderChipsCnae() {
    const container = document.getElementById("chipsCnaeSecundario");
    container.innerHTML = "";
    cnaesSecundarios.forEach(c => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerHTML = `${c.codigo} - ${c.descricao} `;
        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.textContent = "×";
        btnRemover.onclick = () => removerCnaeSecundario(c.codigo);
        chip.appendChild(btnRemover);
        container.appendChild(chip);
    });
}

/* ===================== TRIBUTOS APLICÁVEIS (ETAPA 2) ===================== */
function configurarTributos() {
    document.querySelectorAll(".chk-tributo").forEach(chk => {
        chk.addEventListener("change", () => {
            const alvo = document.getElementById(chk.dataset.alvo);
            if (!alvo) return;
            alvo.disabled = !chk.checked;
            if (!chk.checked) alvo.value = "";
            else alvo.focus();
        });
    });
}

function coletarTributos() {
    const marcados = [];
    document.querySelectorAll(".chk-tributo:checked").forEach(chk => {
        const alvo = document.getElementById(chk.dataset.alvo);
        marcados.push({
            tributo: chk.parentElement.textContent.trim(),
            aliquota: alvo ? alvo.value : ""
        });
    });
    return marcados;
}

/* ===================== UPLOAD DA PLANILHA ===================== */
document.getElementById("planilhaProdutos").addEventListener("change", (e) => {
    const arquivo = e.target.files[0];
    document.getElementById("nomeArquivoProdutos").textContent = arquivo ? arquivo.name : "";
});

function arquivoParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
        if (!arquivo) return resolve(null);
        const leitor = new FileReader();
        leitor.onload = () => resolve(leitor.result.split(",")[1]);
        leitor.onerror = reject;
        leitor.readAsDataURL(arquivo);
    });
}

/* ===================== ENVIO FINAL ===================== */
async function enviarFormulario() {
    if (!validarEtapaAtual()) return;

    if (!POWER_AUTOMATE_URL || POWER_AUTOMATE_URL.includes("COLE_AQUI")) {
        alert("A URL do fluxo do Power Automate ainda não foi configurada em js/app.js.");
        return;
    }

    const btnEnviar = document.getElementById("btnEnviar");
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    const arquivoInput = document.getElementById("planilhaProdutos");
    const arquivoBase64 = await arquivoParaBase64(arquivoInput.files[0]);

    const tributosAplicaveis = coletarTributos();
    const valor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : "";
    };

    const payload = {
        dataEnvio: new Date().toISOString(),
        cnpj: document.getElementById("cnpj").value,
        razaoSocial: document.getElementById("razaoSocial").value,
        nomeFantasia: document.getElementById("nomeFantasia").value,
        inscricaoEstadual: document.getElementById("inscricaoEstadual").value,
        inscricaoMunicipal: document.getElementById("inscricaoMunicipal").value,
        endereco: document.getElementById("endereco").value,
        cidade: document.getElementById("cidade").value,
        uf: document.getElementById("uf").value,
        telefone: document.getElementById("telefone").value,
        email: document.getElementById("email").value,
        regimeTributario: document.getElementById("regime").value,

        // NOVO: só vêm preenchidos quando o regime é Simples Nacional
        anexoSimplesNacional: valor("anexoSimples"),
        faixaSimplesNacional: valor("faixaSimples"),

        cnaePrincipal: document.getElementById("cnaePrincipal").value,
        cnaesSecundarios: cnaesSecundarios,

        tributosAplicaveis: tributosAplicaveis,
        aliquotaIcms: valor("aliquotaIcms"),
        aliquotaIpi: valor("aliquotaIpi"),
        aliquotaPis: valor("aliquotaPis"),
        aliquotaCofins: valor("aliquotaCofins"),
        aliquotaIss: valor("aliquotaIss"),
        beneficiosFiscais: document.getElementById("beneficiosFiscais").value,
        creditosAcumulados: document.getElementById("creditosAcumulados").value,

        descricaoProdutos: document.getElementById("descricaoProdutos").value,
        planilhaProdutosNome: arquivoInput.files[0] ? arquivoInput.files[0].name : "",
        planilhaProdutosBase64: arquivoBase64,

        modeloNf: document.getElementById("modeloNf").value,
        sistemaGestaoFiscal: document.getElementById("sistemaGestaoFiscal").value,
        splitPayment: document.getElementById("splitPayment").value,
        apuracaoCreditos: document.getElementById("apuracaoCreditos").value,

        politicaFaturamento: document.getElementById("politicaFaturamento").value,
        banco: document.getElementById("banco").value,
        agencia: document.getElementById("agencia").value,
        conta: document.getElementById("conta").value,
        tipoConta: document.getElementById("tipoConta").value,
        chavePix: document.getElementById("chavePix").value,

        respNome: document.getElementById("respNome").value,
        respCargo: document.getElementById("respCargo").value,
        respEmail: document.getElementById("respEmail").value,
        respTelefone: document.getElementById("respTelefone").value
    };

    try {
        const resposta = await fetch(POWER_AUTOMATE_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        });
        if (!resposta.ok) throw new Error("Falha no envio");

        document.getElementById("tela-formulario").classList.add("oculto");
        document.getElementById("tela-sucesso").classList.remove("oculto");
    } catch (erro) {
        console.error(erro);
        alert("Não foi possível enviar o cadastro agora. Tente novamente em instantes.");
        btnEnviar.disabled = false;
        btnEnviar.textContent = "Enviar Cadastro";
    }
}

/* ===================== INICIALIZAÇÃO ===================== */
configurarTributos();
