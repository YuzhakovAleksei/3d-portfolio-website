// Все настройки сайта в одном месте
export const CONFIG = {
    // Контакты
    contacts: {
        telegram: 'https://t.me/your_nick',
        whatsapp: 'https://wa.me/7XXXXXXXXXX',
        email: 'your@email.com',
        avito: 'https://www.avito.ru/user/ваш_id'
    },

    watermark: {
        text: '© Иван Иванов',
        enabled: true,
        opacity: 0.15,
        fontSize: 40,
        rotation: -30,
        spacing: 4,
    },
    
    // Информация об авторе
    author: {
        name: 'Иван Иванов',
        specialization: 'Инженерное 3D-моделирование и техническая визуализация',
        description: 'Создаю точные 3D-модели электрошкафов, устройств ABB, промышленных роботов'
    },
    
    // Настройки Three.js
    three: {
        defaultModel: '/src/assets/models/placeholder.glb',
        cameraPosition: { x: 5, y: 5, z: 5 },
        autoRotateSpeed: 1.5,
        backgroundColor: 0x111122
    },
    
    // Настройки портфолио
    portfolio: {
        itemsPerPage: 6,
        enableLightbox: true
    },
    
    // SEO
    seo: {
        title: 'Иван Иванов | 3D-моделирование и техническая визуализация',
        description: 'Инженерное 3D-моделирование электрошкафов, устройств ABB, промышленных роботов. Техническая визуализация. Подготовка к 3D-печати.',
        keywords: '3D моделирование, техническая визуализация, SolidWorks, 3ds Max, 3D печать'
    }
};