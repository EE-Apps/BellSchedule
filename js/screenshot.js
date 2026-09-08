window.makeScreenshot = async (elQuery) => {
    const element = document.querySelector(elQuery);
    if (!element) return console.error(`Элемент "${elQuery}" не найден`);

    // 1. Сохраняем исходные стили
    const originalPadding = element.style.padding;
    const originalBackground = element.style.background;

    // 2. Временные изменения
    element.style.padding = 'var(--ds)';
    element.style.background = 'var(--c-gray-900)';
    
    const watermark = document.createElement('p');
    watermark.id = 'screenshotWatermark';
    watermark.innerText = 'EE BellSchedule';
    watermark.style.textAlign = 'center';
    watermark.style.width = '100%';
    watermark.style.marginTop = 'var(--ds)';
    watermark.style.fontSize = 'var(--text-size-head)';
    element.appendChild(watermark);

    try {
        if (typeof window.html2canvas !== 'function') {
            window.print()
            return
        }
        const canvas = await html2canvas(element, {
            scale: Math.min(window.devicePixelRatio || 1, 1.5),
            useCORS: true
        });

        await shareOrDownload(canvas);
    } catch (err) {
        console.error('Ошибка создания скриншота:', err);
    } finally {
        // 3. Очистка выполняется ВСЕГДА (даже при ошибках)
        element.style.padding = originalPadding;
        element.style.background = originalBackground;
        watermark.remove();
    }
};

async function canvasToFile(canvas, fileName) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(new File([blob], fileName, { type: 'image/png' }));
        }, 'image/png');
    });
}

async function shareOrDownload(canvas) {
    if (window.AndroidBridge?.shareImage) {
        const base64Data = canvas.toDataURL("image/png");
        window.AndroidBridge.shareImage(base64Data);
        return;
    }

    const file = await canvasToFile(canvas, 'screenshot.png');

    // Web Share API с фоллбэком
    if (navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Расписание',
                text: 'Сделано в EE BellSchedule'
            });
            return;
        } catch (error) {
            if (error.name === 'AbortError') return; // Пользователь просто закрыл меню "Поделиться"
            console.error('Ошибка Web Share API, переход к скачиванию:', error);
        }
    }

    fallbackDownload(file);
}

function fallbackDownload(file) {
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(file);
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Небольшая задержка перед отзывом URL для корректной работы в мобильных Firefox/Safari
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
}