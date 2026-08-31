const mql = window.matchMedia("(orientation: landscape)");

const handleOrientation = (e) => {
    if (e.matches && document.documentElement.scrollWidth > 1000) {
        console.log("Сейчас горизонтально");
        window.isMobile = false;
    } else {
        console.log("Сейчас вертикально");
        window.isMobile = true;
    }
};

// Слушаем изменения
mql.addEventListener('change', handleOrientation);

// Первая проверка
handleOrientation(mql);
!isMobile ? document.getElementById('nav').classList.toggle('active') : null;