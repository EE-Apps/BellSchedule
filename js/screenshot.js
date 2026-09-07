window.makeScreenshot = async (elQuery) => {
    const element = document.querySelector(elQuery);
    element.style.padding = 'var(--ds)'
    element.style.background = 'var(--c-gray-900)'
    
    const watermark = document.createElement('p')
    watermark.id = 'screenshotWatermark'
    watermark.innerText = 'EE BellSchedule'
    watermark.style.textAlign = 'center'
    watermark.style.width = '100%'
    watermark.style.marginTop = 'var(--ds)'
    watermark.style.fontSize = 'var(--text-size-head)'
    element.appendChild(watermark)

    const canvas = await html2canvas(element, {
        scale: 10,
        useCORS: true
    });

    await shareOrDownload(canvas);
    
    element.style.padding = null
    element.style.background = null
    watermark.remove()
}

async function canvasToFile(canvas, fileName) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            const file = new File([blob], fileName, { type: 'image/png' });
            resolve(file);
        }, 'image/png');
    });
}

async function shareOrDownload(canvas) {
    if (window.AndroidBridge && window.AndroidBridge.shareImage) {
        console.log('Используем нативный shareImage через AndroidBridge');
        const base64Data = canvas.toDataURL("image/png");
        window.AndroidBridge.shareImage(base64Data);
        return;
    }

    const file = await canvasToFile(canvas, 'screenshot.png');
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Расписание',
                text: 'Сделано в EE BellSchedule'
            });
        } catch (error) {
            if (error.name !== 'AbortError') console.error('Ошибка Web Share API:', error);
        }
    } else {
        fallbackDownload(file);
    }
}

function fallbackDownload(file) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}