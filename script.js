// Visualizador de Funções Trigonométricas - Versão Aprimorada
// Variáveis globais
let chart = null;
let currentFunction = 'sen(x)';

// Inicialização
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
    const clearButton = document.getElementById('clear-button');

    // Botão plotar
    plotButton.addEventListener('click', handlePlotClick);
    
    // Enter no input
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handlePlotClick();
        }
    });

    // Botões pré-definidos
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const functionText = button.getAttribute('data-function');
            input.value = functionText;
            plotFunction(functionText);
        });
    });

    // Botão limpar
    if (clearButton) {
        clearButton.addEventListener('click', () => {
            input.value = '';
            input.focus();
        });
    }
}

function handlePlotClick() {
    const input = document.getElementById('function-input');
    const functionText = input.value.trim();
    
    if (!functionText) {
        showError('Por favor, digite uma função trigonométrica.');
        return;
    }
    
    plotFunction(functionText);
}

function plotFunction(functionText) {
    try {
        // Limpar erros anteriores
        clearError();
        
        // Parse da função com validação aprimorada
        const parsedFunction = parseFunction(functionText);
        
        if (!parsedFunction.isValid) {
            throw new Error(parsedFunction.error || 'Função inválida');
        }
        
        // Gerar dados para o gráfico
        const data = generatePlotData(parsedFunction);
        
        // Criar/atualizar gráfico com destruição completa
        destroyChart();
        createChart(data, functionText);
        
        // Analisar função
        analyzeFunction(parsedFunction, functionText);
        
        // Gerar comparação
        generateComparison(parsedFunction, functionText);
        
        // Atualizar função atual
        currentFunction = functionText;
        
    } catch (error) {
        console.error('Erro ao plotar função:', error);
        showError(error.message || 'Erro ao interpretar a função. Verifique a sintaxe.');
    }
}

function parseFunction(functionText) {
    try {
        // Normalizar entrada
        let normalized = functionText.toLowerCase()
            .replace(/\s+/g, '') // Remove espaços
            .replace(/sen/g, 'sin') // Converte sen para sin
            .replace(/\^/g, '**') // Converte ^ para **
            .replace(/π/g, 'pi') // Converte π para pi
            .replace(/pi/g, Math.PI.toString()); // Converte pi para valor numérico

        // Resultado padrão
        const result = {
            type: 'sin',
            amplitude: 1,
            frequency: 1,
            phaseShift: 0,
            verticalShift: 0,
            originalFunction: functionText,
            normalizedFunction: normalized,
            isValid: true,
            error: null
        };

        // Validação básica
        if (!normalized.includes('sin') && !normalized.includes('cos')) {
            result.isValid = false;
            result.error = 'Função deve conter sen() ou cos()';
            return result;
        }

        // Detectar tipo de função
        if (normalized.includes('cos')) {
            result.type = 'cos';
        }

        // Padrão de função trigonométrica: A*func(B*x + C) + D
        // Onde A = amplitude, B = frequência, C = deslocamento de fase, D = deslocamento vertical
        
        // Extrair deslocamento vertical (último termo)
        const verticalMatch = normalized.match(/([+-]\d*\.?\d+)(?!.*[sincos])/);
        if (verticalMatch) {
            result.verticalShift = parseFloat(verticalMatch[1]);
            normalized = normalized.replace(verticalMatch[0], '');
        }

        // Extrair amplitude (coeficiente antes da função)
        let amplitudeMatch = normalized.match(/^([+-]?\d*\.?\d*)\*?(sin|cos)/);
        if (amplitudeMatch && amplitudeMatch[1]) {
            if (amplitudeMatch[1] === '' || amplitudeMatch[1] === '+') {
                result.amplitude = 1;
            } else if (amplitudeMatch[1] === '-') {
                result.amplitude = -1;
            } else {
                result.amplitude = parseFloat(amplitudeMatch[1]);
            }
        } else if (normalized.startsWith('-')) {
            result.amplitude = -1;
        }

        // Extrair conteúdo dos parênteses
        const innerMatch = normalized.match(/(sin|cos)\(([^)]+)\)/);
        if (innerMatch) {
            const innerExpression = innerMatch[2];
            const innerParts = parseInnerExpression(innerExpression);
            result.frequency = innerParts.frequency;
            result.phaseShift = innerParts.phaseShift;
        }

        return result;

    } catch (error) {
        return {
            isValid: false,
            error: 'Erro ao analisar a função: ' + error.message,
            originalFunction: functionText
        };
    }
}

function parseInnerExpression(expr) {
    const result = { frequency: 1, phaseShift: 0 };
    
    // Remover espaços
    expr = expr.replace(/\s+/g, '');
    
    // Caso simples: apenas x
    if (expr === 'x') {
        return result;
    }
    
    // Dividir em termos
    const terms = expr.split(/([+-])/);
    let xCoeff = 0;
    let constant = 0;
    
    for (let i = 0; i < terms.length; i++) {
        const term = terms[i].trim();
        
        if (term === '+' || term === '-' || term === '') continue;
        
        const sign = (i > 0 && terms[i-1] === '-') ? -1 : 1;
        
        if (term.includes('x')) {
            // Termo com x
            const coeffMatch = term.match(/^([+-]?\d*\.?\d*)x?/);
            if (coeffMatch) {
                let coeff = coeffMatch[1];
                if (coeff === '' || coeff === '+') coeff = '1';
                if (coeff === '-') coeff = '-1';
                xCoeff += sign * parseFloat(coeff);
            }
        } else {
            // Termo constante
            constant += sign * parseFloat(term);
        }
    }
    
    result.frequency = xCoeff || 1;
    result.phaseShift = -constant / result.frequency;
    
    return result;
}

function generatePlotData(parsedFunction) {
    const points = [];
    const standardPoints = [];
    
    // Determinar range baseado na frequência
    const period = (2 * Math.PI) / Math.abs(parsedFunction.frequency);
    const range = Math.max(4 * Math.PI, 3 * period);
    const numPoints = 1000; // Mais pontos para suavidade
    const step = range / numPoints;
    
    for (let i = 0; i <= numPoints; i++) {
        const x = -range/2 + i * step;
        
        // Função personalizada
        const y = calculateFunctionValue(x, parsedFunction);
        if (isFinite(y)) { // Verificar se é um número válido
            points.push({ x: x, y: y });
        }
        
        // Função padrão
        const standardY = parsedFunction.type === 'sin' ? Math.sin(x) : Math.cos(x);
        standardPoints.push({ x: x, y: standardY });
    }
    
    return {
        userFunction: points,
        standardFunction: standardPoints,
        range: range,
        period: period
    };
}

function calculateFunctionValue(x, params) {
    const { type, amplitude, frequency, phaseShift, verticalShift } = params;
    
    // Calcular argumento
    const argument = frequency * (x - phaseShift);
    
    // Calcular valor base
    let baseValue;
    if (type === 'sin') {
        baseValue = Math.sin(argument);
    } else {
        baseValue = Math.cos(argument);
    }
    
    // Aplicar transformações
    return amplitude * baseValue + verticalShift;
}

function destroyChart() {
    if (chart) {
        chart.destroy();
        chart = null;
    }
}

function createChart(data, functionText) {
    const ctx = document.getElementById('function-chart');
    if (!ctx) {
        console.error('Canvas não encontrado');
        return;
    }
    
    // Limpar canvas
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    
    // Determinar limites do eixo Y
    const allYValues = data.userFunction.map(p => p.y);
    const minY = Math.min(...allYValues);
    const maxY = Math.max(...allYValues);
    const yPadding = Math.max(1, (maxY - minY) * 0.1);
    
    const chartData = {
        datasets: [
            {
                label: `Função padrão (${data.userFunction.length > 0 ? (data.userFunction[0].y !== undefined ? 'sin(x)' : 'cos(x)') : 'sin(x)'})`,
                data: data.standardFunction,
                borderColor: 'rgba(156, 163, 175, 0.6)',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                fill: false,
                pointRadius: 0,
                borderDash: [8, 4],
                tension: 0
            },
            {
                label: functionText,
                data: data.userFunction,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: false,
                pointRadius: 0,
                tension: 0
            }
        ]
    };
    
    const config = {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeInOutQuart'
            },
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
                            size: 13,
                            family: 'system-ui, -apple-system, sans-serif',
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    titleColor: '#f9fafb',
                    bodyColor: '#f9fafb',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    cornerRadius: 8,
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
                    min: -data.range/2,
                    max: data.range/2,
                    title: {
                        display: true,
                        text: 'x (radianos)',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#374151'
                    },
                    grid: {
                        color: 'rgba(156, 163, 175, 0.3)',
                        lineWidth: 1
                    },
                    ticks: {
                        callback: function(value) {
                            const piValue = value / Math.PI;
                            if (Math.abs(piValue) < 0.01) return '0';
                            if (Math.abs(piValue - 1) < 0.1) return 'π';
                            if (Math.abs(piValue + 1) < 0.1) return '-π';
                            if (Math.abs(piValue - 0.5) < 0.05) return 'π/2';
                            if (Math.abs(piValue + 0.5) < 0.05) return '-π/2';
                            if (Math.abs(piValue - 2) < 0.1) return '2π';
                            if (Math.abs(piValue + 2) < 0.1) return '-2π';
                            if (Math.abs(piValue % 1) < 0.1) {
                                const rounded = Math.round(piValue);
                                return rounded === 0 ? '0' : `${rounded}π`;
                            }
                            return '';
                        },
                        maxTicksLimit: 12,
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    position: 'center',
                    min: minY - yPadding,
                    max: maxY + yPadding,
                    title: {
                        display: true,
                        text: 'y',
                        font: {
                            size: 14,
                            weight: '600'
                        },
                        color: '#374151'
                    },
                    grid: {
                        color: 'rgba(156, 163, 175, 0.3)',
                        lineWidth: 1
                    },
                    ticks: {
                        stepSize: 0.5,
                        color: '#6b7280',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    };
    
    chart = new Chart(ctx, config);
}

function analyzeFunction(parsedFunction, functionText) {
    const analysisDiv = document.getElementById('function-analysis');
    if (!analysisDiv) return;
    
    const { type, amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    
    // Calcular propriedades
    const period = (2 * Math.PI) / Math.abs(frequency);
    const maxValue = Math.abs(amplitude) + verticalShift;
    const minValue = -Math.abs(amplitude) + verticalShift;
    
    const html = `
        <div class="analysis-grid">
            <div class="analysis-item">
                <div class="analysis-label">Função</div>
                <div class="analysis-value">${functionText}</div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Tipo</div>
                <div class="analysis-value">${type === 'sin' ? 'Seno' : 'Cosseno'}</div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Amplitude</div>
                <div class="analysis-value">${amplitude}</div>
                <div class="analysis-desc">
                    ${Math.abs(amplitude) === 1 ? 
                        'Amplitude padrão' : 
                        `Amplitude ${Math.abs(amplitude) > 1 ? 'aumentada' : 'diminuída'} ${Math.abs(amplitude)}x`
                    }
                    ${amplitude < 0 ? ' (invertida)' : ''}
                </div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Período</div>
                <div class="analysis-value">${period.toFixed(3)} rad</div>
                <div class="analysis-desc">
                    ${period === 2 * Math.PI ? 
                        'Período padrão (2π)' : 
                        period > 2 * Math.PI ? 
                            'Período aumentado' : 
                            'Período diminuído'
                    }
                </div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Deslocamento Horizontal</div>
                <div class="analysis-value">${phaseShift === 0 ? '0' : phaseShift.toFixed(3)} rad</div>
                <div class="analysis-desc">
                    ${phaseShift === 0 ? 
                        'Sem deslocamento' : 
                        phaseShift > 0 ? 
                            `${phaseShift.toFixed(3)} rad à direita` : 
                            `${Math.abs(phaseShift).toFixed(3)} rad à esquerda`
                    }
                </div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Deslocamento Vertical</div>
                <div class="analysis-value">${verticalShift === 0 ? '0' : verticalShift}</div>
                <div class="analysis-desc">
                    ${verticalShift === 0 ? 
                        'Sem deslocamento' : 
                        verticalShift > 0 ? 
                            `${verticalShift} unidades acima` : 
                            `${Math.abs(verticalShift)} unidades abaixo`
                    }
                </div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Valor Máximo</div>
                <div class="analysis-value">${maxValue}</div>
            </div>
            
            <div class="analysis-item">
                <div class="analysis-label">Valor Mínimo</div>
                <div class="analysis-value">${minValue}</div>
            </div>
        </div>
    `;
    
    analysisDiv.innerHTML = html;
}

function generateComparison(parsedFunction, functionText) {
    const comparisonDiv = document.getElementById('comparison-content');
    if (!comparisonDiv) return;
    
    const { type, amplitude, frequency, phaseShift, verticalShift } = parsedFunction;
    const standardFunction = type === 'sin' ? 'sen(x)' : 'cos(x)';
    
    let comparison = `<h4>Comparando ${functionText} com ${standardFunction}</h4>`;
    
    // Análise detalhada da amplitude
    if (Math.abs(amplitude) !== 1) {
        if (amplitude < 0) {
            comparison += `<div class="explanation-block">
                <p><strong>🔄 Amplitude e Inversão:</strong></p>
                <p>Variamos o parâmetro A (amplitude) para ${amplitude}. Isso causa duas transformações:</p>
                <p><span class="highlight-change">1. Amplitude:</span> A altura máxima mudou de 1 para ${Math.abs(amplitude)}. Isso significa que a função oscila ${Math.abs(amplitude)}x mais intensamente.</p>
                <p><span class="highlight-change">2. Inversão:</span> O sinal negativo inverte completamente a função - onde ${standardFunction} sobe, sua função desce, e vice-versa.</p>
                <p><em>Resultado:</em> Enquanto ${standardFunction} varia suavemente entre -1 e 1, sua função varia de forma invertida entre ${-Math.abs(amplitude)} e ${Math.abs(amplitude)}.</p>
            </div>`;
        } else {
            comparison += `<div class="explanation-block">
                <p><strong>📏 Amplitude Alterada:</strong></p>
                <p>Variamos apenas o parâmetro A (amplitude) para ${amplitude}. Sendo assim, a altura máxima será ${amplitude} e a profundidade ${-amplitude}.</p>
                <p>Não há deslocamento horizontal nem vertical, apenas um "${amplitude > 1 ? 'esticamento' : 'encolhimento'}" vertical do desenho.</p>
                <p><em>Compare:</em> ${standardFunction} oscila entre -1 e 1, mas sua função oscila entre ${-amplitude} e ${amplitude}.</p>
            </div>`;
        }
    } else if (amplitude < 0) {
        comparison += `<div class="explanation-block">
            <p><strong>🔄 Função Invertida:</strong></p>
            <p>Variamos apenas o sinal do parâmetro A para negativo. A altura máxima continua sendo 1 e a profundidade -1.</p>
            <p>Não há deslocamento horizontal nem vertical, apenas uma "inversão" completa do desenho.</p>
            <p><em>Resultado:</em> Onde ${standardFunction} tem máximos, sua função tem mínimos, e vice-versa.</p>
        </div>`;
    }
    
    // Análise detalhada da frequência
    if (frequency !== 1) {
        const period = (2 * Math.PI) / Math.abs(frequency);
        if (frequency > 1) {
            comparison += `<div class="explanation-block">
                <p><strong>⚡ Frequência Aumentada:</strong></p>
                <p>Variamos o parâmetro B (frequência) para ${frequency}. Isso faz a função "acelerar".</p>
                <p>A amplitude permanece a mesma (${Math.abs(amplitude)}), não há deslocamentos, apenas uma "compressão" horizontal.</p>
                <p><em>Compare:</em> ${standardFunction} completa 1 ciclo em 2π radianos, mas sua função completa ${frequency} ciclos no mesmo espaço.</p>
                <p>O período mudou de 2π (≈6.28) para ${period.toFixed(3)} radianos - a função ficou ${frequency}x mais rápida!</p>
            </div>`;
        } else {
            comparison += `<div class="explanation-block">
                <p><strong>🐌 Frequência Diminuída:</strong></p>
                <p>Variamos o parâmetro B (frequência) para ${frequency}. Isso faz a função "desacelerar".</p>
                <p>A amplitude permanece a mesma (${Math.abs(amplitude)}), não há deslocamentos, apenas um "alongamento" horizontal.</p>
                <p><em>Compare:</em> ${standardFunction} completa 1 ciclo em 2π radianos, mas sua função precisa de ${period.toFixed(3)} radianos para completar 1 ciclo.</p>
                <p>A função ficou ${(1/frequency).toFixed(1)}x mais lenta que a padrão!</p>
            </div>`;
        }
    }
    
    // Análise detalhada do deslocamento horizontal
    if (phaseShift !== 0) {
        const direction = phaseShift > 0 ? 'direita' : 'esquerda';
        const directionSymbol = phaseShift > 0 ? '→' : '←';
        comparison += `<div class="explanation-block">
            <p><strong>${directionSymbol} Deslocamento Horizontal:</strong></p>
            <p>Variamos o parâmetro C (fase) para ${-phaseShift.toFixed(3)}. Isso move toda a função horizontalmente.</p>
            <p>A amplitude (${Math.abs(amplitude)}) e a frequência (${frequency}) permanecem inalteradas, apenas a posição horizontal muda.</p>
            <p><em>Resultado:</em> Todos os pontos característicos (máximos, mínimos, zeros) foram deslocados ${Math.abs(phaseShift).toFixed(3)} radianos para a ${direction}.</p>
            <p>É como se pegássemos o gráfico de ${standardFunction} e o deslizássemos horizontalmente!</p>
        </div>`;
    }
    
    // Análise detalhada do deslocamento vertical
    if (verticalShift !== 0) {
        const direction = verticalShift > 0 ? 'cima' : 'baixo';
        const directionSymbol = verticalShift > 0 ? '↑' : '↓';
        comparison += `<div class="explanation-block">
            <p><strong>${directionSymbol} Deslocamento Vertical:</strong></p>
            <p>Variamos o parâmetro D (deslocamento vertical) para ${verticalShift}. Isso move toda a função verticalmente.</p>
            <p>A amplitude (${Math.abs(amplitude)}), frequência (${frequency}) e fase permanecem inalteradas.</p>
            <p><em>Compare:</em> ${standardFunction} oscila em torno de y=0, mas sua função oscila em torno de y=${verticalShift}.</p>
            <p>O "centro" da oscilação mudou - é como elevar ou abaixar todo o gráfico ${Math.abs(verticalShift)} unidades!</p>
        </div>`;
    }
    
    // Resumo das transformações
    comparison += `<div class="summary-block">
        <p><strong>📋 Resumo das Transformações:</strong></p>`;
    
    if (amplitude === 1 && frequency === 1 && phaseShift === 0 && verticalShift === 0) {
        comparison += `<p>✨ <em>Esta é a função trigonométrica padrão! É a base para todas as outras transformações.</em></p>`;
    } else {
        comparison += `<p>Partindo de ${standardFunction}, aplicamos as seguintes modificações:</p><ul>`;
        
        if (Math.abs(amplitude) !== 1) {
            comparison += `<li><strong>A = ${amplitude}:</strong> ${amplitude < 0 ? 'Inversão e a' : 'A'}lteração da amplitude</li>`;
        }
        if (frequency !== 1) {
            comparison += `<li><strong>B = ${frequency}:</strong> ${frequency > 1 ? 'Aceleração' : 'Desaceleração'} da função</li>`;
        }
        if (phaseShift !== 0) {
            comparison += `<li><strong>C = ${-phaseShift.toFixed(3)}:</strong> Deslocamento horizontal</li>`;
        }
        if (verticalShift !== 0) {
            comparison += `<li><strong>D = ${verticalShift}:</strong> Deslocamento vertical</li>`;
        }
        
        comparison += `</ul>`;
        
        // Fórmula geral
        comparison += `<p><strong>Fórmula geral:</strong> <code>f(x) = A*${type}(B*x + C) + D</code></p>`;
        comparison += `<p><strong>Sua função:</strong> <code>${functionText}</code></p>`;
    }
    
    comparison += `</div>`;
    
    comparisonDiv.innerHTML = comparison;
}

function showError(message) {
    const analysisDiv = document.getElementById('function-analysis');
    const comparisonDiv = document.getElementById('comparison-content');
    
    if (analysisDiv) {
        analysisDiv.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <div class="error-text">
                    <strong>Erro:</strong> ${message}
                    <br><br>
                    <strong>Exemplos válidos:</strong><br>
                    • sen(x), cos(x)<br>
                    • 2*sen(x), -cos(x)<br>
                    • sen(2x), cos(x/2)<br>
                    • sen(x-1)+2
                </div>
            </div>
        `;
    }
    
    if (comparisonDiv) {
        comparisonDiv.innerHTML = '<p>Corrija a função para ver a comparação.</p>';
    }
}

function clearError() {
    // Função para limpar mensagens de erro se necessário
}
