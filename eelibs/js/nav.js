// Helper function to ensure pages.js is ready
function ensurePagesReady() {
    return new Promise((resolve) => {
        if (window.pagesManager && typeof window.pagesManager.createBtnList === 'function') {
            resolve();
        } else {
            window.addEventListener('pagesManagerReady', () => resolve(), { once: true });
        }
    });
}

class Nav {
    constructor() {
        this.nav = document.getElementById('nav');
        this.navContent = document.getElementById('navcontent');
        this.navDown = document.getElementById('navdown');
        this.content = document.getElementById('content');
        
        // Валидация
        if (!this.nav || !this.navContent || !this.navDown) {
            console.error('Не все элементы навигации найдены');
            return;
        }

        this.pages;
        this.currentPage = '';
        this.lastestPage = '';
        this.touchStartX = 0;
        this.touchStartY = 0;

        this.leftBtns = {
            nav:  { img: 'img/ui/lines', onclick: 'window.cnavMgr.openNavPanel()' },
            back: { img: 'img/ui/back',  onclick: 'window.cnavMgr.returnToPage()' },
            none: { img: 'img/ui/blank', onclick: null }
        };

        this.rightBtns = {
            add: { img: 'img/ui/add2', onclick: null },
            search: { img: 'img/ui/search', onclick: () => window.cnavMgr.openSearch() },
            more: { img: 'img/ui/more', onclick: null }
        };

        this.HEADER_BTNS = ['add', 'search'];
    }

    init(pages) {
        window.cnavMgr.pages = pages;
    }

    createHeadOfPage(page) {
        let head = document.createElement('header');
        head.className = 'page-header';
        head.innerHTML = `
            <h1>${page.title}</h1>
            <h3>${page.description ? page.description : ''}</h3>
        `;

        function generateLeftButton(type) {
            const data = window.cnavMgr?.leftBtns[type]
            return `<button class="leftBtnsNav" onclick="${data?.onclick}"><img src="${data?.img}.svg"></button>`
        }

        function generateRightButton(page, i) {
            const btnData = page.btns[i];

            const img = btnData[1] ?? window.cnavMgr.rightBtns[btnData[0]]?.img ?? 'img/ui/blank';
            const onclick = btnData[2] ?? window.cnavMgr.rightBtns[btnData[0]]?.onclick ?? '';
            const text = btnData[3] ? btnData[0] : '';

            let btn = document.createElement('button');
            if (typeof onclick === 'function') {
                btn.onclick = onclick;
            } else if (typeof onclick === 'string' && onclick !== '') {
                btn.setAttribute('onclick', onclick);
            }
            btn.innerHTML = `<img src="${img}.svg">${text}`;

            return btn;
        }

        function toggleNavRightMore(pageId) {
            document.getElementById(`${pageId}-navRightMore`).classList.toggle('active');
        }

        function generateTopSubpages(page) {
            try {
                if (!page.subcategories || page.subcategories.length === 0) {
                    return null; 
                }

                // Check if window.pagesManager exists
                if (!window.pagesManager || typeof window.pagesManager.createBtnList !== 'function') {
                    console.error('window.pagesManager.createBtnList is not available yet');
                    return null;
                }

                // Подготавливаем данные для функции (делаем из строк объекты)
                const btnOptions = page.subcategories.map(sub => ({
                    name: sub,
                    id: sub,
                    img: 'img/ui/check/checked.svg'
                }));

                // пинаем создание
                const topNav = window.pagesManager.createBtnList(btnOptions, page.subcategoryActive);

                // Добавляем специфический класс для этого контейнера
                topNav.classList.add('topNav');
                
                return topNav;
            } catch(e) {
                console.error('Error in generateTopSubpages:', e);
                return null;
            }
        }

        let leftBtn = page.leftBtn ? generateLeftButton(page.leftBtn) : generateLeftButton('nav');

        let hnav = document.createElement('div');
        hnav.className = 'page-header-btns';
        hnav.innerHTML = `
            ${leftBtn}
            <div class="lefthead"></div>
        `;
        try {
            hnav.appendChild(generateTopSubpages(page));
        } catch {}

        const headerBtns = [];
        const moreBtns = [];

        page.btns?.forEach((btnData, i) => {
            if (window.cnavMgr.HEADER_BTNS.includes(btnData[0])) {
                headerBtns.push(i);
            } else {
                moreBtns.push(i);
            }
        });

        headerBtns.forEach(i => {
            hnav.querySelector('.lefthead').appendChild(generateRightButton(page, i));
        });

        if (moreBtns.length > 0) {
            let moreBtn = document.createElement('button');
            moreBtn.onclick = () => toggleNavRightMore(page.id);
            moreBtn.innerHTML = `<img src="${window.cnavMgr.rightBtns.more.img}.svg">`;
            hnav.querySelector('.lefthead').appendChild(moreBtn);

            let navRightMore = document.createElement('div');
            navRightMore.id = `${page.id}-navRightMore`;
            navRightMore.className = 'navRightMore';
            moreBtns.forEach(i => {
                navRightMore.appendChild(generateRightButton(page, i));
            });
            hnav.appendChild(navRightMore);
        }

        let place;
        if (document.getElementById(page.id).querySelector('.pageContainer')) {
            place = document.getElementById(page.id).querySelector('.pageContainer');
        } else {
            place = document.createElement('div');
            place.className = 'pageContainer';
            document.getElementById(page.id).prepend(place);
        }
        place.prepend(hnav);
        place.prepend(head);
    }

    createNavDownButton(page) {
        let btn = document.createElement('button');
        btn.classList.add('navbtn');
        btn.innerHTML = `<img src="${page.icon}"><span>${page.title}</span>`;
        btn.id = `${page.id}-navd`;
        if (page.active) {
            btn.classList.add('active')
            window.cnavMgr.lastestPage = page.id;
            window.cnavMgr.currentPage = page.id;
        };
        btn.onclick = () => {
            if (page.id == 'MORE') {
                content.classList.toggle('modal-open');
                document.getElementById('modalMoreMain').classList.toggle('active');
                return;
            } else {
                changePage(page.id);
            }
        };
        window.cnavMgr.navDown.appendChild(btn);
    }

    createNavMoreButton(page) {
        const modalForuse = document.getElementById('modalForuse');
        if (!modalForuse) {
            console.error('Элемент #modalForuse не найден в разметке');
            return;
        }

        const btn = document.createElement('button');
        btn.classList.add('navbtn');
        btn.innerHTML = `<img src="${page.icon}" alt=""><span>${page.title}</span>`;
        
        btn.onclick = () => {
            // Снимаем активный класс со всех кнопок навигации
            document.querySelectorAll('.navbtn.active').forEach(el => {
                el.classList.remove('active');
            });
            
            // Переключаем страницу
            switchPage(document.getElementById(page.id));
            btn.classList.add('active');
            
            // Закрываем модальное окно через родительский .modal
            const modalWindow = modalForuse.closest('.modal');
            if (modalWindow) {
                modalWindow.classList.remove('active');
            }
        };
        
        modalForuse.appendChild(btn);
    }

    createNav(pages) {
        const MAX_NAVDOWN = 4;
        
        // === РАБОТА С КОНТЕЙНЕРОМ "ЕЩЁ" ===
        const modalDiv = document.createElement('div');
        const modalForuse = document.createElement('div');
        const modalContent = document.createElement('div');
        modalDiv.className = 'modal';
        modalDiv.id = 'modalMoreMain';
        modalForuse.className = 'dialog input';
        modalForuse.innerHTML = '';
        modalForuse.id = 'modalForuse';
        modalContent.className = 'modal-content moreDiv';
        this.content.appendChild(modalDiv);
        modalDiv.appendChild(modalForuse);
        modalForuse.appendChild(modalContent);

        // завершить создание и включение стилей

        // Фильтруем страницы для нижней панели
        const bottomPages = pages.filter(p => !p.noBottom);
        const needMore = bottomPages.length > MAX_NAVDOWN;
        const maxDirect = needMore ? MAX_NAVDOWN - 1 : MAX_NAVDOWN;
        
        let addedDirect = 0;
        let overflowCount = 0;

        for (const page of pages) {
            // === СОЗДАНИЕ ОСНОВНОЙ КНОПКИ НАВИГАЦИИ ===
            const btn = document.createElement('button');
            btn.classList.add('navbtn');
            if (page.active) btn.classList.add('active');
            if (page.active) document.getElementById(page.id).classList.add('active');
            if (page.active) console.log('active page: ' + page.id);
            btn.innerHTML = `<img src="${page.icon}" alt=""><span>${page.title}</span>`;
            btn.id = `${page.id}-navc`;
            
            btn.onclick = () => {
                document.querySelectorAll('.navbtn.active').forEach(el => el.classList.remove('active'));
                switchPage(document.getElementById(page.id));
                btn.classList.add('active');
            };
            
            // Распределяем кнопки по контейнерам
            if (page.id === 'settings') {
                window.cnavMgr.nav.appendChild(btn);
            } else {
                if (!page.noLeft) window.cnavMgr.navContent.appendChild(btn);
            }

            // === ОБРАБОТКА НИЖНЕЙ ПАНЕЛИ ===
            if (!page.noBottom) {
                if (addedDirect < maxDirect) {
                    // Прямые кнопки в нижней панели
                    window.cnavMgr.createNavDownButton(page);
                    addedDirect++;
                } else {
                    // Кнопки в модальном окне "Ещё"
                    const moreBtn = document.createElement('button');
                    moreBtn.className = 'navbtn';
                    moreBtn.innerHTML = `<img src="${page.icon}" alt=""><span>${page.title}</span>`;
                    
                    moreBtn.onclick = () => {
                        // Снимаем активные состояния
                        document.querySelectorAll('.navbtn.active').forEach(el => el.classList.remove('active'));
                        
                        // Переключаем страницу
                        switchPage(document.getElementById(page.id));
                        
                        // Закрываем модальное окно
                        const modalWindow = modalDiv.closest('.modal');
                        if (modalWindow) {
                            modalWindow.classList.remove('active');
                        }
                    };
                    
                    modalContent.appendChild(moreBtn);
                    overflowCount++;
                }
            }
            
            window.cnavMgr.createHeadOfPage(page);
        }

        // === КНОПКА "ЕЩЁ" В НИЖНЕЙ ПАНЕЛИ ===
        if (needMore && overflowCount > 0) {
            // Создаём кнопку "Ещё" с обработчиком открытия модалки
            const moreNavBtn = document.createElement('button');
            moreNavBtn.className = 'navbtn';
            moreNavBtn.innerHTML = `<img src="img/ui/lines.svg" alt="Ещё"><span>Ещё</span>`;
            moreNavBtn.id = 'more-nav-btn';
            
            moreNavBtn.onclick = () => {
                // Открываем модальное окно
                const modalWindow = modalDiv.closest('.modal');
                if (modalWindow) {
                    modalWindow.classList.toggle('active');
                }
                this.content.classList.toggle('modal-open');
                
                // Визуальная обратная связь (опционально)
                //document.querySelectorAll('.navbtn.active').forEach(el => el.classList.remove('active'));
                moreNavBtn.classList.toggle('active');
            };
            
            window.cnavMgr.navDown.appendChild(moreNavBtn); // Предполагается, что navDown — контейнер нижней панели
        }

        // === АДАПТАЦИЯ СТИЛЕЙ ПОД КОЛИЧЕСТВО СТРАНИЦ ===
        document.body.classList.toggle('nav-fewpages', pages.length < 6);
    }


    getActivePage() {
        return document.querySelector('.page.active') || document.querySelector('.page');
    }

    scrollToTop() {
        const container = getActivePage();
        if (container) {
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    scrollToBottom() {
        const container = getActivePage();
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }

    switchPage(newpage, subname) {
        window.cnavMgr.lastestPage = document.querySelector('.page.active:not(.right)')?.id;
        window.cnavMgr.currentPage = newpage.id;
        const rightCurrent = document.querySelector('.page.active.right');
        const current = rightCurrent? rightCurrent : document.querySelector('.page.active');
        if (!newpage || newpage === current) {
            if (rightCurrent && (subname == null || subname === rightCurrent.dataset.currentSubname)) {
                const parentPage = document.querySelector('.page.active:not(.right)');
                parentPage.classList.remove('active', 'right');
                parentPage.classList.add('leave-left')
                content.classList.remove('two', 'twomodal');
                current.classList.remove('right');
                current.dataset.currentSubname = null
                return;
            } else if (subname != null && rightCurrent && subname != rightCurrent.dataset.currentSubname) {
                rightCurrent.dataset.currentSubname = subname
            } else {
                return;
            }
        }

        // если сейчас активна подстраница — берём её родителя
        const parentElement = document.getElementById(current?.dataset?.parent); 
        const basePage = current?.dataset?.parent && parentElement?.classList.contains('active')
            ? document.getElementById(current.dataset.parent)
            : current;

        const basePageData = window.cnavMgr.pages.find(p => p.id === basePage.id);
        let isSubpage = isMobile? false : Array.isArray(basePageData?.subpages) ? basePageData.subpages.includes(newpage.id) : false;

        if (!isSubpage) {
            // обычная смена страниц
            current.classList.remove('active', 'right');
            current.classList.add('leave-left');
            const lastToHide = document.querySelector('.page.active')
            if (lastToHide) {
                lastToHide.classList.remove('active', 'right');
                lastToHide.classList.add('leave-left')
            }

            content.classList.remove('two', 'twomodal');
            document.querySelector('.page.active.right')?.classList.remove('active');
        } else {
            // открываем подстраницу справа
            content.classList.add(basePageData.subpagesmode == 'modal' ? 'twomodal' : 'two');

            // убираем старую подстраницу, если была
            document.querySelectorAll('.page.right.active').forEach(p => {
                p.classList.remove('active', 'right');
                p.classList.add('leave-right');
            });

            
            newpage.classList.add('right');
            newpage.dataset.currentSubname = subname
            newpage.dataset.parent = basePage.id;
        }

        newpage.classList.remove('leave-left', 'leave-right');
        newpage.classList.add('active');

        if (!isSubpage) {
            document.querySelectorAll('.navbtn.active').forEach(el => {
                el.classList.remove('active');
            });

            document.getElementById(`${newpage.id}-navc`)?.classList.add('active');
            document.getElementById(`${newpage.id}-navd`)?.classList.add('active');

            setTimeout(() => {
                current.classList.remove('leave-left', 'leave-right');
            }, 400);
        }

        if (isMobile && document.getElementById('nav').classList.contains('active')) {
            openNavPanel();
        }
    }

    changePage(newpage, subname) {
        switchPage(document.getElementById(newpage), subname);
    }

    handleOutsideClick(event) {
        if (!nav.contains(event.target)) {
            openNavPanel();
        }
    }

    handleSwipeStart(event) {
        window.cnavMgr.touchStartX = event.touches[0].clientX;
        window.cnavMgr.touchStartY = event.touches[0].clientY;
    }

    handleSwipeEnd(event) {
        if (!nav.classList.contains('active')) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;

        const deltaX = touchEndX - window.cnavMgr.touchStartX;
        const deltaY = touchEndY - window.cnavMgr.touchStartY;

        // Игнорируем, если свайп больше по вертикали, чем по горизонтали
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;

        // Свайп влево и длиннее 50px
        if (deltaX < -50) {
            openNavPanel();
        }
    }

    openNavPanel() {
        const isOpen = nav.classList.contains('active');

        if (isMobile) {
            if (isOpen) {
                content.classList.remove('modal-open');
                window.cnavMgr.navDown.classList.remove('modal-open');
                content.removeEventListener('click', window.cnavMgr.handleOutsideClick);
                document.removeEventListener('touchstart', window.cnavMgr.handleSwipeStart);
                document.removeEventListener('touchend', window.cnavMgr.handleSwipeEnd);
            } else {
                content.classList.add('modal-open');
                window.cnavMgr.navDown.classList.add('modal-open');
                setTimeout(() => {
                    content.addEventListener('click', window.cnavMgr.handleOutsideClick);
                }, 0);
                document.addEventListener('touchstart', window.cnavMgr.handleSwipeStart);
                document.addEventListener('touchend', window.cnavMgr.handleSwipeEnd);
            }
        }

        nav.classList.toggle('active');
    }

    returnToPage() {
        const rightPage = document.querySelector('.right');
        if (rightPage) {
            changePage(rightPage.dataset.parent);
        } else {
            try { changePage(window.cnavMgr.lastestPage) } catch(e) {};
        }
    };
}

window.cnavMgr = new Nav();