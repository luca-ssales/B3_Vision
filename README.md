# B3 Vision

Plataforma web desenvolvida para acompanhar ações da bolsa de valores brasileira de forma visual e acessível.

O projeto consome dados do mercado financeiro por meio da API da **brapi**, permitindo consultar preços, variações, volume de negociação e histórico de ativos listados na B3.

## Sobre o projeto

O B3 Vision foi desenvolvido como projeto durante o curso do **SENAI**, com o objetivo de aplicar conceitos de desenvolvimento web, consumo de APIs e manipulação de dados financeiros.

A plataforma apresenta informações de empresas negociadas na bolsa brasileira, permitindo acompanhar diferentes ativos e comparar seu desempenho por meio de gráficos e indicadores.

> Os dados apresentados possuem finalidade educacional e não representam recomendação de investimento.

## Funcionalidades

- Consulta de ativos negociados na B3
- Exibição do preço atual da ação
- Variação percentual do ativo
- Preço máximo e mínimo
- Volume de negociação
- Gráfico com histórico de preços
- Comparação entre diferentes ações
- Criação de uma carteira de ativos
- Atualização dos dados utilizando API
- Interface responsiva para diferentes dispositivos

## Ativos utilizados

Durante o desenvolvimento, foram utilizados alguns dos principais ativos da bolsa brasileira:

- `PETR4` — Petrobras
- `VALE3` — Vale
- `ITUB4` — Itaú Unibanco
- `MGLU3` — Magazine Luiza

A estrutura da aplicação permite trabalhar com outros ativos disponíveis na API.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- API REST
- brapi
- Firebase Hosting
- Git e GitHub

## Integração com a API

As informações financeiras são obtidas por meio da API da [brapi](https://brapi.dev/).

Exemplo de consulta de um ativo:

```javascript
fetch("https://brapi.dev/api/quote/PETR4")
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Erro ao buscar os dados:", error);
    });
