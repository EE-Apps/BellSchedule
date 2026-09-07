// js/updateChecker.js

class UpdateChecker {
    static REPO = 'EE-Apps/BellSchedule'
    static BRANCH = 'main'
    static VERSION_FILE = 'version.json'
    static AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 часов

    constructor() {
        this.els = {
            status:     document.getElementById('updateStatus'),
            button:     document.getElementById('checkUpdateBtn'),
            buttonText: document.getElementById('checkUpdateBtnText'),
            autoToggle: document.getElementById('updateAutoCheckToggle'),
            autoLabel:  document.getElementById('updateAutoCheckLabel'),
            title:      document.getElementById('updatesTitle'),
            version:    document.getElementById('aboutAppVersion'),
        }

        this.localVersion = null
        this.init()
    }

    /**
     * Определение ключа версии в зависимости от окружения:
     * 1. Внутри Android-приложения (window.bridge.env === 'Android') -> 'apk'
     * 2. Хост 192.168.100.18 -> 'dev'
     * 3. Во всех остальных случаях -> 'main'
     */
    getTargetKey() {
        if (window.bridge && ( window.bridge.env === 'Android' || window.bridge.env === 'android' )) {
            return 'apk'
        }
        if (window.location.hostname === '192.168.100.18' || window.location.hostname === '127.0.0.1') {
            return 'dev'
        }
        return 'main'
    }

    async init() {
        this.renderStaticText()
        this.renderAutoToggle()
        this.eventListeners()

        // Сначала загружаем локальную версию (из assets или с сервера)
        await this.loadLocalVersion()
        this.maybeAutoCheck()
    }

    renderStaticText() {
        if (this.els.title)     this.els.title.textContent = window.translator.translate('updates_title')
        if (this.els.autoLabel) this.els.autoLabel.textContent = window.translator.translate('auto_check_updates')

        const btnTextEl = this.els.buttonText || this.els.button
        if (btnTextEl) btnTextEl.textContent = window.translator.translate('check_for_updates')
    }

    eventListeners() {
        this.els.button?.addEventListener('click', () => this.check(true))
        this.els.autoToggle?.addEventListener('change', () => {
            window.settingsManager.set('updates.autoCheck', this.els.autoToggle.checked)
        })
    }

    renderAutoToggle() {
        if (!this.els.autoToggle) return
        this.els.autoToggle.checked = window.settingsManager.get('updates.autoCheck') !== false
    }

    async loadLocalVersion() {
        try {
            const res = await fetch(UpdateChecker.VERSION_FILE, { cache: 'no-store' })
            if (!res.ok) return
            const data = await res.json()

            const key = this.getTargetKey()
            this.localVersion = String(data[key] ?? '')

            if (this.els.version && this.localVersion) {
                this.els.version.textContent = `${window.translator.translate('version')}: ${this.localVersion}`
            }
        } catch (e) {
            console.error('Не удалось загрузить локальную версию:', e)
        }
    }

    maybeAutoCheck() {
        if (window.settingsManager.get('updates.autoCheck') === false) return

        const lastCheckedAt = window.settingsManager.get('updates.lastCheckedAt')
        const dueForCheck = !lastCheckedAt || (Date.now() - lastCheckedAt) > UpdateChecker.AUTO_CHECK_INTERVAL_MS

        if (dueForCheck) this.check(false)
    }

    async check(manual = false) {
        this.setLoadingState(true, manual)

        try {
            const [localRes, remoteRes] = await Promise.all([
                fetch(UpdateChecker.VERSION_FILE, { cache: 'no-store' }),
                fetch(`https://raw.githubusercontent.com/${UpdateChecker.REPO}/${UpdateChecker.BRANCH}/${UpdateChecker.VERSION_FILE}?_=${Date.now()}`)
            ])

            if (!localRes.ok || !remoteRes.ok) throw new Error('Bad response')

            const [localData, remoteData] = await Promise.all([localRes.json(), remoteRes.json()])

            const targetKey = this.getTargetKey()
            const localVer = String(localData[targetKey] ?? '')
            const remoteVer = String(remoteData[targetKey] ?? '')

            this.localVersion = localVer
            window.settingsManager.set('updates.lastCheckedAt', Date.now())

            if (this.isNewerVersion(localVer, remoteVer)) {
                this.setStatus(`${window.translator.translate('update_available')} (${localVer} → ${remoteVer})`, true)
            } else {
                this.setStatus(window.translator.translate('update_none'))
            }
        } catch (e) {
            console.error('Проверка обновлений не удалась:', e)
            if (manual) this.setStatus(window.translator.translate('update_error'))
        } finally {
            this.setLoadingState(false, manual)
        }
    }

    isNewerVersion(current, remote) {
        if (!current || !remote) return false

        const cParts = current.split('.').map(Number)
        const rParts = remote.split('.').map(Number)

        for (let i = 0; i < Math.max(cParts.length, rParts.length); i++) {
            const c = cParts[i] || 0
            const r = rParts[i] || 0
            if (r > c) return true
            if (r < c) return false
        }
        return false
    }

    setLoadingState(isLoading, manual) {
        if (this.els.button) this.els.button.disabled = isLoading
        if (manual && isLoading) {
            this.setStatus(window.translator.translate('update_checking'))
        }
    }

    setStatus(text, isUpdateAvailable = false) {
        if (!this.els.status) return
        this.els.status.textContent = text
        this.els.status.classList.toggle('updateAvailable', isUpdateAvailable)

        // Если это Android и есть обновление — делаем статус кликабельной ссылкой/кнопкой
        if (isUpdateAvailable && this.getTargetKey() === 'apk') {
            this.els.status.style.cursor = 'pointer'
            this.els.status.title = 'Нажмите, чтобы скачать APK'
            
            // Удаляем старый слушатель, если был, и добавляем новый
            this.els.status.onclick = () => this.downloadApk()
        } else {
            this.els.status.style.cursor = ''
            this.els.status.title = ''
            this.els.status.onclick = null
        }
    }

    downloadApk() {
        const apkUrl = 'http://ee-apps.github.io/download/bellschedule.apk'
        
        // 1. Проверяем, есть ли у моста метод для скачивания/открытия ссылок
        if (window.bridge && typeof window.bridge.downloadApk === 'function') {
            window.bridge.downloadApk(apkUrl)
        } else if (window.bridge && typeof window.bridge.openUrl === 'function') {
            window.bridge.openUrl(apkUrl)
        } else {
            // Fallback: пробуем открыть системным браузером/переходом
            window.open(apkUrl, '_blank')
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.updateChecker = new UpdateChecker()
})