document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const bolinha = document.getElementById('bolinha');
    const fantasma = document.getElementById('fantasma');
    
    // Configurações da Bolinha (controlada por teclado)
    let bolinhaX = window.innerWidth * 0.3;
    let bolinhaY = window.innerHeight / 2;
    const bolinhaVelocidade = 8;
    
    // Configurações do Fantasma (movimento aleatório)
    let fantasmaX = window.innerWidth * 0.7;
    let fantasmaY = window.innerHeight / 2;
    const fantasmaVelocidade = 3;
    let fantasmaDirecao = Math.random() * Math.PI * 2;
    
    // Posiciona os elementos inicialmente
    atualizarPosicoes();
    
    // --- Código para controlar a Bolinha com teclado ---
    const teclasPressionadas = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
    };
    
    document.addEventListener('keydown', function(event) {
        if (teclasPressionadas.hasOwnProperty(event.key)) {
            teclasPressionadas[event.key] = true;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (teclasPressionadas.hasOwnProperty(event.key)) {
            teclasPressionadas[event.key] = false;
        }
    });
    
    // --- Código para o movimento aleatório do Fantasma ---
    function mudarDirecaoFantasma() {
        const variacao = (Math.random() * Math.PI/2) - Math.PI/4;
        fantasmaDirecao += variacao;
        
        const tempoProximaMudanca = 500 + Math.random() * 2500;
        setTimeout(mudarDirecaoFantasma, tempoProximaMudanca);
    }
    
    mudarDirecaoFantasma();
    
    // --- Funções auxiliares ---
    function verificarBordasFantasma() {
        if (fantasmaX <= 0 || fantasmaX >= window.innerWidth - fantasma.width) {
            fantasmaDirecao = Math.PI - fantasmaDirecao;
        }
        
        if (fantasmaY <= 0 || fantasmaY >= window.innerHeight - fantasma.height) {
            fantasmaDirecao = -fantasmaDirecao;
        }
    }
    
    function girarFantasma() {
        const anguloGraus = (fantasmaDirecao * 180 / Math.PI) + 90;
        fantasma.style.transform = `translate(-50%, -50%) rotate(${anguloGraus}deg)`;
    }
    
    function atualizarPosicoes() {
        bolinha.style.left = bolinhaX + 'px';
        bolinha.style.top = bolinhaY + 'px';
        
        fantasma.style.left = fantasmaX + 'px';
        fantasma.style.top = fantasmaY + 'px';
    }
    
    function limitarPosicao(elemento, x, y) {
        return {
            x: Math.max(0, Math.min(x, window.innerWidth - elemento.width)),
            y: Math.max(0, Math.min(y, window.innerHeight - elemento.height))
        };
    }
    
    // --- Loop de animação principal ---
    function animacao() {
        // Movimento da Bolinha
        if (teclasPressionadas.ArrowUp) bolinhaY -= bolinhaVelocidade;
        if (teclasPressionadas.ArrowDown) bolinhaY += bolinhaVelocidade;
        if (teclasPressionadas.ArrowLeft) bolinhaX -= bolinhaVelocidade;
        if (teclasPressionadas.ArrowRight) bolinhaX += bolinhaVelocidade;
        
        // Movimento do Fantasma
        fantasmaX += Math.cos(fantasmaDirecao) * fantasmaVelocidade;
        fantasmaY += Math.sin(fantasmaDirecao) * fantasmaVelocidade;
        
        // Verificar bordas
        verificarBordasFantasma();
        girarFantasma();
        
        // Limitar posições dentro da tela
        const bolinhaPos = limitarPosicao(bolinha, bolinhaX, bolinhaY);
        bolinhaX = bolinhaPos.x;
        bolinhaY = bolinhaPos.y;
        
        const fantasmaPos = limitarPosicao(fantasma, fantasmaX, fantasmaY);
        fantasmaX = fantasmaPos.x;
        fantasmaY = fantasmaPos.y;
        
        // Atualizar posições na tela
        atualizarPosicoes();
        
        // Próximo frame
        requestAnimationFrame(animacao);
    }
    
    // Inicia a animação
    animacao();
    
    // Redimensionamento da janela
    window.addEventListener('resize', function() {
        const bolinhaPos = limitarPosicao(bolinha, bolinhaX, bolinhaY);
        bolinhaX = bolinhaPos.x;
        bolinhaY = bolinhaPos.y;
        
        const fantasmaPos = limitarPosicao(fantasma, fantasmaX, fantasmaY);
        fantasmaX = fantasmaPos.x;
        fantasmaY = fantasmaPos.y;
        
        atualizarPosicoes();
    });
});