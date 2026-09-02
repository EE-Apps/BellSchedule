// js/updateChecker.js

class updateChecker {
    static REPO = 'EE-Apps/BellSchedule'
    static BRANCH = 'main'
    static VERSION_FILE = 'version.json'
    // не проверять чаще, чем раз в это время при автопроверке (мс)
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

        this.init()
    }

    init() {
        this.renderStaticText()
        this.renderAutoToggle()
        this.eventListeners()
        this.loadLocalVersion()
        this.maybeAutoCheck()
    }

    renderStaticText() {
        if (this.els.title)     this.els.title.textContent = window.translator.translate('updates_title')
        if (this.els.autoLabel) this.els.autoLabel.textContent = window.translator.translate('auto_check_updates')
        if (this.els.button)    this.els.button.textContent = window.translator.translate('check_for_updates')
    }

    eventListeners() {
        this.els.button?.addEventListener('click', () => this.check(true))
        this.els.autoToggle?.addEventListener('change', () => {
            window.settingsManager.set('updates.autoCheck', this.els.autoToggle.checked)
        })
    }

    renderAutoToggle() {
        if (!this.els.autoToggle) return
        // включено по умолчанию, если в настройках явно не выключено
        this.els.autoToggle.checked = window.settingsManager.get('updates.autoCheck') !== false
    }

    async loadLocalVersion() {
        try {
            const res = await fetch(updateChecker.VERSION_FILE, { cache: 'no-store' })
            if (!res.ok) return
            const data = await res.json()
            this.localVersion = data.version
            if (this.els.version) {
                this.els.version.textContent = window.translator.translate('version') + ': ' + data.version
            }
        } catch (e) {
            console.error('Не удалось загрузить локальную версию:', e)
        }
    }

    maybeAutoCheck() {
        if (window.settingsManager.get('updates.autoCheck') === false) return

        const lastCheckedAt = window.settingsManager.get('updates.lastCheckedAt')
        const dueForCheck = !lastCheckedAt || (Date.now() - lastCheckedAt) > updateChecker.AUTO_CHECK_INTERVAL_MS

        if (dueForCheck) this.check(false)
    }

    async check(manual = false) {
        if (manual) this.setStatus(window.translator.translate('update_checking'))

        try {
            const [localRes, remoteRes] = await Promise.all([
                fetch(updateChecker.VERSION_FILE, { cache: 'no-store' }),
                fetch(`https://raw.githubusercontent.com/${updateChecker.REPO}/${updateChecker.BRANCH}/${updateChecker.VERSION_FILE}?_=${Date.now()}`)
            ])

            if (!localRes.ok || !remoteRes.ok) throw new Error('bad response')

            const [localData, remoteData] = await Promise.all([localRes.json(), remoteRes.json()])
            this.localVersion = localData.version

            window.settingsManager.set('updates.lastCheckedAt', Date.now())

            if (localData.version !== remoteData.version) {
                this.setStatus(`${window.translator.translate('update_available')} (${localData.version} → ${remoteData.version})`, true)
            } else {
                this.setStatus(window.translator.translate('update_none'))
            }
        } catch (e) {
            console.error('Проверка обновлений не удалась:', e)
            if (manual) this.setStatus(window.translator.translate('update_error'))
        }
    }

    setStatus(text, isUpdateAvailable = false) {
        if (!this.els.status) return
        this.els.status.textContent = text
        this.els.status.classList.toggle('updateAvailable', isUpdateAvailable)
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.updateChecker = new updateChecker()
})