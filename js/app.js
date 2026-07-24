async function consultarCNPJ(){

    try{

        const cnpj =
            document.getElementById("cnpj")
            .value.replace(/\D/g,'');

        const resposta =
            await fetch(
            `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`
            );

        const dados =
            await resposta.json();

        document.getElementById("razaoSocial").value =
            dados.razao_social || '';

        document.getElementById("nomeFantasia").value =
            dados.nome_fantasia || '';

        document.getElementById("cidade").value =
            dados.municipio || '';

        document.getElementById("uf").value =
            dados.uf || '';

        document.getElementById("cep").value =
            dados.cep || '';

        document.getElementById("telefone").value =
            dados.ddd_telefone_1 || '';

        document.getElementById("situacao").value =
            dados.descricao_situacao_cadastral || '';

        document.getElementById("cnae").value =
            dados.cnae_fiscal_descricao || '';

    }
    catch{

        alert("Não foi possível consultar o CNPJ.");

    }

}

