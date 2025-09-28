// Variáveis globais
let chart = null;
let currentFunction = 'sen(x)';

// Inicialização quando a página carrega
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    plotFunction('sen(x)'); // Função padrão inicial
}

function setupEventListeners() {
    const input = document.getElementById('function-input');
    const plotButton = document.getElementById('plot-button');
    const presetButtons = document.querySelectorAll('.preset-btn');

    // Event listener para o botão de plotar
    plotButton.addEventListener('click', () => {
        const functionText = input.value.trim();
        if (functionText) {
            plotFunction(functionText);
        }
    });

    // Event listener para Enter no input
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const functionText = input.value.trim();
            if (functionText) {
                plotFunction(functionText);
            }
        }
    });

    // Event listeners para botões pré-definidos
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const functionText = button.getAttribute('data-function');
            input.value = functionText;
            plotFunction(functionText);
        });
    });
}

function plotFunction(functionText) {
    try {
        currentFunction = functionText;
        
        // Parse da função
        const parsedFunction = parseFunction(functionText);
        
        // Gerar dados para o gráfico
        const data = generatePlotData(parsedFunction);
        
        // Criar/atualizar gráfico
        createChart(data, functionText);
        
        // Analisar função
        analyzeFunction(parsedFunction, functionText);
        
        // Gerar comparação
        generateComparison(parsedFunction, functionText);
        
    } catch (error) {
        console.error('Erro ao plotar função:', error);
        showError('Erro ao interpretar a função. Verifique a sintaxe e tente novamente.');
    }
}

function parseFunction(functionText) {
    // Normalizar a entrada
    let normalized = functionText.toLowerCase()
        .replace(/\s+/g, '') // Remove espaços
        .replace(/sen/g, 'sin') // Converte sen para sin
        .replace(/cos/g, 'cos') // Mantém cos
        .replace(/\^/g, '**'); // Converte ^ para **

    // Extrair parâmetros da função trigonométrica
    const result = {
        type: 'sin', // padrão
        amplitude: 1,
        frequency: 1,
        phaseShift: 0,
        verticalShift: 0,
        isNegative: false,
        originalFunction: functionText,
        normalizedFunction: normalized
    };

    // Detectar se é negativo no início
    if (normalized.startsWith('-')) {
        result.isNegative = true;
        normalized = normalized.substring(1);
    }

    // Detectar tipo de função (sin ou cos)
    if (normalized.includes('cos')) {
        result.type = 'cos';
    }

    // Extrair amplitude (coeficiente antes da função)
    const amplitudeMatch = normalized.match(/^(\d*\.?\d*)\*/);
    if (amplitudeMatch && amplitudeMatch[1]) {
        result.amplitude = parseFloat(amplitudeMatch[1]);
        normalized = normalized.replace(/^\d*\.?\d*\*/, '');
    }

    // Extrair o conteúdo dentro dos parênteses
    const innerMatch = normalized.match(/(sin|cos)\(([^)]+)\)/);
    if (innerMatch) {
        const innerExpression = innerMatch[2];
        
        // Analisar a expressão interna: ax + b ou ax - b
        const innerParts = parseInnerExpression(innerExpression);
        result.frequency = innerParts.frequency;
        result.phaseShift = innerParts.phaseShift;
    }

    // Extrair deslocamento vertical (+ ou - no final)
    const verticalMatch = normalized.match(/([+-]\d*\.?\d*)$/);
    if (verticalMatch) {
        result.verticalShift = parseFloat(verticalMatch[1]);
    }

    // Aplicar sinal negativo à amplitude
    if (result.isNegative) {
        result.amplitude = -result.amplitude;
    }

    return result;
}

function parseInnerExpression(expr) {
    const result = { frequency: 1, phaseShift: 0 };
    
    // Remover espaços
    expr = expr.replace(/\s+/g, '');
    
    // Casos especiais
    if (expr === 'x') {
        return result;
    }
    
    // Padrão: coeficiente*x + constante ou coeficiente*x - constante
    // Primeiro, extrair o coeficiente de x
    let freqMatch = expr.match(/^(\d*\.?\d*)x/);
    if (freqMatch) {
        if (freqMatch[1] === '' || freqMatch[1] === '+') {
            result.frequency = 1;
        } else if (freqMatch[1] === '-') {
            result.frequency = -1;
        } else {
            result.frequency = parseFloat(freqMatch[1]);
        }
    } else if (expr.match(/^x/)) {
        result.frequency = 1;
    } else {
        // Caso onde não há x explícito, como em "2" (seria 2*x)
        const numMatch = expr.match(/^(\d*\.?\d*)$/);
        if (numMatch && numMatch[1]) {
            result.frequency = parseFloat(numMatch[1]);
        }
    }
    
    // Extrair a constante (deslocamento de fase)
    const constMatch = expr.match(/([+-]\d*\.?\d*)$/);
    if (constMatch) {
        const constValue = parseFloat(constMatch[1]);
        // O deslocamento de fase é -C/B onde a expressão é B(x - C)
        result.phaseShift = -constValue / result.frequency;
    }
    
    return result;
}

function generatePlotData(parsedFunction) {
    const points = [];
    const standardPoints = [];
    
    // Determinar o range baseado na frequência para mostrar pelo menos 2 períodos completos
    const period = (2 * Math.PI) / Math.abs(parsedFunction.frequency);
    const range = Math.max(4 * Math.PI, 2 * period);
    const step = range / 500; // 500 pontos para suavidade
    
    for (let x = -range/2; x <= range/2; x += step) {
        // Função personalizada
        const y = calculateFunctionValue(x, parsedFunction);
        points.push({ x: x, y: y });
        
        // Função padrão para comparação
        const standardY = parsedFunction.type === 'sin' ? Math.sin(x) : Math.cos(x);
        standardPoints.push({ x: x, y: standardY });
    }
    
    return {
        userFunction: points,
        standardFunction: standardPoints,
        range: range
    };
}

function calculateFunctionValue(x, params) {
    const { type, amplitude, frequency, phaseShift, verticalShift } = params;
    
    // Calcular o argumento da função trigonométrica
    const argument = frequency * (x - phaseShift);
    
    // Calcular o valor base
    let baseValue;
    if (type === 'sin') {
        baseValue = Math.sin(argument);
    } else {
        baseValue = Math.cos(argument);
    }
    
    // Aplicar transformações
    return amplitude * baseValue + verticalShift;
}

function createChart(data, functionText) {
    const ctx = document.getElementById('function-chart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (chart) {
        chart.destroy();
    }
    
    // Configurar dados do gráfico
    const chartData = {
        datasets: [
            {
                label: `Função padrão (${data.userFunction[0] && data.userFunction[0].y !== undefined ? 'sin(x)' : 'cos(x)'})`,
                data: data.standardFunction,
                borderColor: 'rgba(156, 163, 175, 0.8)',
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                borderDash: [5, 5]
            },
            {
                label: functionText,
                data: data.userFunction,
                borderColor: 'rgba(37, 99, 235, 1)',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: false,
                pointRadius: 0
            }
        ]
    };
    
    // Configurações do gráfico
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: (${context.parsed.x.toFixed(3)}, ${context.parsed.y.toFixed(3)})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'center',
                    title: {
                        display: true,
                        text: 'x (radianos)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        callback: function(value) {
                            // Mostrar múltiplos de π/2
                            const piMultiple = value / (Math.PI / 2);
                            if (Math.abs(piMultiple - Math.round(piMultiple)) < 0.1) {
                                const rounded = Math.round(piMultiple);
                                if (rounded === 0) return '0';
                                if (rounded === 1) return 'π/2';
                                if (rounded === -1) return '-π/2';
                                if (rounded === 2) return 'π';
                                if (rounded === -2) return '-π';
                                if (rounded % 2 === 0) return `${rounded/2}π`;
                                return `${rounded}π/2`;
                            }
                            return '';
                        },
                        maxTicksLimit: 15
                    }
                },
                y: {
                    position: 'center',
                    title: {
                        display: true,
                        text: 'y',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)',
                        lineWidth: 1
                    },
                    ticks: {
                        stepSize: 0.5
                    }
                }
            },
            elements: {
                line: {
                    tension: 0
                }
            }
        }
    };
    
    // Criar novo gráfico
    chart = new Chart(ctx, config);
}

function analyzeFunction(parsedFunction, functionText) {
    const analysisDiv = document.getElementById('function-analysis');
    
    const { type, amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    
    // Calcular propriedades derivadas
    const period = (2 * Math.PI) / Math.abs(frequency);
    const maxValue = Math.abs(amplitude) + verticalShift;
    const minValue = -Math.abs(amplitude) + verticalShift;
    
    let html = `
        <div class="parameter-grid">
            <div class="parameter-item">
                <div class="parameter-label">Função Original:</div>
                <div class="parameter-value">${functionText}</div>
                <div class="parameter-description">Função inserida pelo usuário</div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Tipo:</div>
                <div class="parameter-value">${type === 'sin' ? 'Seno' : 'Cosseno'}</div>
                <div class="parameter-description">Função trigonométrica base</div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Amplitude:</div>
                <div class="parameter-value">${amplitude}</div>
                <div class="parameter-description">
                    ${Math.abs(amplitude) === 1 ? 
                        'Amplitude padrão - altura máxima de 1' : 
                        `Amplitude ${Math.abs(amplitude) > 1 ? 'aumentada' : 'diminuída'} - altura máxima de ${Math.abs(amplitude)}`
                    }
                    ${amplitude < 0 ? ' (função invertida)' : ''}
                </div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Frequência:</div>
                <div class="parameter-value">${frequency}</div>
                <div class="parameter-description">
                    ${frequency === 1 ? 
                        'Frequência padrão' : 
                        frequency > 1 ? 
                            `Função ${frequency}x mais rápida` : 
                            `Função ${1/frequency}x mais lenta`
                    }
                </div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Período:</div>
                <div class="parameter-value">${period.toFixed(3)} rad (${(period * 180 / Math.PI).toFixed(1)}°)</div>
                <div class="parameter-description">
                    ${period === 2 * Math.PI ? 
                        'Período padrão de 2π' : 
                        period > 2 * Math.PI ? 
                            'Período aumentado - ciclo mais longo' : 
                            'Período diminuído - ciclo mais curto'
                    }
                </div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Deslocamento Horizontal:</div>
                <div class="parameter-value">${phaseShift === 0 ? '0' : phaseShift.toFixed(3)} rad</div>
                <div class="parameter-description">
                    ${phaseShift === 0 ? 
                        'Sem deslocamento horizontal' : 
                        phaseShift > 0 ? 
                            `Deslocado ${phaseShift.toFixed(3)} rad para a direita` : 
                            `Deslocado ${Math.abs(phaseShift).toFixed(3)} rad para a esquerda`
                    }
                </div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Deslocamento Vertical:</div>
                <div class="parameter-value">${verticalShift === 0 ? '0' : verticalShift}</div>
                <div class="parameter-description">
                    ${verticalShift === 0 ? 
                        'Sem deslocamento vertical' : 
                        verticalShift > 0 ? 
                            `Deslocado ${verticalShift} unidades para cima` : 
                            `Deslocado ${Math.abs(verticalShift)} unidades para baixo`
                    }
                </div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Valor Máximo:</div>
                <div class="parameter-value">${maxValue}</div>
                <div class="parameter-description">Ponto mais alto da função</div>
            </div>
            
            <div class="parameter-item">
                <div class="parameter-label">Valor Mínimo:</div>
                <div class="parameter-value">${minValue}</div>
                <div class="parameter-description">Ponto mais baixo da função</div>
            </div>
        </div>
    `;
    
    analysisDiv.innerHTML = html;
}

function generateComparison(parsedFunction, functionText) {
    const comparisonDiv = document.getElementById('comparison-content');
    
    const { type, amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    const standardFunction = type === 'sin' ? 'sen(x)' : 'cos(x)';
    
    let comparison = `<p><strong>Comparando ${functionText} com ${standardFunction}:</strong></p>`;
    
    // Análise da amplitude
    if (Math.abs(amplitude) !== 1) {
        if (amplitude < 0) {
            comparison += `<p>• <span class="highlight-change">Amplitude alterada e função invertida</span>: A amplitude foi multiplicada por ${Math.abs(amplitude)} e a função foi refletida no eixo x. Enquanto ${standardFunction} varia entre -1 e 1, sua função varia entre ${-Math.abs(amplitude)} e ${Math.abs(amplitude)}, mas invertida.</p>`;
        } else {
            comparison += `<p>• <span class="highlight-change">Amplitude alterada</span>: A amplitude foi multiplicada por ${amplitude}. Enquanto ${standardFunction} varia entre -1 e 1, sua função varia entre ${-amplitude} e ${amplitude}.</p>`;
        }
    } else if (amplitude < 0) {
        comparison += `<p>• <span class="highlight-change">Função invertida</span>: A função foi refletida no eixo x. Os valores positivos se tornaram negativos e vice-versa.</p>`;
    } else {
        comparison += `<p>• <span class="highlight-standard">Amplitude padrão</span>: A amplitude permanece 1, variando entre -1 e 1 como a função padrão.</p>`;
    }
    
    // Análise da frequência/período
    if (frequency !== 1) {
        const period = (2 * Math.PI) / Math.abs(frequency);
        const standardPeriod = 2 * Math.PI;
        
        if (frequency > 1) {
            comparison += `<p>• <span class="highlight-change">Período diminuído</span>: A frequência foi multiplicada por ${frequency}, fazendo a função completar ${frequency} ciclos no mesmo espaço onde ${standardFunction} completa 1 ciclo. O período mudou de ${standardPeriod.toFixed(3)} para ${period.toFixed(3)} radianos.</p>`;
        } else {
            comparison += `<p>• <span class="highlight-change">Período aumentado</span>: A frequência foi multiplicada por ${frequency}, fazendo a função completar 1 ciclo no espaço onde ${standardFunction} completaria ${1/frequency} ciclos. O período mudou de ${standardPeriod.toFixed(3)} para ${period.toFixed(3)} radianos.</p>`;
        }
    } else {
        comparison += `<p>• <span class="highlight-standard">Período padrão</span>: O período permanece 2π radianos, igual à função padrão.</p>`;
    }
    
    // Análise do deslocamento horizontal
    if (phaseShift !== 0) {
        const direction = phaseShift > 0 ? 'direita' : 'esquerda';
        comparison += `<p>• <span class="highlight-change">Deslocamento horizontal</span>: A função foi deslocada ${Math.abs(phaseShift).toFixed(3)} radianos para a ${direction}. Todos os pontos característicos (máximos, mínimos, zeros) foram movidos horizontalmente.</p>`;
    } else {
        comparison += `<p>• <span class="highlight-standard">Sem deslocamento horizontal</span>: A função mantém a mesma posição horizontal da função padrão.</p>`;
    }
    
    // Análise do deslocamento vertical
    if (verticalShift !== 0) {
        const direction = verticalShift > 0 ? 'cima' : 'baixo';
        comparison += `<p>• <span class="highlight-change">Deslocamento vertical</span>: A função foi deslocada ${Math.abs(verticalShift)} unidades para ${direction}. O eixo central da oscilação mudou de y=0 para y=${verticalShift}.</p>`;
    } else {
        comparison += `<p>• <span class="highlight-standard">Sem deslocamento vertical</span>: A função oscila em torno de y=0, igual à função padrão.</p>`;
    }
    
    // Resumo das transformações
    comparison += `<p><strong>Resumo das transformações aplicadas:</strong></p>`;
    comparison += `<p>Partindo de ${standardFunction}, aplicamos as seguintes modificações para obter ${functionText}:</p>`;
    comparison += `<ul>`;
    
    if (Math.abs(amplitude) !== 1) {
        comparison += `<li>Multiplicação por ${amplitude} (${amplitude < 0 ? 'inversão e ' : ''}alteração de amplitude)</li>`;
    }
    if (frequency !== 1) {
        comparison += `<li>Multiplicação do argumento por ${frequency} (alteração de frequência)</li>`;
    }
    if (phaseShift !== 0) {
        comparison += `<li>Subtração de ${phaseShift.toFixed(3)} do argumento (deslocamento horizontal)</li>`;
    }
    if (verticalShift !== 0) {
        comparison += `<li>Adição de ${verticalShift} ao resultado (deslocamento vertical)</li>`;
    }
    
    if (amplitude === 1 && frequency === 1 && phaseShift === 0 && verticalShift === 0) {
        comparison += `<li>Nenhuma transformação - função padrão</li>`;
    }
    
    comparison += `</ul>`;
    
    comparisonDiv.innerHTML = comparison;
}

function showError(message) {
    const analysisDiv = document.getElementById('function-analysis');
    analysisDiv.innerHTML = `
        <div style="color: #ef4444; padding: 20px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
            <strong>Erro:</strong> ${message}
        </div>
    `;
    
    const comparisonDiv = document.getElementById('comparison-content');
    comparisonDiv.innerHTML = `<p style="color: #6b7280;">Corrija a função para ver a comparação.</p>`;
}


// Funcionalidades extras para análise avançada

function addAdvancedAnalysis(parsedFunction, functionText) {
    const analysisDiv = document.getElementById('function-analysis');
    const currentContent = analysisDiv.innerHTML;
    
    // Adicionar seção de pontos importantes
    const importantPoints = calculateImportantPoints(parsedFunction);
    
    const advancedHtml = `
        <div class="parameter-item" style="margin-top: 20px; background: #f0f9ff; border-left-color: #0ea5e9;">
            <div class="parameter-label">Pontos Importantes:</div>
            <div class="parameter-description">
                <strong>Zeros da função:</strong> x = ${importantPoints.zeros.slice(0, 3).map(x => x.toFixed(3)).join(', ')}...<br>
                <strong>Máximos:</strong> x = ${importantPoints.maxima.slice(0, 3).map(x => x.toFixed(3)).join(', ')}...<br>
                <strong>Mínimos:</strong> x = ${importantPoints.minima.slice(0, 3).map(x => x.toFixed(3)).join(', ')}...
            </div>
        </div>
        
        <div class="parameter-item" style="background: #f0fdf4; border-left-color: #22c55e;">
            <div class="parameter-label">Dica Educativa:</div>
            <div class="parameter-description">
                ${generateEducationalTip(parsedFunction)}
            </div>
        </div>
    `;
    
    analysisDiv.innerHTML = currentContent + advancedHtml;
}

function calculateImportantPoints(parsedFunction) {
    const { type, amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    
    const zeros = [];
    const maxima = [];
    const minima = [];
    
    // Calcular alguns pontos importantes no intervalo [-2π, 2π]
    for (let k = -4; k <= 4; k++) {
        if (type === 'sin') {
            // Zeros do seno: x = kπ/frequency + phaseShift
            zeros.push(k * Math.PI / frequency + phaseShift);
            
            // Máximos do seno: x = (π/2 + 2kπ)/frequency + phaseShift
            maxima.push((Math.PI/2 + 2*k*Math.PI) / frequency + phaseShift);
            
            // Mínimos do seno: x = (3π/2 + 2kπ)/frequency + phaseShift
            minima.push((3*Math.PI/2 + 2*k*Math.PI) / frequency + phaseShift);
        } else {
            // Zeros do cosseno: x = (π/2 + kπ)/frequency + phaseShift
            zeros.push((Math.PI/2 + k*Math.PI) / frequency + phaseShift);
            
            // Máximos do cosseno: x = (2kπ)/frequency + phaseShift
            maxima.push((2*k*Math.PI) / frequency + phaseShift);
            
            // Mínimos do cosseno: x = (π + 2kπ)/frequency + phaseShift
            minima.push((Math.PI + 2*k*Math.PI) / frequency + phaseShift);
        }
    }
    
    return {
        zeros: zeros.filter(x => x >= -2*Math.PI && x <= 2*Math.PI).sort((a, b) => a - b),
        maxima: maxima.filter(x => x >= -2*Math.PI && x <= 2*Math.PI).sort((a, b) => a - b),
        minima: minima.filter(x => x >= -2*Math.PI && x <= 2*Math.PI).sort((a, b) => a - b)
    };
}

function generateEducationalTip(parsedFunction) {
    const { type, amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    
    const tips = [];
    
    if (Math.abs(amplitude) > 1) {
        tips.push(`A amplitude ${Math.abs(amplitude)} significa que a função oscila ${Math.abs(amplitude)}x mais intensamente que a função padrão.`);
    } else if (Math.abs(amplitude) < 1 && amplitude !== 0) {
        tips.push(`A amplitude ${Math.abs(amplitude)} significa que a função oscila com menor intensidade que a função padrão.`);
    }
    
    if (amplitude < 0) {
        tips.push(`O sinal negativo inverte a função: onde antes subia, agora desce, e vice-versa.`);
    }
    
    if (frequency > 1) {
        tips.push(`A frequência ${frequency} faz a função completar ${frequency} ciclos no espaço de um ciclo padrão - ela "acelera".`);
    } else if (frequency < 1 && frequency > 0) {
        tips.push(`A frequência ${frequency} faz a função completar apenas ${frequency} ciclos no espaço de um ciclo padrão - ela "desacelera".`);
    }
    
    if (phaseShift !== 0) {
        const direction = phaseShift > 0 ? 'direita' : 'esquerda';
        tips.push(`O deslocamento horizontal move toda a função ${Math.abs(phaseShift).toFixed(2)} radianos para a ${direction}.`);
    }
    
    if (verticalShift !== 0) {
        const direction = verticalShift > 0 ? 'cima' : 'baixo';
        tips.push(`O deslocamento vertical move o "centro" da oscilação ${Math.abs(verticalShift)} unidades para ${direction}.`);
    }
    
    if (tips.length === 0) {
        return `Esta é a função trigonométrica padrão! É a base para todas as outras transformações.`;
    }
    
    return tips.join(' ');
}

// Atualizar a função plotFunction para incluir análise avançada
const originalPlotFunction = plotFunction;
plotFunction = function(functionText) {
    try {
        currentFunction = functionText;
        
        // Parse da função
        const parsedFunction = parseFunction(functionText);
        
        // Gerar dados para o gráfico
        const data = generatePlotData(parsedFunction);
        
        // Criar/atualizar gráfico
        createChart(data, functionText);
        
        // Analisar função
        analyzeFunction(parsedFunction, functionText);
        
        // Adicionar análise avançada
        addAdvancedAnalysis(parsedFunction, functionText);
        
        // Gerar comparação
        generateComparison(parsedFunction, functionText);
        
    } catch (error) {
        console.error('Erro ao plotar função:', error);
        showError('Erro ao interpretar a função. Verifique a sintaxe e tente novamente.');
    }
};

// Função para destacar mudanças no gráfico
function highlightChanges(parsedFunction) {
    const { amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    
    let changes = [];
    
    if (Math.abs(amplitude) !== 1) {
        changes.push(`amplitude ${amplitude}`);
    }
    if (frequency !== 1) {
        changes.push(`frequência ${frequency}`);
    }
    if (phaseShift !== 0) {
        changes.push(`fase ${phaseShift > 0 ? '+' : ''}${phaseShift.toFixed(2)}`);
    }
    if (verticalShift !== 0) {
        changes.push(`vertical ${verticalShift > 0 ? '+' : ''}${verticalShift}`);
    }
    
    return changes.length > 0 ? changes.join(', ') : 'função padrão';
}

// Adicionar validação de entrada mais robusta
function validateFunction(functionText) {
    // Lista de padrões válidos
    const validPatterns = [
        /^-?\d*\.?\d*\*?(sen|cos|sin)\([^)]+\)([+-]\d*\.?\d*)?$/i,
        /^(sen|cos|sin)\([^)]+\)([+-]\d*\.?\d*)?$/i,
        /^-?\d*\.?\d*\*(sen|cos|sin)\([^)]+\)([+-]\d*\.?\d*)?$/i
    ];
    
    const normalized = functionText.toLowerCase().replace(/\s+/g, '');
    
    return validPatterns.some(pattern => pattern.test(normalized));
}

// Melhorar o tratamento de erros
function showError(message) {
    const analysisDiv = document.getElementById('function-analysis');
    analysisDiv.innerHTML = `
        <div style="color: #ef4444; padding: 20px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #ef4444;">
            <strong>⚠️ Erro:</strong> ${message}
            <br><br>
            <strong>Exemplos válidos:</strong>
            <ul style="margin-top: 10px; padding-left: 20px;">
                <li><code>sen(x)</code> ou <code>sin(x)</code></li>
                <li><code>cos(x)</code></li>
                <li><code>2*sen(x)</code></li>
                <li><code>sen(2x)</code></li>
                <li><code>sen(x-1)+2</code></li>
                <li><code>-3*cos(0.5x+1)-1</code></li>
            </ul>
        </div>
    `;
    
    const comparisonDiv = document.getElementById('comparison-content');
    comparisonDiv.innerHTML = `<p style="color: #6b7280;">Corrija a função para ver a comparação.</p>`;
}
