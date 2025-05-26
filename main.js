document.addEventListener('DOMContentLoaded', function() {
    const gameArea = document.getElementById('gameArea');
    
    // Cria a bolinha
    const bolinha = new Bolinha(gameArea);
    
    // Array de fantasmas
    const fantasmas = [];
    
    // Cria o primeiro fantasma
    fantasmas.push(new Fantasma(gameArea, window.innerWidth * 0.7, window.innerHeight / 2));
    
    // Função para verificar colisões
    function verificarColisoes() {
        fantasmas.forEach(fantasma => {
            const dx = bolinha.centro.x - fantasma.centro.x;
            const dy = bolinha.centro.y - fantasma.centro.y;
            const distancia = Math.sqrt(dx * dx + dy * dy);
            
            if (distancia < bolinha.raio + fantasma.raio) {
                // Cria novo fantasma
                fantasmas.push(new Fantasma(gameArea));
                
                // Faz o fantasma atingido rebater
                fantasma.direcao = Math.atan2(dy, dx) + Math.PI;
            }
        });
    }
    
    // Loop de animação
    function animacao() {
        bolinha.atualizar();
        
        fantasmas.forEach(fantasma => {
            fantasma.atualizar();
        });
        
        verificarColisoes();
        requestAnimationFrame(animacao);
    }
    
    // Redimensionamento da janela
    window.addEventListener('resize', function() {
        bolinha.x = Math.max(bolinha.raio, Math.min(bolinha.x, window.innerWidth - bolinha.raio));
        bolinha.y = Math.max(bolinha.raio, Math.min(bolinha.y, window.innerHeight - bolinha.raio));
        bolinha.atualizarPosicao();
        
        fantasmas.forEach(fantasma => {
            fantasma.x = Math.max(fantasma.raio, Math.min(fantasma.x, window.innerWidth - fantasma.raio));
            fantasma.y = Math.max(fantasma.raio, Math.min(fantasma.y, window.innerHeight - fantasma.raio));
            fantasma.atualizarPosicao();
        });
    });
    
    // Inicia a animação
    animacao();
});