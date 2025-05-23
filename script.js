// Espera o DOM (Document Object Model) ser totalmente carregado antes de executar o código
document.addEventListener('DOMContentLoaded', function() {
    // Obtém a referência para a imagem da bolinha no HTML
    const bolinha = document.getElementById('bolinha');
    
    // Variáveis para armazenar a posição X e Y da bolinha
    // Inicia no centro da tela
    let posX = window.innerWidth / 2;
    let posY = window.innerHeight / 2;
    
    // Velocidade de movimento da bolinha (em pixels por frame)
    const velocidade = 10;
    
    // Posiciona a bolinha inicialmente no centro da tela
    bolinha.style.left = posX + 'px';
    bolinha.style.top = posY + 'px';
    
    // Objeto para rastrear quais teclas estão pressionadas
    // Inicialmente todas as teclas estão como "não pressionadas" (false)
    const teclasPressionadas = {
        ArrowUp: false,    // Seta para cima
        ArrowDown: false,  // Seta para baixo
        ArrowLeft: false,  // Seta para esquerda
        ArrowRight: false  // Seta para direita
    };
    
    // Evento que detecta quando uma tecla é pressionada
    document.addEventListener('keydown', function(event) {
        // Verifica se a tecla pressionada é uma das que nos interessa (setas)
        if (teclasPressionadas.hasOwnProperty(event.key)) {
            // Marca a tecla como pressionada no nosso objeto
            teclasPressionadas[event.key] = true;
        }
    });
    
    // Evento que detecta quando uma tecla é liberada
    document.addEventListener('keyup', function(event) {
        // Verifica se a tecla liberada é uma das que nos interessa
        if (teclasPressionadas.hasOwnProperty(event.key)) {
            // Marca a tecla como não pressionada no nosso objeto
            teclasPressionadas[event.key] = false;
        }
    });
    
    // Função principal de animação que atualiza a posição da bolinha
    function animacao() {
        // Atualiza a posição Y (vertical) se as teclas de cima/baixo estiverem pressionadas
        if (teclasPressionadas.ArrowUp) posY -= velocidade;    // Move para cima
        if (teclasPressionadas.ArrowDown) posY += velocidade;  // Move para baixo
        
        // Atualiza a posição X (horizontal) se as teclas de esquerda/direita estiverem pressionadas
        if (teclasPressionadas.ArrowLeft) posX -= velocidade;   // Move para esquerda
        if (teclasPressionadas.ArrowRight) posX += velocidade; // Move para direita
        
        // Limita a posição X para que a bolinha não saia da tela
        // Math.max(0, ...) impede valores negativos (saída pela esquerda)
        // Math.min(..., window.innerWidth - bolinha.width) impede saída pela direita
        posX = Math.max(0, Math.min(posX, window.innerWidth - bolinha.width));
        
        // Limita a posição Y para que a bolinha não saia da tela
        // Math.max(0, ...) impede valores negativos (saída pelo topo)
        // Math.min(..., window.innerHeight - bolinha.height) impede saída pela base
        posY = Math.max(0, Math.min(posY, window.innerHeight - bolinha.height));
        
        // Aplica as novas posições X e Y à bolinha
        bolinha.style.left = posX + 'px';
        bolinha.style.top = posY + 'px';
        
        // Agenda a próxima execução desta função para criar a animação contínua
        // requestAnimationFrame é a forma mais eficiente de fazer animações no navegador
        requestAnimationFrame(animacao);
    }
    
    // Inicia o loop de animação chamando a função pela primeira vez
    animacao();
    
    // Evento para redimensionamento da janela
    window.addEventListener('resize', function() {
        // Recalcula as posições máximas quando a janela é redimensionada
        // para manter a bolinha dentro dos novos limites da tela
        posX = Math.max(0, Math.min(posX, window.innerWidth - bolinha.width));
        posY = Math.max(0, Math.min(posY, window.innerHeight - bolinha.height));
        
        // Reposiciona a bolinha com os novos valores
        bolinha.style.left = posX + 'px';
        bolinha.style.top = posY + 'px';
    });
});