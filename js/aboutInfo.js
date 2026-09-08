class AboutRuntimeInfo {
    constructor() {
        this.container = document.getElementById('aboutRuntimeInfo')
        this.nativeInfo = {}
        this.render()
        this.refreshNativeInfo()
        setInterval(() => this.render(), 1000)
    }

    escape(value) {
        const element = document.createElement('span')
        element.textContent = String(value ?? '—')
        return element.innerHTML
    }

    getPageTitle(pageId) {
        return window.cnavMgr?.pages?.find(page => page.id === pageId)?.title || pageId || '—'
    }

    render() {
        if (!this.container) return
        const pageId = window.cnavMgr?.currentPage || document.querySelector('.page.active')?.id
        const schedule = window.settings?.schedule
        const lessonCount = Object.keys(schedule?.lessons || {}).length
        const dayCount = (schedule?.daySchedules || []).filter(day => day?.length).length
        const aodActive = document.getElementById('aod')?.classList.contains('active')
        const location = window.location
        const currentUrl = location.href || '—'
        const rows = {
            'Текущая страница': this.getPageTitle(pageId),
            'ID страницы': pageId,
            'Режим': window.bridge?.env === 'android' ? 'Android' : window.bridge?.env || 'Web',
            'AOD': aodActive ? 'активен' : 'выключен',
            'Тема': window.settings?.main?.theme,
            'Язык': window.settings?.main?.lang,
            'Уроков': lessonCount,
            'Дней с расписанием': dayCount,
            'Экран': `${window.innerWidth} x ${window.innerHeight} (${window.devicePixelRatio || 1}x)`,
            'Онлайн': navigator.onLine ? 'да' : 'нет',
            'Текущая ссылка': currentUrl,
            'Протокол': location.protocol,
            'Хост': location.host || 'локальный файл',
            'Путь': location.pathname,
            'Источник перехода': document.referrer || 'нет',
            'Платформа браузера': navigator.platform || '—',
            'User-Agent': navigator.userAgent,
            'Язык браузера': navigator.language || '—',
            'Часовой пояс': Intl.DateTimeFormat().resolvedOptions().timeZone || '—',
            'Видимость страницы': document.visibilityState,
            ...this.nativeInfo
        }
        this.container.innerHTML = Object.entries(rows)
            .map(([label, value]) => `<p><strong>${this.escape(label)}:</strong> ${this.escape(value)}</p>`)
            .join('')
    }

    async refreshNativeInfo() {
        if (!window.bridge?.getAppInfo) return
        try {
            const info = await window.bridge.getAppInfo()
            if (info && typeof info === 'object') {
                this.nativeInfo = info
                this.render()
            }
        } catch (error) {
            console.warn('Не удалось получить информацию Android:', error)
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aboutRuntimeInfo = new AboutRuntimeInfo()
})