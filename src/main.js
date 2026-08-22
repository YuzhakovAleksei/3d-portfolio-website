import './style.css';
import { app } from './core/app.js';
import { eventBus } from './core/eventBus.js';
import { ThreeManager } from './three/ThreeManager.js';
import { PortfolioGrid } from './components/PortfolioGrid.js';
import { Modal } from './components/Modal.js';
import portfolioData from './data/portfolio.json';

function adjustHeroPadding() {
    const header = document.querySelector('.header');
    const main = document.querySelector('.main');
    if (header && main) {
        main.style.paddingTop = header.offsetHeight + 'px';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    adjustHeroPadding();
    
    const modal = new Modal('imageModal');
    const portfolio = new PortfolioGrid('portfolioGrid', portfolioData);
    
    app.register(modal);
    app.register(portfolio);
    
    // Подписываемся на события
    eventBus.on('portfolio:itemClick', (item) => {
        // Находим индекс в массиве portfolioData
        const index = portfolioData.findIndex(p => p.id === item.id);
        
        // Открываем модалку с ВСЕМИ данными и текущим индексом
        eventBus.emit('modal:open', { 
            items: portfolioData,  // ← Все элементы портфолио
            index: index >= 0 ? index : 0, // ← Текущий индекс
            full: item.full,
            title: item.title
        });
    });
    
    await app.init();
    console.log('🎉 Site ready!');
});

window.addEventListener('resize', adjustHeroPadding);