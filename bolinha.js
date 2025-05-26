class Bolinha {
    constructor(gameArea) {
        this.element = document.createElement('img');
        this.element.src = 'bolinha.png';
        this.element.className = 'bolinha';
        this.raio = 25;
        this.x = window.innerWidth * 0.3;
        this.y = window.innerHeight / 2;
        this.velocidade = 8;
        
        // Posiciona inicialmente
        this.atualizarPosicao();
        gameArea.appendChild(this.element);
        
        // Controles de teclado
        this.teclasPressionadas = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false
        };
        
        this.configurarControles();
    }
    
    configurarControles() {
        document.addEventListener('keydown', (event) => {
            if (this.teclasPressionadas.hasOwnProperty(event.key)) {
                this.teclasPressionadas[event.key] = true;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (this.teclasPressionadas.hasOwnProperty(event.key)) {
                this.teclasPressionadas[event.key] = false;
            }
        });
    }
    
    atualizar() {
        if (this.teclasPressionadas.ArrowUp) this.y -= this.velocidade;
        if (this.teclasPressionadas.ArrowDown) this.y += this.velocidade;
        if (this.teclasPressionadas.ArrowLeft) this.x -= this.velocidade;
        if (this.teclasPressionadas.ArrowRight) this.x += this.velocidade;
        
        // Limitar na tela
        this.x = Math.max(this.raio, Math.min(this.x, window.innerWidth - this.raio));
        this.y = Math.max(this.raio, Math.min(this.y, window.innerHeight - this.raio));
        
        this.atualizarPosicao();
    }
    
    atualizarPosicao() {
        this.element.style.left = (this.x - this.raio) + 'px';
        this.element.style.top = (this.y - this.raio) + 'px';
    }
    
    // Para verificação de colisão
    get centro() {
        return { x: this.x, y: this.y };
    }
}