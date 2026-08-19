# B3 Vision - Dashboard de Ações da Bolsa de Valores

Aplicação web interativa para acompanhamento em tempo real e simulação de investimentos em ações brasileiras (B3), desenvolvida como projeto educacional para o SENAI.

---

## 🎯 Objetivo

O objetivo deste projeto é integrar e aplicar conceitos práticos de desenvolvimento front-end com **JavaScript puro (Vanilla JS)**, consumindo dados reais de cotações e históricos financeiros da API pública `brapi.dev`, sem utilização de frameworks ou backend.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica, formulários e acessibilidade.
- **CSS3**: Estilização moderna em tema escuro (*Dark Mode*), variáveis CSS, layout flexível (Flexbox e CSS Grid) e responsividade.
- **JavaScript (ES6+)**: Lógica da aplicação, manipulação dinâmica do DOM, funções assíncronas e tratamento de erros.
- **Fetch API & async/await**: Consumo assíncrono de dados REST JSON.
- **LocalStorage**: Persistência local de dados no navegador.
- **Chart.js (via CDN)**: Renderização e gerenciamento de gráficos de linha interativos.
- **API brapi.dev**: Provedor público de dados do mercado financeiro brasileiro.

---

## 📊 Ações Disponíveis

A aplicação opera exclusivamente com quatro ativos selecionados do mercado brasileiro (B3):

- **PETR4** - Petróleo Brasileiro S.A. (Petrobras)
- **VALE3** - Vale S.A.
- **ITUB4** - Itaú Unibanco Holding S.A.
- **MGLU3** - Magazine Luiza S.A.

---

## ✨ Funcionalidades Principais

1. **Dashboard em Tempo Real**:
   - Exibição de preço atual, variação percentual do dia, preço máximo, preço mínimo e volume de negociação.
   - Indicadores visuais dinâmicos (verde para lucros/altas e vermelho para prejuízos/quedas).
   - Atualização manual através do botão *"Atualizar dados"* com timestamp da última consulta.

2. **Gráfico de Histórico de Preços**:
   - Visualização da evolução do preço de fechamento da ação selecionada.
   - Alternância de períodos: 1 Mês (`1mo`), 3 Meses (`3mo`), 6 Meses (`6mo`) e 1 Ano (`1y`).

3. **Gráfico de Comparação de Desempenho**:
   - Comparação relativa entre 2 a 4 ações simultaneamente.
   - Normalização do desempenho em percentual acumulado (`%`), permitindo comparar ativos de preços nominais diferentes no mesmo gráfico.

4. **Carteira Simulada de Investimentos**:
   - Formulário com validações para adicionar posições (quantidade e preço de compra).
   - Armazenamento automático e persistente no `LocalStorage` (`b3VisionCarteira`).
   - Tabela de posições com cálculos em tempo real de Valor Investido, Valor Atual, Lucro/Prejuízo e Rentabilidade percentual.
   - Cards com os totais consolidados da carteira e remoção individual de ativos.
   - Exibição de estado vazio (*Empty State*) quando não houver investimentos cadastrados.

5. **Tratamento de Erros e Feedback Visual**:
   - Validações de resposta HTTP (`response.ok`), bloco `try/catch` e mensagens amigáveis em tela em caso de falha de conexão ou instabilidade na API.
   - Indicadores de carregamento (*spinners* e *overlays*) durante as requisições.

---

## 🌐 API Utilizada

Consumo público da API `brapi.dev` (sem necessidade de token de acesso):

- **Cotação Atual**:
  `GET https://brapi.dev/api/v2/stocks/quote?symbols=PETR4`
- **Dados Históricos**:
  `GET https://brapi.dev/api/v2/stocks/historical?symbols=PETR4&range=1mo&interval=1d`

---

## 📂 Estrutura do Projeto

```text
/
├── index.html   # Estrutura HTML5 da interface
├── style.css    # Estilização CSS3 (tema escuro e responsividade)
├── script.js    # Lógica JavaScript pura (API, Gráficos, LocalStorage)
└── README.md    # Documentação acadêmica do projeto
```

---

## 🚀 Como Executar

Por ser um projeto puramente front-end (sem Node.js ou build steps), basta:

1. Baixar os arquivos do repositório.
2. Abrir o arquivo `index.html` diretamente em qualquer navegador moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).
3. Ou utilizar uma extensão como *Live Server* no VS Code.

---

## 🧠 Conceitos Praticados

- Consumo de APIs RESTful usando `fetch` e sintaxe `async/await`.
- Manipulação avançada do DOM e delegação de eventos.
- Armazenamento local com `LocalStorage` (`JSON.stringify` e `JSON.parse`).
- Tratamento defensivo de erros (`try/catch`, checagem de nulos/undefined e `response.ok`).
- Destruição e recriação de instâncias de gráficos no Chart.js.
- Cálculos financeiros de rentabilidade e porcentagem acumulada.
- Formatação padrão de moeda brasileira (`Intl.NumberFormat`) e unidades numéricas.
- Design responsivo com CSS Grid, Flexbox e Media Queries.

---

## 📝 Prompts Utilizados no Google Antigravity

> *Seção reservada para registrar os prompts de comando utilizados durante a construção do projeto:*

- **Prompt 1 (Planejamento e Arquitetura)**:
  > *"Defina o plano de implementação e a estrutura dos arquivos para um Dashboard B3 em JavaScript puro consumindo a brapi.dev."*

- **Prompt 2 (Desenvolvimento do Código)**:
  > *"Implemente os arquivos index.html, style.css e script.js seguindo todos os 24 requisitos de design escuro, gráficos no Chart.js, tratamento de erros e carteira no LocalStorage."*

- **Prompt 3 (Revisão e Documentação)**:
  > *"Verifique se há erros no código e gere o arquivo README.md didático para apresentação no SENAI."*

---

⚠️ *Projeto educacional desenvolvido para atividades do SENAI. Os dados apresentados são obtidos de API pública e servem apenas para fins de aprendizado, não consistindo em indicação de investimento.*
