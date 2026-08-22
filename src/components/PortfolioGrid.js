import { eventBus } from '../core/eventBus.js';

export class PortfolioGrid {
    constructor(containerId, data) {
        this.container = document.getElementById(containerId);
        this.data = data;
        this.items = [];
    }
    
    async init() {
        if (!this.container) return;
        this.render();
        this.attachEvents();
    }
    
    render() {
        if (!this.data || this.data.length === 0) {
            this.container.innerHTML = '<p>Портфолио загружается...</p>';
            return;
        }
        
        this.container.classList.add('portfolio-grid');
        
        // ВАЖНО: используем preview для превью
        this.container.innerHTML = this.data.map(item => `
            <div class="portfolio-item" data-id="${item.id}">
                <img src="${item.preview}" alt="${item.title}" loading="lazy">
                <div class="portfolio-info">
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                </div>
            </div>
        `).join('');
        
        this.items = this.container.querySelectorAll('.portfolio-item');
    }
    
    attachEvents() {
        this.items.forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                const selectedItem = this.data.find(d => d.id === id);
                if (selectedItem) {
                    // Отправляем полный объект с preview и full
                    eventBus.emit('portfolio:itemClick', selectedItem);
                }
            });
        });
    }
}