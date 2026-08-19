/**
 * B3 VISION - DASHBOARD DE AÇÕES DA BOLSA DE VALORES
 * Código didático em JavaScript puro (ES6+) para atividade do SENAI.
 * Consome a API pública brapi.dev sem backend e armazena carteira no LocalStorage.
 */

// ==========================================================================
// 1. CONFIGURAÇÕES E ESTADO DA APLICAÇÃO
// ==========================================================================

// Lista oficial de tickers permitidos nesta atividade
const TICKERS_PERMITIDOS = ['PETR4', 'VALE3', 'ITUB4', 'MGLU3'];

// Chaves para persistência no LocalStorage
const LOCAL_STORAGE_KEY = 'b3VisionCarteira';
const LOCAL_STORAGE_3D_KEY = 'b3VisionWallpaper3D';

// Mapeamento de cores para os gráficos de cada ação
const CORES_TICKERS = {
    PETR4: '#3b82f6', // Azul Petrobras
    VALE3: '#10b981', // Verde esmeralda Vale
    ITUB4: '#f59e0b', // Laranja Itaú
    MGLU3: '#ec4899'  // Rosa Magalu
};

// Mapeamento de cores 3D (HSL) correspondentes a cada ação da B3
const CORES_ACOES_3D = {
    PETR4: { hex: 0x3b82f6, hsl: { h: 0.60, s: 0.90, l: 0.55 } }, // Azul Petrobras
    VALE3: { hex: 0x10b981, hsl: { h: 0.44, s: 0.85, l: 0.50 } }, // Verde Vale
    ITUB4: { hex: 0xf59e0b, hsl: { h: 0.10, s: 0.92, l: 0.52 } }, // Laranja Itaú
    MGLU3: { hex: 0xec4899, hsl: { h: 0.92, s: 0.85, l: 0.58 } }  // Rosa Magalu
};

// Objeto de controle de cor ativa para transição suave
let targetColorObj = CORES_ACOES_3D['PETR4'];

// Estado global da aplicação em memória
const estado = {
    tickerSelecionado: 'PETR4',
    periodoSelecionado: '1mo',
    carteira: [], // Array de objetos: { id, ticker, quantidade, precoCompra }
    cotacoesAtuais: {}, // Cache das cotações da API: { PETR4: {...}, VALE3: {...} }
    historicosCache: {}, // Cache de históricos por range: { '1mo': { PETR4: [...], VALE3: [...] } }
    chartHistorico: null, // Instância do Chart.js do gráfico individual
    chartComparacao: null, // Instância do Chart.js do gráfico comparativo
    wallpaper3DAtivo: true // Estado do plano de fundo 3D (ON/OFF)
};

// ==========================================================================
// 2. ELEMENTOS DO DOM
// ==========================================================================

const dom = {
    // Cabeçalho
    btnAtualizarDados: document.getElementById('btnAtualizarDados'),
    labelUltimaAtualizacao: document.getElementById('labelUltimaAtualizacao'),
    btnToggleWallpaper3D: document.getElementById('btnToggleWallpaper3D'),
    labelToggle3D: document.getElementById('labelToggle3D'),
    canvasOrganismBg: document.getElementById('canvasOrganismBg'),
    
    // Alerta de Erro
    containerErro: document.getElementById('containerErro'),
    textoErro: document.getElementById('textoErro'),
    btnFecharErro: document.getElementById('btnFecharErro'),
    
    // Seletor de Tickers
    seletorTickers: document.getElementById('seletorTickers'),
    
    // Detalhes da Ação
    stockLogo: document.getElementById('stockLogo'),
    stockTickerTitle: document.getElementById('stockTickerTitle'),
    stockLongName: document.getElementById('stockLongName'),
    stockPrice: document.getElementById('stockPrice'),
    stockChangeBadge: document.getElementById('stockChangeBadge'),
    stockChangeIcon: document.getElementById('stockChangeIcon'),
    stockChangePercent: document.getElementById('stockChangePercent'),
    stockChangeValue: document.getElementById('stockChangeValue'),
    metricDayHigh: document.getElementById('metricDayHigh'),
    metricDayLow: document.getElementById('metricDayLow'),
    metricVolume: document.getElementById('metricVolume'),
    
    // Gráfico Histórico
    seletorPeriodo: document.getElementById('seletorPeriodo'),
    chartHistoricoCanvas: document.getElementById('chartHistorico'),
    chartLoadingOverlay: document.getElementById('chartLoadingOverlay'),
    
    // Gráfico Comparativo
    grupoComparacao: document.getElementById('grupoComparacao'),
    chartComparacaoCanvas: document.getElementById('chartComparacao'),
    compareLoadingOverlay: document.getElementById('compareLoadingOverlay'),
    
    // Carteira Simulada
    portTotalInvestido: document.getElementById('portTotalInvestido'),
    portValorAtual: document.getElementById('portValorAtual'),
    portLucroPrejuizo: document.getElementById('portLucroPrejuizo'),
    portRentabilidade: document.getElementById('portRentabilidade'),
    
    // Formulário Carteira
    formAdicionarAtivo: document.getElementById('formAdicionarAtivo'),
    selectTickerForm: document.getElementById('selectTickerForm'),
    inputQuantidade: document.getElementById('inputQuantidade'),
    inputPrecoCompra: document.getElementById('inputPrecoCompra'),
    mensagemFeedbackForm: document.getElementById('mensagemFeedbackForm'),
    
    // Tabela Carteira
    corpoTabelaCarteira: document.getElementById('corpoTabelaCarteira'),
    containerTabelaCarteira: document.getElementById('containerTabelaCarteira'),
    estadoVazioCarteira: document.getElementById('estadoVazioCarteira')
};

// ==========================================================================
// 3. FUNÇÕES UTILITÁRIAS DE FORMATAÇÃO (pt-BR)
// ==========================================================================

function formatarMoeda(valor) {
    if (valor === undefined || valor === null || isNaN(valor)) return 'R$ --,--';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarPercentual(valor, incluirSinal = true) {
    if (valor === undefined || valor === null || isNaN(valor)) return '0,00%';
    const num = Number(valor);
    const prefixo = (num > 0 && incluirSinal) ? '+' : '';
    return `${prefixo}${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatarVolume(volume) {
    if (volume === undefined || volume === null || isNaN(volume)) return '--';
    const num = Number(volume);
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' bi';
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mi';
    }
    if (num >= 1_000) {
        return (num / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil';
    }
    return num.toLocaleString('pt-BR');
}

function formatarData(timestampSeconds) {
    if (!timestampSeconds) return '';
    const date = new Date(timestampSeconds * 1000);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ==========================================================================
// 4. GERENCIAMENTO DE MENSAGENS E FEEDBACK VISUAL
// ==========================================================================

function mostrarErro(mensagem) {
    dom.textoErro.textContent = mensagem;
    dom.containerErro.classList.remove('hidden');
}

function esconderErro() {
    dom.containerErro.classList.add('hidden');
}

function atualizarHorarioUltimaConsulta() {
    const agora = new Date();
    dom.labelUltimaAtualizacao.textContent = agora.toLocaleTimeString('pt-BR');
}

// ==========================================================================
// 5. CONSUMO INTELIGENTE DA API (BATCHING & RATE LIMIT PROTECTION 429)
// ==========================================================================

async function fetchComRetry(url, retries = 1, delayMs = 1500) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url);
            
            if (response.status === 429) {
                if (attempt < retries) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    continue;
                } else {
                    throw new Error('Limite de requisições excedido (HTTP 429). A API pública brapi.dev restringe requisições frequentes. Por favor, aguarde 5 segundos antes de atualizar.');
                }
            }
            
            if (!response.ok) {
                throw new Error(`Erro na API brapi.dev (Status ${response.status})`);
            }
            
            return await response.json();
        } catch (error) {
            if (attempt === retries) throw error;
        }
    }
}

async function buscarTodasCotacoes() {
    const symbolsQuery = TICKERS_PERMITIDOS.join(',');
    const url = `https://brapi.dev/api/v2/stocks/quote?symbols=${symbolsQuery}`;
    
    try {
        const data = await fetchComRetry(url);
        
        if (data && data.results) {
            data.results.forEach(item => {
                if (item && item.data) {
                    estado.cotacoesAtuais[item.symbol] = item.data;
                }
            });
        }
    } catch (error) {
        console.error('Erro ao buscar cotações em lote:', error);
        mostrarErro(error.message || 'Erro ao carregar cotações atuais.');
    }
}

async function buscarTodosHistoricos(range = '1mo') {
    if (estado.historicosCache[range]) {
        return estado.historicosCache[range];
    }
    
    const symbolsQuery = TICKERS_PERMITIDOS.join(',');
    const url = `https://brapi.dev/api/v2/stocks/historical?symbols=${symbolsQuery}&range=${range}&interval=1d`;
    
    try {
        const data = await fetchComRetry(url);
        const mapResultado = {};
        
        if (data && data.results) {
            data.results.forEach(res => {
                if (res && res.symbol && res.data && res.data.historicalDataPrice) {
                    const lista = res.data.historicalDataPrice;
                    lista.sort((a, b) => a.date - b.date);
                    mapResultado[res.symbol] = lista;
                }
            });
        }
        
        estado.historicosCache[range] = mapResultado;
        return mapResultado;
    } catch (error) {
        console.error(`Erro ao buscar histórico para range ${range}:`, error);
        mostrarErro(error.message || 'Erro ao carregar histórico de preços da API.');
        return estado.historicosCache[range] || {};
    }
}

// ==========================================================================
// 6. ATUALIZAÇÃO DOS CARDS DE DETALHE DA AÇÃO
// ==========================================================================

function renderizarDetalhesAcao(symbol) {
    const dadosAcao = estado.cotacoesAtuais[symbol];
    if (!dadosAcao) return;
    
    dom.stockTickerTitle.textContent = dadosAcao.shortName || symbol;
    dom.stockLongName.textContent = dadosAcao.longName || 'Empresa B3';
    
    if (dadosAcao.logourl) {
        dom.stockLogo.src = dadosAcao.logourl;
        dom.stockLogo.classList.remove('hidden');
    } else {
        dom.stockLogo.classList.add('hidden');
    }
    
    dom.stockPrice.textContent = formatarMoeda(dadosAcao.regularMarketPrice);
    
    const variacao = dadosAcao.regularMarketChangePercent || 0;
    const variacaoValor = dadosAcao.regularMarketChange || 0;
    
    dom.stockChangePercent.textContent = formatarPercentual(variacao);
    dom.stockChangeValue.textContent = formatarMoeda(variacaoValor);
    
    dom.stockChangeBadge.className = 'badge-change';
    if (variacao > 0) {
        dom.stockChangeBadge.classList.add('positive');
        dom.stockChangeIcon.textContent = '▲';
    } else if (variacao < 0) {
        dom.stockChangeBadge.classList.add('negative');
        dom.stockChangeIcon.textContent = '▼';
    } else {
        dom.stockChangeBadge.classList.add('neutral');
        dom.stockChangeIcon.textContent = '•';
    }
    
    dom.metricDayHigh.textContent = formatarMoeda(dadosAcao.regularMarketDayHigh);
    dom.metricDayLow.textContent = formatarMoeda(dadosAcao.regularMarketDayLow);
    dom.metricVolume.textContent = formatarVolume(dadosAcao.regularMarketVolume);
}

// ==========================================================================
// 7. RENDERIZAÇÃO DOS GRÁFICOS COM CHART.JS
// ==========================================================================

function renderizarGraficoHistorico(symbol, range) {
    const mapRange = estado.historicosCache[range] || {};
    const historicoData = mapRange[symbol] || [];
    
    if (estado.chartHistorico) {
        estado.chartHistorico.destroy();
    }
    
    if (!historicoData || historicoData.length === 0) return;
    
    const labels = historicoData.map(item => formatarData(item.date));
    const precos = historicoData.map(item => item.close);
    
    const ctx = dom.chartHistoricoCanvas.getContext('2d');
    const corAcao = CORES_TICKERS[symbol] || '#3b82f6';
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, `${corAcao}66`);
    gradient.addColorStop(1, `${corAcao}00`);
    
    estado.chartHistorico = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Preço de Fechamento - ${symbol} (R$)`,
                data: precos,
                borderColor: corAcao,
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.2,
                pointRadius: 2,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: corAcao
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#94a3b8', font: { family: 'Inter' } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return ` Preço: ${formatarMoeda(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 11 },
                        callback: function(val) { return 'R$ ' + val.toFixed(2); }
                    }
                }
            }
        }
    });
}

function renderizarGraficoComparacao(range) {
    if (estado.chartComparacao) {
        estado.chartComparacao.destroy();
    }
    
    const checkboxes = dom.grupoComparacao.querySelectorAll('.checkbox-ticker:checked');
    const selecionados = Array.from(checkboxes).map(cb => cb.value);
    
    if (selecionados.length < 2) {
        mostrarErro('Selecione pelo menos 2 ações para comparar.');
        return;
    }
    
    const mapHistoricos = estado.historicosCache[range] || {};
    
    let datasReferencia = [];
    selecionados.forEach(t => {
        const hist = mapHistoricos[t] || [];
        if (hist.length > datasReferencia.length) {
            datasReferencia = hist.map(item => item.date);
        }
    });
    
    const labels = datasReferencia.map(d => formatarData(d));
    const datasets = [];
    
    selecionados.forEach(ticker => {
        const historico = mapHistoricos[ticker] || [];
        if (historico.length === 0) return;
        
        const precoInicial = historico[0].close;
        
        const dadosPercentuais = historico.map(item => {
            if (!precoInicial || precoInicial === 0) return 0;
            return ((item.close - precoInicial) / precoInicial) * 100;
        });
        
        const cor = CORES_TICKERS[ticker] || '#94a3b8';
        
        datasets.push({
            label: ticker,
            data: dadosPercentuais,
            borderColor: cor,
            backgroundColor: cor,
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 1,
            pointHoverRadius: 5
        });
    });
    
    const ctx = dom.chartComparacaoCanvas.getContext('2d');
    
    estado.chartComparacao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: { color: '#94a3b8', font: { family: 'Inter', weight: '600' } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            const val = context.parsed.y;
                            return ` ${context.dataset.label}: ${formatarPercentual(val)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 11 },
                        callback: function(val) { return (val > 0 ? '+' : '') + val.toFixed(1) + '%'; }
                    }
                }
            }
        }
    });
}

// ==========================================================================
// 8. LÓGICA DA CARTEIRA SIMULADA (LOCALSTORAGE E CÁLCULOS)
// ==========================================================================

function carregarCarteira() {
    try {
        const dadosSalvos = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (dadosSalvos) {
            estado.carteira = JSON.parse(dadosSalvos);
        } else {
            estado.carteira = [];
        }
    } catch (e) {
        console.error('Erro ao ler carteira do LocalStorage:', e);
        estado.carteira = [];
    }
}

function salvarCarteira() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(estado.carteira));
    } catch (e) {
        console.error('Erro ao salvar no LocalStorage:', e);
        mostrarErro('Não foi possível salvar os dados no navegador.');
    }
}

function adicionarInvestimento(event) {
    event.preventDefault();
    esconderFeedbackForm();
    
    const ticker = dom.selectTickerForm.value;
    const quantidade = parseInt(dom.inputQuantidade.value, 10);
    const precoCompra = parseFloat(dom.inputPrecoCompra.value);
    
    if (!TICKERS_PERMITIDOS.includes(ticker)) {
        mostrarFeedbackForm('Selecione uma ação válida.', 'error');
        return;
    }
    
    if (isNaN(quantidade) || quantidade <= 0) {
        mostrarFeedbackForm('Informe uma quantidade de ações válida e maior que zero.', 'error');
        return;
    }
    
    if (isNaN(precoCompra) || precoCompra <= 0) {
        mostrarFeedbackForm('Informe um preço de compra válido e maior que zero.', 'error');
        return;
    }
    
    const novaPosicao = {
        id: 'pos_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        ticker: ticker,
        quantidade: quantidade,
        precoCompra: precoCompra
    };
    
    estado.carteira.push(novaPosicao);
    salvarCarteira();
    
    dom.formAdicionarAtivo.reset();
    mostrarFeedbackForm(`Posição de ${quantidade}x ${ticker} adicionada com sucesso!`, 'success');
    
    renderizarCarteira();
}

function removerInvestimento(idPosicao) {
    estado.carteira = estado.carteira.filter(pos => pos.id !== idPosicao);
    salvarCarteira();
    renderizarCarteira();
}

function mostrarFeedbackForm(mensagem, tipo) {
    dom.mensagemFeedbackForm.textContent = mensagem;
    dom.mensagemFeedbackForm.className = `form-feedback ${tipo}`;
    dom.mensagemFeedbackForm.classList.remove('hidden');
    
    if (tipo === 'success') {
        setTimeout(() => {
            dom.mensagemFeedbackForm.classList.add('hidden');
        }, 4000);
    }
}

function esconderFeedbackForm() {
    dom.mensagemFeedbackForm.classList.add('hidden');
}

function renderizarCarteira() {
    const corpo = dom.corpoTabelaCarteira;
    corpo.innerHTML = '';
    
    if (estado.carteira.length === 0) {
        dom.containerTabelaCarteira.classList.add('hidden');
        dom.estadoVazioCarteira.classList.remove('hidden');
        calcularResumoCarteira();
        return;
    }
    
    dom.containerTabelaCarteira.classList.remove('hidden');
    dom.estadoVazioCarteira.classList.add('hidden');
    
    estado.carteira.forEach(pos => {
        const dadosAcao = estado.cotacoesAtuais[pos.ticker] || {};
        const precoAtual = dadosAcao.regularMarketPrice || pos.precoCompra;
        
        const valorInvestido = pos.quantidade * pos.precoCompra;
        const valorAtual = pos.quantidade * precoAtual;
        const lucroPrejuizo = valorAtual - valorInvestido;
        const rentabilidade = valorInvestido > 0 ? (lucroPrejuizo / valorInvestido) * 100 : 0;
        
        const tr = document.createElement('tr');
        const classeResultado = lucroPrejuizo > 0 ? 'val-positive' : (lucroPrejuizo < 0 ? 'val-negative' : '');
        
        tr.innerHTML = `
            <td><strong>${pos.ticker}</strong></td>
            <td>${pos.quantidade}</td>
            <td>${formatarMoeda(pos.precoCompra)}</td>
            <td>${formatarMoeda(precoAtual)}</td>
            <td>${formatarMoeda(valorInvestido)}</td>
            <td>${formatarMoeda(valorAtual)}</td>
            <td class="${classeResultado}">${formatarMoeda(lucroPrejuizo)}</td>
            <td class="${classeResultado}">${formatarPercentual(rentabilidade)}</td>
            <td class="text-center">
                <button class="btn-danger-sm" onclick="removerInvestimento('${pos.id}')" title="Remover posição">
                    Remover
                </button>
            </td>
        `;
        
        corpo.appendChild(tr);
    });
    
    calcularResumoCarteira();
}

function calcularResumoCarteira() {
    let totalInvestido = 0;
    let valorAtualTotal = 0;
    
    estado.carteira.forEach(pos => {
        const dadosAcao = estado.cotacoesAtuais[pos.ticker] || {};
        const precoAtual = dadosAcao.regularMarketPrice || pos.precoCompra;
        
        totalInvestido += pos.quantidade * pos.precoCompra;
        valorAtualTotal += pos.quantidade * precoAtual;
    });
    
    const lucroPrejuizoTotal = valorAtualTotal - totalInvestido;
    const rentabilidadeTotal = totalInvestido > 0 ? (lucroPrejuizoTotal / totalInvestido) * 100 : 0;
    
    dom.portTotalInvestido.textContent = formatarMoeda(totalInvestido);
    dom.portValorAtual.textContent = formatarMoeda(valorAtualTotal);
    
    dom.portLucroPrejuizo.textContent = formatarMoeda(lucroPrejuizoTotal);
    dom.portLucroPrejuizo.className = 'summary-value';
    if (lucroPrejuizoTotal > 0) {
        dom.portLucroPrejuizo.classList.add('positive');
        dom.portLucroPrejuizo.textContent = '+ ' + formatarMoeda(lucroPrejuizoTotal);
    } else if (lucroPrejuizoTotal < 0) {
        dom.portLucroPrejuizo.classList.add('negative');
    } else {
        dom.portLucroPrejuizo.classList.add('neutral');
    }
    
    dom.portRentabilidade.textContent = formatarPercentual(rentabilidadeTotal);
    dom.portRentabilidade.className = 'summary-value';
    if (rentabilidadeTotal > 0) {
        dom.portRentabilidade.classList.add('positive');
    } else if (rentabilidadeTotal < 0) {
        dom.portRentabilidade.classList.add('negative');
    } else {
        dom.portRentabilidade.classList.add('neutral');
    }
}

window.removerInvestimento = removerInvestimento;

// ==========================================================================
// 9. WALLPAPER 3D EM TELA CHEIA - MATRIZ DE PARTICULAS (COM TOGGLE ON/OFF)
// ==========================================================================

function inicializarMetalOrganismWallpaper() {
    const canvas = dom.canvasOrganismBg;
    if (!canvas || typeof THREE === 'undefined') return;

    // Carrega preferência ON/OFF do LocalStorage
    const prefSalva = localStorage.getItem(LOCAL_STORAGE_3D_KEY);
    if (prefSalva === 'off') {
        estado.wallpaper3DAtivo = false;
        canvas.classList.add('disabled');
        if (dom.btnToggleWallpaper3D) {
            dom.btnToggleWallpaper3D.classList.add('off');
            dom.labelToggle3D.textContent = 'OFF';
        }
    }

    let width = window.innerWidth;
    let height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04060d);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8.5;

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

    // Iluminação Especular
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 6, 100);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // MATRIZ DE PARTICULAS OTIMIZADA (550 ESFERAS COM 60 FPS ULTRA LEVE)
    const particleCount = 550;
    const sphereGeo = new THREE.SphereGeometry(0.065, 14, 14);
    
    const material = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x1d4ed8,
        emissiveIntensity: 0.85,
        roughness: 0.2,
        metalness: 0.8
    });

    const instancedMesh = new THREE.InstancedMesh(sphereGeo, material, particleCount);
    
    const basePositions = [];
    const baseScales = [];
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const emissiveColor = new THREE.Color();

    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < particleCount; i++) {
        const layer = Math.floor(i / 110) + 1;
        const indexInLayer = i % 110;
        
        const y = 1 - (indexInLayer / (110 - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * indexInLayer;

        const r = (layer / 5) * 3.2;
        const x = Math.cos(theta) * radiusAtY * r;
        const z = Math.sin(theta) * radiusAtY * r;
        const yPos = y * r;

        basePositions.push({ x, y: yPos, z, r, layer });
        baseScales.push(Math.random() * 0.35 + 0.85);

        dummy.position.set(x, yPos, z);
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);

        color.setHSL(0.60 - (layer * 0.03), 0.90, 0.55);
        instancedMesh.setColorAt(i, color);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
    scene.add(instancedMesh);

    // INTERAÇÃO DO MOUSE EM TELA CHEIA 3D
    const mouse3D = new THREE.Vector3(9999, 9999, 0);
    let targetRotX = 0;
    let targetRotY = 0;

    window.addEventListener('mousemove', (e) => {
        if (!estado.wallpaper3DAtivo) return;

        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;

        mouse3D.set(normX * 4.8, normY * 3.4, 0);

        targetRotX = normY * 0.3;
        targetRotY = normX * 0.3;
    });

    let clock = new THREE.Clock();
    let currentHSL = { ...targetColorObj.hsl };

    function animate() {
        requestAnimationFrame(animate);

        // Se o fundo estiver desligado, economiza 100% de processamento da GPU
        if (!estado.wallpaper3DAtivo) return;

        const elapsedTime = clock.getElapsedTime();

        // Rotação suave do plano de fundo
        instancedMesh.rotation.y += (targetRotY - instancedMesh.rotation.y) * 0.03;
        instancedMesh.rotation.x += (targetRotX - instancedMesh.rotation.x) * 0.03;
        instancedMesh.rotation.z = Math.sin(elapsedTime * 0.12) * 0.04;

        // LERP SUAVE DA COR EM DIREÇÃO À AÇÃO SELECIONADA (PETR4, VALE3, ITUB4, MGLU3)
        currentHSL.h += (targetColorObj.hsl.h - currentHSL.h) * 0.06;
        currentHSL.s += (targetColorObj.hsl.s - currentHSL.s) * 0.06;
        currentHSL.l += (targetColorObj.hsl.l - currentHSL.l) * 0.06;

        emissiveColor.setHSL(currentHSL.h, currentHSL.s, currentHSL.l * 0.7);
        material.emissive.copy(emissiveColor);
        pointLight.color.setHSL(currentHSL.h, currentHSL.s, currentHSL.l);

        // Respiração hipnótica lenta e repulsão magnética do cursor
        for (let i = 0; i < particleCount; i++) {
            const pos = basePositions[i];
            
            const slowPulseWave = Math.sin(pos.r * 1.8 - elapsedTime * 0.65);
            const expansionFactor = 1 + slowPulseWave * 0.28;
            
            const pX = pos.x * expansionFactor;
            const pY = pos.y * expansionFactor;
            const pZ = pos.z * expansionFactor;

            // Repulsão magnética do mouse
            const dx = pX - mouse3D.x;
            const dy = pY - mouse3D.y;
            const dz = pZ - mouse3D.z;
            const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

            let pushX = 0, pushY = 0, pushZ = 0;
            const mouseRadius = 2.4;

            if (distToMouse < mouseRadius) {
                const force = (1 - distToMouse / mouseRadius);
                const pushAmount = Math.sin(force * Math.PI) * 0.85;
                pushX = (dx / (distToMouse + 0.001)) * pushAmount;
                pushY = (dy / (distToMouse + 0.001)) * pushAmount;
                pushZ = (dz / (distToMouse + 0.001)) * pushAmount;
            }

            const finalX = pX + pushX;
            const finalY = pY + pushY;
            const finalZ = pZ + pushZ;

            const isMouseNear = distToMouse < mouseRadius;
            const mouseScaleBonus = isMouseNear ? 1.45 : 1.0;
            const scaleFactor = (0.75 + Math.cos(pos.r * 2.5 - elapsedTime * 0.65) * 0.35) * baseScales[i] * mouseScaleBonus;

            dummy.position.set(finalX, finalY, finalZ);
            dummy.scale.set(scaleFactor, scaleFactor, scaleFactor);
            dummy.updateMatrix();

            instancedMesh.setMatrixAt(i, dummy.matrix);

            const particleHue = (currentHSL.h + Math.sin(pos.r * 1.2 + elapsedTime * 0.3) * 0.03 + 1.0) % 1.0;
            const lightness = isMouseNear ? 0.75 : currentHSL.l * (0.8 + (slowPulseWave + 1) * 0.2);
            color.setHSL(particleHue, currentHSL.s, lightness);
            instancedMesh.setColorAt(i, color);
        }

        instancedMesh.instanceMatrix.needsUpdate = true;
        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
    });

    // Seletor de cores das ações no cabeçalho
    const presetsContainer = document.getElementById('presetsCorWallpaper');
    if (presetsContainer) {
        presetsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-preset-dot');
            if (!btn) return;

            const ticker = btn.getAttribute('data-ticker');
            if (!ticker || !CORES_ACOES_3D[ticker]) return;

            presetsContainer.querySelectorAll('.btn-preset-dot').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const btnSeletor = dom.seletorTickers.querySelector(`.btn-ticker[data-ticker="${ticker}"]`);
            if (btnSeletor) {
                dom.seletorTickers.querySelectorAll('.btn-ticker').forEach(b => b.classList.remove('active'));
                btnSeletor.classList.add('active');
            }

            estado.tickerSelecionado = ticker;
            targetColorObj = CORES_ACOES_3D[ticker];

            renderizarDetalhesAcao(estado.tickerSelecionado);
            renderizarGraficoHistorico(estado.tickerSelecionado, estado.periodoSelecionado);
        });
    }

    // BOTÃO DE LIGAR / DESLIGAR FUNDO 3D
    if (dom.btnToggleWallpaper3D) {
        dom.btnToggleWallpaper3D.addEventListener('click', () => {
            estado.wallpaper3DAtivo = !estado.wallpaper3DAtivo;
            
            if (estado.wallpaper3DAtivo) {
                canvas.classList.remove('disabled');
                dom.btnToggleWallpaper3D.classList.remove('off');
                dom.btnToggleWallpaper3D.classList.add('active');
                dom.labelToggle3D.textContent = 'ON';
                localStorage.setItem(LOCAL_STORAGE_3D_KEY, 'on');
            } else {
                canvas.classList.add('disabled');
                dom.btnToggleWallpaper3D.classList.remove('active');
                dom.btnToggleWallpaper3D.classList.add('off');
                dom.labelToggle3D.textContent = 'OFF';
                localStorage.setItem(LOCAL_STORAGE_3D_KEY, 'off');
            }
        });
    }
}

// ==========================================================================
// 10. FLUXO PRINCIPAL DE ATUALIZAÇÃO DO DASHBOARD
// ==========================================================================

async function carregarDadosPeriodo(range, forcarAtualizacao = false) {
    dom.chartLoadingOverlay.classList.remove('hidden');
    dom.compareLoadingOverlay.classList.remove('hidden');
    
    if (forcarAtualizacao) {
        delete estado.historicosCache[range];
    }
    
    try {
        await buscarTodosHistoricos(range);
        renderizarDetalhesAcao(estado.tickerSelecionado);
        renderizarGraficoHistorico(estado.tickerSelecionado, range);
        renderizarGraficoComparacao(range);
    } catch (e) {
        console.error('Erro ao carregar dados do período:', e);
    } finally {
        dom.chartLoadingOverlay.classList.add('hidden');
        dom.compareLoadingOverlay.classList.add('hidden');
    }
}

async function atualizarDashboard() {
    esconderErro();
    dom.btnAtualizarDados.classList.add('updating');
    dom.btnAtualizarDados.disabled = true;
    
    try {
        await buscarTodasCotacoes();
        await carregarDadosPeriodo(estado.periodoSelecionado, true);
        renderizarCarteira();
        atualizarHorarioUltimaConsulta();
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    } finally {
        dom.btnAtualizarDados.classList.remove('updating');
        setTimeout(() => {
            dom.btnAtualizarDados.disabled = false;
        }, 3000);
    }
}

// ==========================================================================
// 11. EVENT LISTENERS E INICIALIZAÇÃO
// ==========================================================================

function inicializarEventos() {
    dom.btnAtualizarDados.addEventListener('click', () => {
        atualizarDashboard();
    });
    
    dom.btnFecharErro.addEventListener('click', esconderErro);
    
    dom.seletorTickers.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ticker');
        if (!btn) return;
        
        const novoTicker = btn.getAttribute('data-ticker');
        if (novoTicker === estado.tickerSelecionado) return;
        
        dom.seletorTickers.querySelectorAll('.btn-ticker').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (CORES_ACOES_3D[novoTicker]) {
            targetColorObj = CORES_ACOES_3D[novoTicker];
            
            const presetsHeader = document.getElementById('presetsCorWallpaper');
            if (presetsHeader) {
                presetsHeader.querySelectorAll('.btn-preset-dot').forEach(b => {
                    if (b.getAttribute('data-ticker') === novoTicker) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
            }
        }
        
        estado.tickerSelecionado = novoTicker;
        
        renderizarDetalhesAcao(estado.tickerSelecionado);
        renderizarGraficoHistorico(estado.tickerSelecionado, estado.periodoSelecionado);
    });
    
    dom.seletorPeriodo.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-period');
        if (!btn) return;
        
        const novoRange = btn.getAttribute('data-range');
        if (novoRange === estado.periodoSelecionado) return;
        
        dom.seletorPeriodo.querySelectorAll('.btn-period').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        estado.periodoSelecionado = novoRange;
        carregarDadosPeriodo(estado.periodoSelecionado);
    });
    
    dom.grupoComparacao.addEventListener('change', () => {
        renderizarGraficoComparacao(estado.periodoSelecionado);
    });
    
    dom.formAdicionarAtivo.addEventListener('submit', adicionarInvestimento);
}

async function init() {
    carregarCarteira();
    inicializarEventos();
    inicializarMetalOrganismWallpaper();
    await atualizarDashboard();
}

document.addEventListener('DOMContentLoaded', init);
