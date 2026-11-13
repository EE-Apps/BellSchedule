const observedPageHeaders = new WeakSet();
const activeHeaderAnimations = new WeakMap();
const pendingHeaderFrames = new WeakMap();
const headerTransitionVersions = new WeakMap();

function animatePageHeaderElement(element, startRect, endRect) {
    if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        typeof element.animate !== 'function' ||
        !startRect.width ||
        !startRect.height ||
        !endRect.width ||
        !endRect.height
    ) {
        return;
    }

    const translateX = startRect.left - endRect.left;
    const translateY = startRect.top - endRect.top;
    const scaleX = startRect.width / endRect.width;
    const scaleY = startRect.height / endRect.height;
    const animation = element.animate([
        { transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})` },
        { transform: 'translate(0, 0) scale(1, 1)' }
    ], {
        duration: 300,
        easing: 'cubic-bezier(0.2, 0, 0, 1)'
    });

    activeHeaderAnimations.set(element, animation);
    animation.onfinish = () => {
        if (activeHeaderAnimations.get(element) === animation) {
            activeHeaderAnimations.delete(element);
        }
    };
}

function observePageHeader(page) {
    if (observedPageHeaders.has(page)) return;

    const header = page.querySelector('.page-header');
    const buttons = page.querySelector('.page-header-btns');
    if (!header || !buttons) return;

    const headings = [
        header.querySelector(':scope > h1'),
        header.querySelector(':scope > h3')
    ].filter(heading => heading && heading.textContent.trim());
    if (!headings.length) return;

    const placeholders = new Map();
    headings.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        const placeholder = document.createElement('span');
        heading.classList.add('page-header-title');
        placeholder.className = 'page-header-title-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
        placeholder.style.height = '0'
        heading.before(placeholder);
        placeholders.set(heading, placeholder);
    });

    const titleContainer = document.createElement('div');
    titleContainer.className = 'page-header-title-container';

    const sentinel = document.createElement('span');
    sentinel.className = 'page-header-scroll-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    header.append(sentinel);

    const observer = new IntersectionObserver(([entry]) => {
        const compact = !entry.isIntersecting;
        if (buttons.classList.contains('page-header-compact') === compact) return;

        const version = (headerTransitionVersions.get(page) || 0) + 1;
        headerTransitionVersions.set(page, version);
        const pendingFrame = pendingHeaderFrames.get(page);
        if (pendingFrame) {
            cancelAnimationFrame(pendingFrame);
            pendingHeaderFrames.delete(page);
        }

        const startRects = new Map();
        headings.forEach(heading => {
            const rect = heading.getBoundingClientRect();
            const animation = activeHeaderAnimations.get(heading);
            if (animation) {
                animation.cancel();
                activeHeaderAnimations.delete(heading);
            }
            startRects.set(heading, rect);
        });
        if (compact) {
            buttons.classList.add('page-header-compact');
            const leftButtons = buttons.querySelector('.lefthead');
            buttons.insertBefore(titleContainer, leftButtons);
            headings.forEach(heading => {
                heading.before(placeholders.get(heading));
                titleContainer.append(heading);
            });
        } else {
            buttons.classList.remove('page-header-compact');
            headings.forEach(heading => placeholders.get(heading).replaceWith(heading));
            titleContainer.remove();
        }

        pendingHeaderFrames.set(page, requestAnimationFrame(() => {
            if (headerTransitionVersions.get(page) !== version) return;
            pendingHeaderFrames.delete(page);

            if (buttons.classList.contains('page-header-compact') !== compact) return;
            const endRects = new Map(headings.map(heading => [
                heading,
                heading.getBoundingClientRect()
            ]));

            requestAnimationFrame(() => {
                if (headerTransitionVersions.get(page) !== version) return;
                if (buttons.classList.contains('page-header-compact') !== compact) return;
                headings.forEach(heading => {
                    animatePageHeaderElement(heading, startRects.get(heading), endRects.get(heading));
                });
            });
        }));
    }, {
        root: page,
        threshold: 0
    });

    observer.observe(sentinel);
    observedPageHeaders.add(page);
}

function initializePageHeaderTransitions() {
    document.querySelectorAll('.page').forEach(observePageHeader);

    const pageObserver = new MutationObserver(records => {
        records.forEach(record => {
            record.addedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                const page = node.matches('.page') ? node : node.closest('.page');
                if (page) observePageHeader(page);
            });
        });
    });
    pageObserver.observe(document.documentElement, { childList: true, subtree: true });
}

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
initializePageHeaderTransitions();
console.log('PagesManager инициализирован:', window.pagesManager);

// Export for module usage
export default PagesManager;
export { PagesManager };

// Dispatch event to signal that pagesManager is ready
window.dispatchEvent(new CustomEvent('pagesManagerReady'));
