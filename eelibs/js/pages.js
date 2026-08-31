class PagesManager {
    constructor() {
        
    }

    createBtnList(options, activeBtn = 'none') {
        const container = document.createElement('div')
        container.className = 'btnsList';
        options.forEach((btn) => {
            const el = document.createElement('button');
            const name = btn.name || btn.id || '';
            const id = btn.id || btn.name;

            el.innerHTML = `<div class="imgcont"><img src="${btn.img || 'img/ui/check/checked.svg'}"></div><p>${name}</p>`;
            el.dataset.where = id;
            if (btn.id == activeBtn) el.classList.add('active')

            el.addEventListener('click', () => {
                // Fix: Get all buttons in container and remove active class
                container.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                el.classList.add('active');
            });
            container.appendChild(el);
        })
        return(container);
    }
}

// Initialize immediately and make globally available
console.log('Инициализация PagesManager...');
window.pagesManager = new PagesManager();
console.log('PagesManager инициализирован:', window.pagesManager);

// Export for module usage
export default PagesManager;
export { PagesManager };

// Dispatch event to signal that pagesManager is ready
window.dispatchEvent(new CustomEvent('pagesManagerReady'));
