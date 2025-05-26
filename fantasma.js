class Fantasma {
    constructor(gameArea, x, y) {
        this.element = document.createElement('img');
        this.element.src = 'fantasma.png';
        this.element.className = 'fantasma';
        this.raio = 30;
        this.x = x || Math.random() * (window.innerWidth - 60);
        this.y = y || Math.random() * (window.innerHeight - 60);
        this.velocidade = 2 + Math.random() * 2;
        this.direcao = Math.random() * Math.PI * 2;
        
        // Cores aleatórias
        this.corBase = [
            {h: 0, s: 100, l: 50},    // Vermelho
            {h: 120, s: 100, l: 50},  // Verde
            {h: 240, s: 100, l: 50},  // Azul
            {h: 60, s: 100, l: 50},   // Amarelo
            {h: 300, s: 100, l: 50}   // Magenta
        ][Math.floor(Math.random() * 5)];
        
        this.saturacao = 70 + Math.random() * 60;
        this.aplicarCor();
        
        // Posiciona inicialmente
        this.atualizarPosicao();
        gameArea.appendChild(this.element);
        
        // Agenda primeira mudança de direção
        setTimeout(() => this.mudarDirecao(), Math.random() * 3000);
    }
    
    aplicarCor() {
        const {h, s, l} = this.corBase;
        this.element.style.filter = 
            `hue-rotate(${h}deg) saturate(${this.saturacao}%) brightness(${l}%)`;
    }
    
    mudarDirecao() {
        const variacao = (Math.random() * Math.PI/2) - Math.PI/4;
        this.direcao += variacao;
        
        const tempoProximaMudanca = 500 + Math.random() * 2500;
        setTimeout(() => this.mudarDirecao(), tempoProximaMudanca);
    }
    
    atualizar() {
        this.x += Math.cos(this.direcao) * this.velocidade;
        this.y += Math.sin(this.direcao) * this.velocidade;
        
        // Verificar bordas
        if (this.x <= this.raio || this.x >= window.innerWidth - this.raio) {
            this.direcao = Math.PI - this.direcao;
        }
        
        if (this.y <= this.raio || this.y >= window.innerHeight - this.raio) {
            this.direcao = -this.direcao;
        }
        
        // Girar o fantasma
        const anguloGraus = (this.direcao * 180 / Math.PI) + 90;
        this.element.style.transform = `translate(-50%, -50%) rotate(${anguloGraus}deg)`;
        
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