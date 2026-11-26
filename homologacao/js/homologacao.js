/* ===================== HOMOLOGAÇÃO DE FORNECEDORES (PR-SUP-001) ===================== */
// Link do convite: .../homologacao/?p=FOR-0001&k=<chave>
// Demonstração:    .../homologacao/?demo=1

const params = new URLSearchParams(location.search);
const CODIGO = (params.get("p") || "").trim().toUpperCase();
const CHAVE = (params.get("k") || "").trim();
const MODO_DEMO = params.get("demo") === "1";

const nomesEtapas = ["Identificação", "Contatos", "Dados bancários", "Escopo", "Qualidade", "SST", "Documentos", "Declarações"];
const TOTAL_ETAPAS = nomesEtapas.length;
let etapaAtual = 1;
let processo = null;          // dados devolvidos pelo fluxo de consulta
let cnpjConsultado = false;

/* ===================== TEXTOS DO FR-SUP-001 ===================== */
const AREAS_CONTATO = ["Comercial", "Técnico / Resp. técnico", "Qualidade", "SST / Meio ambiente", "Financeiro"];
const TIPOS_FORNECIMENTO = ["Material", "Equipamento", "Locação", "Serviço", "Subcontratação", "Transporte", "Administrativo"];
const OUTRAS_CERT = ["ISO 14001", "ISO 45001", "PBQP-H", "Outras"];
const PERGUNTAS_QUALIDADE = [
    "Possui procedimentos documentados de execução / fabricação?",
    "Realiza inspeção de recebimento de matérias-primas e insumos?",
    "Mantém rastreabilidade de lotes, materiais ou serviços executados?",
    "Os instrumentos de medição são calibrados (preferencialmente RBC)?",
    "Elabora ou atende Plano de Inspeção e Testes (PIT)?",
    "Possui sistemática de registro e tratamento de não conformidades?",
    "Fornece certificados, relatórios de ensaio e databook quando exigidos?",
    "Qualifica e controla seus próprios subfornecedores?"
];
const PERGUNTAS_SST = [
    "Possui PGR (Programa de Gerenciamento de Riscos) vigente?",
    "Possui PCMSO vigente e ASO dos colaboradores?",
    "Realiza e registra treinamentos das NRs aplicáveis ao escopo?",
    "Registra a entrega de EPI aos colaboradores?",
    "Possui licenças ambientais e operacionais aplicáveis à atividade?",
    "Possui plano de gerenciamento de resíduos?",
    "Possui plano de atendimento a emergências?",
    "Mantém documentação e inspeção de máquinas e equipamentos (NR-12)?",
    "Possui profissional de SST (técnico / engenheiro de segurança)?",
    "Possui seguro de responsabilidade civil ou outros seguros contratuais?"
];
const DECLARACOES = [
    "Declaro que as informações prestadas neste questionário e os documentos apresentados são verdadeiros.",
    "Declaro que a empresa não emprega menores de 18 anos em trabalho noturno, perigoso ou insalubre, nem menores de 16 anos, salvo na condição de aprendiz a partir de 14 anos, e que não utiliza trabalho forçado ou análogo ao de escravo.",
    "Declaro que a empresa adota práticas de integridade e não oferece nem aceita vantagens indevidas, nos termos da Lei nº 12.846/2013 (Lei Anticorrupção).",
    "Comprometo-me a manter sigilo sobre informações técnicas, comerciais e documentos da Ciabrasil e de seus clientes.",
    "Declaro estar ciente de que os dados pessoais informados serão tratados pela Ciabrasil para fins de cadastro, homologação e gestão contratual, em conformidade com a Lei nº 13.709/2018 (LGPD).",
    "Declaro ciência do Código de Ética e Conduta da Ciabrasil e comprometo-me a cumpri-lo.",
    "Comprometo-me a comunicar previamente qualquer alteração societária, de material, projeto, processo, local de fabricação ou subfornecedor, e a não realizá-la sem autorização da Ciabrasil e, quando aplicável, do cliente.",
    "Comprometo-me a manter válidos os documentos exigidos e a tratar as não conformidades nos prazos acordados."
];

/* ===================== DADOS DE DEMONSTRAÇÃO ===================== */
// Matriz do FR-SUP-002: [item, documento, MO, LE, FB, SE, vale para Classe C, tem validade]
const MATRIZ_DEMO = [
    [1, "Cartão do CNPJ com situação ativa", "O", "O", "O", "O", true, false],
    [2, "Contrato social e última alteração registrada na Junta Comercial / cartório", "O", "O", "O", "O", true, false],
    [3, "Comprovante de dados bancários em nome da empresa", "O", "O", "O", "O", true, false],
    [4, "Certidão negativa de débitos federais - conjunta RFB/PGFN (inclui INSS)", "O", "O", "O", "O", true, true],
    [5, "Certificado de regularidade do FGTS (CRF)", "O", "O", "O", "O", true, true],
    [6, "Certidão negativa de débitos estaduais", "O", "—", "C", "—", false, true],
    [7, "Certidão da Justiça Federal", "O", "—", "—", "—", false, true],
    [8, "Declarações do fornecedor assinadas (FR-SUP-001, seção 8)", "O", "O", "O", "O", true, false],
    [9, "Atestados de capacidade técnica ou referências de serviços semelhantes", "C", "—", "C", "C", false, false],
    [10, "Registro no conselho profissional (CREA/CAU), responsável técnico e ART", "C", "—", "C", "O", false, false],
    [11, "Procedimentos de execução dos serviços", "O", "—", "—", "—", false, false],
    [12, "Certificado ISO 9001 ou evidências de controles da qualidade equivalentes", "C", "—", "O", "C", false, true],
    [13, "Procedimento de fabricação e Plano de Inspeção e Testes (PIT) no padrão do cliente", "—", "—", "O", "—", false, false],
    [14, "Procedimento de soldagem (EPS/RQPS) e qualificação de soldadores (CQS)", "—", "—", "C", "—", false, true],
    [15, "Procedimentos de ensaios não destrutivos e qualificação de inspetores", "—", "—", "C", "—", false, false],
    [16, "Certificados de calibração de instrumentos", "C", "—", "O", "—", false, true],
    [17, "Certificados de qualidade de matéria-prima e consumíveis / fichas técnicas", "—", "—", "O", "—", false, false],
    [18, "FDS / FISPQ dos produtos químicos utilizados", "C", "—", "C", "—", false, false],
    [19, "Licenças e autorizações de órgãos públicos (ex.: ANVISA, IBAMA, Exército, ATF/DER para transporte de passageiros)", "C", "C", "C", "C", false, true],
    [20, "Documento do veículo ou equipamento (CRLV ou equivalente)", "C", "O", "—", "—", false, true],
    [21, "Certificados de inspeção, manual, ficha técnica e plano de manutenção do equipamento", "C", "O", "—", "—", false, true],
    [22, "Apólice de seguro do veículo / equipamento (valor de reposição)", "C", "O", "—", "—", false, true],
    [23, "PGR e PCMSO", "O", "—", "C", "C", false, true],
    [24, "PCA e PPR (NR-09), AET (NR-17) e LTCAT (NR-15/16)", "O", "—", "C", "—", false, true],
    [25, "Convenção ou acordo coletivo do sindicato", "O", "—", "C", "C", false, true],
    [26, "Contrato de plano de saúde sem carência", "O", "—", "C", "C", false, false],
    [27, "Apólice de seguro de vida em grupo / seguro de empregados", "O", "—", "C", "C", false, true],
    [28, "Relação formal de funcionários (nome, admissão, salário e cargo)", "O", "—", "C", "C", false, false],
    [29, "ASO dos colaboradores a mobilizar", "O", "—", "C", "C", false, true],
    [30, "Ordem de Serviço NR-01 e fichas de entrega de EPI", "O", "—", "C", "C", false, false],
    [31, "Certificados de treinamentos de NR e cursos específicos (ex.: NR-10, NR-35, operador de máquinas)", "O", "—", "C", "C", false, true],
    [32, "Carta de indicação do representante da CIPA (NR-05)", "O", "—", "C", "C", false, false],
    [33, "Carta de preposto da empresa", "O", "—", "C", "C", false, false],
    [34, "Formulários do cliente Vale: RG S0001, IAF RG 002 e RG S0004 (GASAP)", "C", "—", "C", "C", false, false],
    [35, "Aprovação prévia do fornecedor / subcontratado pela Vale (quando exigida em contrato)", "C", "C", "C", "C", false, false],
    [36, "Outros documentos exigidos pelo contrato do cliente (especificar)", "C", "C", "C", "C", false, false]
];
const PERFIS_COLUNA = { MO: 2, LE: 3, FB: 4, SE: 5 };

// Mesma regra do Fluxo 1 (Abertura do processo): exigência mais forte entre os perfis;
// itens C só entram se escolhidos pelo Suprimentos; Classe C recebe só o cadastro simplificado.
function montarChecklistDemo(perfis, classe, condicionais) {
    const lista = [];
    MATRIZ_DEMO.forEach(([item, documento, ...resto]) => {
        const linha = [item, documento, ...resto];
        let exigencia = "";
        if (classe === "C") exigencia = linha[6] ? "Obrigatório" : "";
        else if (perfis.some(p => linha[PERFIS_COLUNA[p]] === "O")) exigencia = "Obrigatório";
        else if (condicionais.includes(item) && perfis.some(p => linha[PERFIS_COLUNA[p]] === "C")) exigencia = "Condicional exigido";
        if (exigencia) lista.push({ item, documento, exigencia, situacao: "Pendente", temValidade: linha[7] });
    });
    return lista;
}
const DEMO_PERFIS = (params.get("perfil") || "MO,LE").toUpperCase().split(/[,;]/).map(s => s.trim()).filter(p => PERFIS_COLUNA[p] !== undefined);
const DEMO_CLASSE = (params.get("classe") || "B").toUpperCase();
const DEMO_COND = (params.get("cond") || "9").split(/[,;]/).map(Number).filter(Boolean);
const PROCESSO_DEMO = {
    ok: true,
    codigo: "FOR-0000",
    razaoSocial: "Fornecedor de Demonstração Ltda",
    cnpj: "00.000.000/0001-91",
    questionarioEnviado: false,
    checklist: montarChecklistDemo(DEMO_PERFIS, DEMO_CLASSE, DEMO_COND)
};
const CNPJ_DEMO = {
    razao_social: "FORNECEDOR DE DEMONSTRACAO LTDA", nome_fantasia: "DEMO SERVICOS",
    descricao_tipo_de_logradouro: "AVENIDA", logradouro: "EXEMPLO", numero: "100", complemento: "SALA 2", bairro: "CENTRO",
    municipio: "VITORIA", uf: "ES", cep: "29000000", ddd_telefone_1: "2733330000",
    cnae_fiscal: 4930202, cnae_fiscal_descricao: "Transporte rodoviário de carga",
    data_inicio_atividade: "2010-05-03", porte: "EMPRESA DE PEQUENO PORTE", opcao_pelo_simples: false,
    qsa: [{ nome_socio: "MARIA DE EXEMPLO", qualificacao_socio: "Sócio-Administrador" }]
};

/* ===================== UTILITÁRIOS ===================== */
const $ = (id) => document.getElementById(id);
const valor = (id) => ($(id) ? $(id).value.trim() : "");
function mostrarTela(id) {
    document.querySelectorAll(".tela").forEach(t => t.classList.add("oculto"));
    $(id).classList.remove("oculto");
    window.scrollTo({ top: 0 });
}
function urlConfigurada(url) { return url && !url.includes("COLE_AQUI"); }
function formatarCnpj(c) {
    const d = String(c || "").replace(/\D/g, "");
    return d.length === 14 ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : (c || "");
}
async function postJson(url, corpo) {
    const resposta = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(corpo) });
    if (!resposta.ok) throw new Error("HTTP " + resposta.status);
    const texto = await resposta.text();
    if (!texto) return {};
    let dados = JSON.parse(texto);
    if (typeof dados === "string") dados = JSON.parse(dados);
    return dados;
}
const esperar = (ms) => new Promise(r => setTimeout(r, ms));
function escapar(t) { return String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

/* ===================== CARREGAMENTO DO PROCESSO ===================== */
async function carregarProcesso() {
    if (MODO_DEMO) {
        $("faixa-demo").classList.remove("oculto");
        $("faixa-demo").textContent = `Modo de demonstração: nada é gravado e os envios são simulados. ` +
            `Documentos calculados para perfil ${DEMO_PERFIS.join(" + ") || "(nenhum)"}, classe ${DEMO_CLASSE}` +
            (DEMO_COND.length && DEMO_CLASSE !== "C" ? `, condicionais exigidos: ${DEMO_COND.join(", ")}` : "") +
            `. Troque no endereço: &perfil=FB&classe=A&cond=14,15`;
        processo = JSON.parse(JSON.stringify(PROCESSO_DEMO));
    } else {
        if (!CODIGO || !CHAVE || !urlConfigurada(URL_CONSULTAR_PROCESSO)) return mostrarTela("tela-erro");
        try {
            processo = await postJson(URL_CONSULTAR_PROCESSO, { codigo: CODIGO, chave: CHAVE });
        } catch (e) {
            console.error(e);
            $("mensagemErro").textContent = "Não foi possível carregar o processo agora. Tente novamente em alguns minutos.";
            return mostrarTela("tela-erro");
        }
        if (!processo || !processo.ok) return mostrarTela("tela-erro");
    }
    processo.checklist = (processo.checklist || []).sort((a, b) => a.item - b.item);

    if (processo.questionarioEnviado) {
        $("docCodigo").textContent = processo.codigo;
        $("docRazao").textContent = processo.razaoSocial;
        renderDocumentos("listaDocumentos2", "resumoDocumentos2");
        return mostrarTela("tela-documentos");
    }
    $("bvRazao").textContent = processo.razaoSocial;
    $("bvCodigo").textContent = processo.codigo;
    mostrarTela("tela-boas-vindas");
}

function iniciar() {
    montarFormulario();
    $("cnpj").value = formatarCnpj(processo.cnpj);
    $("razaoSocial").value = processo.razaoSocial || "";
    mostrarTela("tela-formulario");
    atualizarNavegacao();
    consultarCNPJ(true);
}

/* ===================== MONTAGEM DOS CAMPOS ===================== */
function criarOpcoes(containerId, nome, opcoes, tipo) {
    const c = $(containerId);
    c.innerHTML = "";
    opcoes.forEach(o => {
        const l = document.createElement("label");
        l.innerHTML = `<input type="${tipo}" name="${nome}" value="${escapar(o)}"> ${escapar(o)}`;
        c.appendChild(l);
    });
}
function criarMatriz(containerId, prefixo, perguntas) {
    const c = $(containerId);
    c.innerHTML = "";
    perguntas.forEach((p, i) => {
        const linha = document.createElement("div");
        linha.className = "matriz-linha";
        linha.dataset.grupo = `${prefixo}${i + 1}`;
        linha.innerHTML = `<div class="pergunta">${i + 1}. ${escapar(p)}</div><div class="opcoes">` +
            ["Sim", "Não", "N/A"].map(o => `<label><input type="radio" name="${prefixo}${i + 1}" value="${o}"> ${o}</label>`).join("") + "</div>";
        c.appendChild(linha);
    });
}
function criarTabela(tabelaId, rotulos, colunas, prefixo) {
    const corpo = $(tabelaId).querySelector("tbody");
    corpo.innerHTML = "";
    rotulos.forEach((rot, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = (rot !== null ? `<td>${escapar(rot)}</td>` : "") +
            colunas.map(col => `<td><input id="${prefixo}_${i}_${col}" ${col === "email" ? 'type="email"' : ""}></td>`).join("");
        corpo.appendChild(tr);
    });
}
let formularioMontado = false;
function montarFormulario() {
    if (formularioMontado) return;
    formularioMontado = true;
    criarTabela("tabelaContatos", AREAS_CONTATO, ["nome", "cargo", "email", "telefone"], "ct");
    criarTabela("tabelaRepresentantes", [null, null, null], ["nome", "cargo", "email", "telefone"], "rp");
    criarTabela("tabelaReferencias", [null, null, null], ["empresa", "escopo", "contato", "telefone"], "rf");
    criarOpcoes("tipoFornecimento", "tipoFornecimento", TIPOS_FORNECIMENTO, "checkbox");
    criarOpcoes("usaSubfornecedores", "usaSubfornecedores", ["Sim", "Não"], "radio");
    criarOpcoes("iso9001", "iso9001", ["Sim", "Não", "Em implantação"], "radio");
    criarOpcoes("outrasCert", "outrasCert", OUTRAS_CERT, "checkbox");
    criarMatriz("matrizQualidade", "Q", PERGUNTAS_QUALIDADE);
    criarMatriz("matrizSst", "S", PERGUNTAS_SST);
    const dec = $("listaDeclaracoes");
    DECLARACOES.forEach((d, i) => {
        const l = document.createElement("label");
        l.innerHTML = `<input type="checkbox" id="D${i + 1}"> <span>${escapar(d)}</span>`;
        dec.appendChild(l);
    });
    document.querySelectorAll('input[name="usaSubfornecedores"]').forEach(r => r.addEventListener("change", () => {
        const sim = marcado("usaSubfornecedores") === "Sim";
        $("campoSubfornecedores").classList.toggle("oculto", !sim);
        $("subfornecedores").required = sim;
    }));
    document.querySelectorAll('input[name="iso9001"]').forEach(r => r.addEventListener("change", () => {
        $("campoIso").classList.toggle("oculto", marcado("iso9001") !== "Sim");
    }));
    renderDocumentos("listaDocumentos", "resumoDocumentos");
}
const marcado = (nome) => (document.querySelector(`input[name="${nome}"]:checked`) || {}).value || "";
const marcados = (nome) => [...document.querySelectorAll(`input[name="${nome}"]:checked`)].map(i => i.value);

/* ===================== CONSULTA DE CNPJ ===================== */
async function consultarCNPJ(automatico) {
    const status = $("statusConsulta");
    const cnpj = valor("cnpj").replace(/\D/g, "");
    if (cnpj.length !== 14) { status.textContent = "CNPJ inválido no convite. Preencha os dados manualmente."; return; }
    status.textContent = "Consultando a Receita...";
    try {
        let d;
        if (MODO_DEMO) { await esperar(600); d = CNPJ_DEMO; }
        else d = await postJson(URL_CONSULTA_CNPJ, { cnpj });
        const definir = (id, v) => { if (v && (!automatico || !valor(id))) $(id).value = v; };
        definir("razaoSocial", d.razao_social);
        definir("nomeFantasia", d.nome_fantasia);
        definir("cidade", d.municipio);
        definir("uf", d.uf);
        definir("cep", d.cep ? String(d.cep).replace(/(\d{5})(\d{3})/, "$1-$2") : "");
        definir("telefone", d.ddd_telefone_1);
        definir("dataFundacao", d.data_inicio_atividade);
        definir("cnaePrincipal", d.cnae_fiscal ? `${d.cnae_fiscal} - ${d.cnae_fiscal_descricao || ""}` : "");
        definir("endereco", [[d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(" "), d.numero, d.complemento, d.bairro].filter(Boolean).join(", "));
        definir("titular", d.razao_social);
        definir("chavePix", formatarCnpj(cnpj));
        if (d.opcao_pelo_simples === true) definir("regime", "Simples Nacional");
        const porte = String(d.porte || "").toUpperCase();
        if (porte.includes("MICRO")) definir("porte", "ME");
        else if (porte.includes("PEQUENO")) definir("porte", "EPP");
        (d.qsa || []).slice(0, 3).forEach((s, i) => {
            definir(`rp_${i}_nome`, s.nome_socio);
            definir(`rp_${i}_cargo`, s.qualificacao_socio);
        });
        cnpjConsultado = true;
        status.textContent = "Dados da Receita carregados. Confira e complete o que faltar.";
    } catch (e) {
        console.error(e);
        status.textContent = "Não foi possível consultar a Receita agora. Preencha os dados manualmente.";
    }
}

/* ===================== NAVEGAÇÃO E VALIDAÇÃO ===================== */
function renderStepper() {
    const s = $("stepper");
    s.innerHTML = "";
    nomesEtapas.forEach((n, i) => {
        const el = document.createElement("div");
        el.className = "stepper-item" + (i + 1 === etapaAtual ? " ativo" : "") + (i + 1 < etapaAtual ? " concluido" : "");
        el.textContent = `${i + 1}. ${n}`;
        s.appendChild(el);
    });
}
function atualizarNavegacao() {
    document.querySelectorAll(".step").forEach(s => s.classList.toggle("oculto", Number(s.dataset.step) !== etapaAtual));
    $("btnVoltar").style.visibility = etapaAtual === 1 ? "hidden" : "visible";
    $("btnAvancar").classList.toggle("oculto", etapaAtual === TOTAL_ETAPAS);
    $("btnEnviar").classList.toggle("oculto", etapaAtual !== TOTAL_ETAPAS);
    renderStepper();
}
function mudarEtapa(direcao) {
    if (direcao === 1 && !validarEtapa(etapaAtual)) return;
    etapaAtual = Math.min(TOTAL_ETAPAS, Math.max(1, etapaAtual + direcao));
    atualizarNavegacao();
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function erroEtapa(mensagem, elemento) {
    let caixa = document.querySelector(`.step[data-step="${etapaAtual}"] .aviso-erro`);
    if (!caixa) {
        caixa = document.createElement("div");
        caixa.className = "aviso aviso-erro";
        caixa.style.cssText = "background:#fff1f0;border-left:4px solid #b3261e;color:#7a1a14;";
        document.querySelector(`.step[data-step="${etapaAtual}"] h2`).after(caixa);
    }
    caixa.textContent = mensagem;
    if (elemento) { elemento.classList?.add("campo-erro"); elemento.scrollIntoView({ behavior: "smooth", block: "center" }); elemento.focus?.(); }
    return false;
}
function limparErros(etapa) {
    const sec = document.querySelector(`.step[data-step="${etapa}"]`);
    sec.querySelector(".aviso-erro")?.remove();
    sec.querySelectorAll(".campo-erro").forEach(e => e.classList.remove("campo-erro"));
    sec.querySelectorAll(".matriz-linha.faltando").forEach(e => e.classList.remove("faltando"));
}
function validarEtapa(etapa) {
    limparErros(etapa);
    const sec = document.querySelector(`.step[data-step="${etapa}"]`);
    for (const campo of sec.querySelectorAll("[required]")) {
        if (campo.closest(".oculto")) continue;
        if (!campo.value.trim()) {
            const rotulo = sec.querySelector(`label[for="${campo.id}"]`)?.textContent.replace("*", "").trim() || "campo obrigatório";
            return erroEtapa(`Preencha: ${rotulo}.`, campo);
        }
        if (campo.type === "email" && !campo.checkValidity()) return erroEtapa("Confira o e-mail informado.", campo);
    }
    for (const grupo of sec.querySelectorAll(".opcoes[data-obrigatorio]")) {
        if (!grupo.querySelector("input:checked")) return erroEtapa(`Responda: ${grupo.dataset.obrigatorio}.`, grupo);
    }
    for (const linha of sec.querySelectorAll(".matriz-linha")) {
        if (!marcado(linha.dataset.grupo)) {
            linha.classList.add("faltando");
            return erroEtapa("Responda todas as perguntas (Sim, Não ou N/A).", linha);
        }
    }
    if (etapa === 1 && valor("cnpj").replace(/\D/g, "").length !== 14) return erroEtapa("CNPJ inválido.", $("cnpj"));
    if (etapa === 2) {
        if (!valor("ct_0_nome") || !valor("ct_0_email")) return erroEtapa("Informe nome e e-mail do contato comercial.", $(valor("ct_0_nome") ? "ct_0_email" : "ct_0_nome"));
        if (!valor("rp_0_nome")) return erroEtapa("Informe pelo menos um representante legal.", $("rp_0_nome"));
        for (const e of sec.querySelectorAll('input[type="email"]')) if (e.value && !e.checkValidity()) return erroEtapa("Confira o e-mail informado.", e);
    }
    if (etapa === 8) {
        const falta = DECLARACOES.findIndex((_, i) => !$(`D${i + 1}`).checked);
        if (falta >= 0) return erroEtapa("Marque todas as declarações para enviar.", $(`D${falta + 1}`).parentElement);
    }
    return true;
}

/* ===================== DOCUMENTOS ===================== */
// Situações vistas pelo fornecedor (a análise interna não aparece em detalhe)
const ESTADOS = {
    "Pendente": { texto: "Pendente", ok: false, envia: true },
    "Recebido": { texto: "Enviado - em análise", ok: true, envia: true },
    "Conforme": { texto: "Aceito pela Ciabrasil", ok: true, envia: true },
    "Não conforme": { texto: "Reenviar - não aceito", ok: false, envia: true },
    "NA": { texto: "Não aplicável", ok: true, envia: false }
};
// Item 8 (declarações) é atendido pela etapa 8 do próprio questionário: não há arquivo a enviar.
const ITEM_DECLARACOES = 8;
function estadoDoc(d) {
    if (d.item === ITEM_DECLARACOES) {
        const feito = processo.questionarioEnviado || d.situacao !== "Pendente";
        return { texto: feito ? "Feito nas declarações do questionário" : "Será atendido na etapa 8 (declarações)", ok: true, envia: false };
    }
    return ESTADOS[d.situacao] || ESTADOS["Pendente"];
}
function classeExigencia(e) { return e === "Obrigatório" ? "obrigatorio" : e === "Adicional" ? "adicional" : "condicional"; }
function renderResumo(resumoId) {
    const total = processo.checklist.filter(d => d.situacao !== "NA" && d.item !== ITEM_DECLARACOES).length;
    const pend = processo.checklist.filter(d => !estadoDoc(d).ok).length;
    $(resumoId).innerHTML = `<span>${total} documento(s) pedidos</span>` +
        (pend ? `<span class="alerta">${pend} pendente(s)</span>` : `<span class="ok">Todos enviados</span>`);
}
function renderDocumentos(listaId, resumoId) {
    const lista = $(listaId);
    lista.innerHTML = "";
    processo.checklist.forEach(d => {
        const est = estadoDoc(d);
        const id = `${listaId}_${d.item}_${String(d.documento).length}`;
        const div = document.createElement("div");
        div.className = "doc" + (est.ok ? " enviado" : "");
        div.innerHTML = `
            <div class="num">${d.item >= 99 ? "+" : String(d.item).padStart(2, "0")}</div>
            <div>
                <div class="titulo">${escapar(d.documento)}</div>
                <div class="meta">
                    <span class="selo ${classeExigencia(d.exigencia)}">${escapar(d.exigencia)}</span>
                    <span class="selo estado ${est.ok ? "ok" : ""}" data-estado>${escapar(est.texto)}</span>
                </div>
            </div>
            <div class="acoes">${est.envia ? `
                ${d.temValidade ? `<p class="rotulo-pequeno">Validade do documento</p><input type="date" id="${id}_val">` : ""}
                <label class="botao-arquivo" for="${id}_arq">${est.ok ? "Substituir arquivo" : "Escolher arquivo"}</label>
                <input type="file" id="${id}_arq" accept=".pdf,.jpg,.jpeg,.png">
                <div class="progresso" id="${id}_msg"></div>` : ""}
            </div>`;
        lista.appendChild(div);
        if (est.envia) $(`${id}_arq`).addEventListener("change", (ev) => enviarDocumento(d, ev.target, id, div, listaId, resumoId));
    });
    renderResumo(resumoId);
}
function lerBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(arquivo);
    });
}
async function enviarDocumento(doc, input, id, div, listaId, resumoId) {
    const msg = $(`${id}_msg`);
    msg.classList.remove("erro");
    const arquivo = input.files[0];
    input.value = "";
    if (!arquivo) return;
    const ext = (arquivo.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png"].includes(ext)) { msg.classList.add("erro"); msg.textContent = "Envie em PDF, JPG ou PNG."; return; }
    if (arquivo.size > TAMANHO_MAXIMO_MB * 1024 * 1024) { msg.classList.add("erro"); msg.textContent = `Arquivo acima de ${TAMANHO_MAXIMO_MB} MB.`; return; }
    const validade = doc.temValidade ? valor(`${id}_val`) : "";
    if (doc.temValidade && !validade) { msg.classList.add("erro"); msg.textContent = "Informe a validade antes de escolher o arquivo."; return; }

    msg.textContent = `Enviando ${arquivo.name}...`;
    try {
        const conteudo = await lerBase64(arquivo);
        if (MODO_DEMO) await esperar(900);
        else {
            const r = await postJson(URL_ENVIAR_DOCUMENTO, {
                codigo: processo.codigo, chave: CHAVE, item: doc.item, documento: doc.documento,
                nomeOriginal: arquivo.name, extensao: ext, validade, conteudoBase64: conteudo
            });
            if (r && r.ok === false) throw new Error(r.mensagem || "Recusado");
        }
        doc.situacao = "Recebido";
        div.classList.add("enviado");
        div.querySelector("[data-estado]").textContent = ESTADOS["Recebido"].texto;
        div.querySelector("[data-estado]").classList.add("ok");
        div.querySelector(".botao-arquivo").textContent = "Substituir arquivo";
        msg.textContent = `Enviado: ${arquivo.name}`;
        renderResumo(resumoId);
    } catch (e) {
        console.error(e);
        msg.classList.add("erro");
        msg.textContent = "Não foi possível enviar. Tente novamente.";
    }
}

/* ===================== ENVIO DO QUESTIONÁRIO ===================== */
function linhasTabela(prefixo, rotulos, colunas) {
    return rotulos.map((rot, i) => {
        const v = colunas.map(c => valor(`${prefixo}_${i}_${c}`));
        return v.some(Boolean) ? { rotulo: rot, ...Object.fromEntries(colunas.map((c, j) => [c, v[j]])) } : null;
    }).filter(Boolean);
}
function textoTabela(linhas, colunas) {
    return linhas.map(l => (l.rotulo ? l.rotulo + ": " : "") + colunas.map(c => l[c]).filter(Boolean).join(" | ")).join("\n");
}
function montarPayload() {
    const contatos = linhasTabela("ct", AREAS_CONTATO, ["nome", "cargo", "email", "telefone"]);
    const representantes = linhasTabela("rp", [null, null, null], ["nome", "cargo", "email", "telefone"]);
    const referencias = linhasTabela("rf", [null, null, null], ["empresa", "escopo", "contato", "telefone"]);
    const p = {
        codigo: processo.codigo, chave: CHAVE, dataEnvio: new Date().toISOString(),
        cnpj: valor("cnpj"), razaoSocial: valor("razaoSocial"), nomeFantasia: valor("nomeFantasia"),
        IE: valor("inscricaoEstadual"), IM: valor("inscricaoMunicipal"), DataFundacao: valor("dataFundacao"), CNAE: valor("cnaePrincipal"),
        Endereco: [valor("endereco"), [valor("cidade"), valor("uf")].filter(Boolean).join("/"), valor("cep") ? "CEP " + valor("cep") : ""].filter(Boolean).join(" - "),
        TelefoneSite: [valor("telefone"), valor("site")].filter(Boolean).join(" | "),
        Regime: valor("regime"), Porte: valor("porte"),
        Contatos: textoTabela(contatos, ["nome", "cargo", "email", "telefone"]),
        Representantes: textoTabela(representantes, ["nome", "cargo", "email", "telefone"]),
        contatos, representantes, referencias,
        Banco: valor("banco"), Agencia: valor("agencia"), Conta: valor("conta"), TipoConta: valor("tipoConta"), Titular: valor("titular"), ChavePix: valor("chavePix"),
        TipoFornecimento: marcados("tipoFornecimento"), DescricaoFornecimento: valor("descricaoFornecimento"),
        Locais: valor("locais"), Capacidade: valor("capacidade"),
        UsaSubfornecedores: marcado("usaSubfornecedores") === "Sim", Subfornecedores: valor("subfornecedores"),
        Referencias: textoTabela(referencias, ["empresa", "escopo", "contato", "telefone"]),
        ISO9001: marcado("iso9001"), ISOCertificador: valor("isoCertificador"), OutrasCert: marcados("outrasCert"),
        AcidentesAfast: Number(valor("acidentes") || 0), Obitos: Number(valor("obitos") || 0),
        RespNome: `${valor("respNome")} - ${valor("respCargo")}`, respEmail: valor("respEmail"), respTelefone: valor("respTelefone"),
        dadosReceitaConsultados: cnpjConsultado
    };
    PERGUNTAS_QUALIDADE.forEach((_, i) => p[`Q${i + 1}`] = marcado(`Q${i + 1}`));
    PERGUNTAS_SST.forEach((_, i) => p[`S${i + 1}`] = marcado(`S${i + 1}`));
    DECLARACOES.forEach((_, i) => p[`D${i + 1}`] = $(`D${i + 1}`).checked);
    return p;
}
async function enviarQuestionario() {
    for (let e = 1; e <= TOTAL_ETAPAS; e++) {
        if (e === 7) continue;
        if (!validarEtapa(e)) { etapaAtual = e; atualizarNavegacao(); validarEtapa(e); return; }
    }
    const btn = $("btnEnviar");
    btn.disabled = true;
    btn.textContent = "Enviando...";
    const payload = montarPayload();
    try {
        if (MODO_DEMO) { await esperar(900); console.log("Payload (demonstração)", payload); }
        else {
            const r = await postJson(URL_ENVIAR_QUESTIONARIO, payload);
            if (r && r.ok === false) throw new Error(r.mensagem || "Recusado");
        }
        const pend = processo.checklist.filter(d => !estadoDoc(d).ok).length;
        $("textoPendentes").textContent = pend
            ? `Ainda há ${pend} documento(s) pendente(s). Envie pelo mesmo link do convite assim que estiverem prontos.`
            : "Todos os documentos pedidos foram enviados.";
        mostrarTela("tela-sucesso");
    } catch (e) {
        console.error(e);
        erroEtapa("Não foi possível enviar agora. Seus dados continuam nesta página; tente novamente em instantes.");
        btn.disabled = false;
        btn.textContent = "Enviar questionário";
    }
}

/* ===================== INICIALIZAÇÃO ===================== */
carregarProcesso();
