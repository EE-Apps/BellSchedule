class ThemesMgr {
    constructor() {
        this.theme = 'dark'
        this.body = document.body
    }

    init() {
        this.body.dataset.theme = window.settings.main.theme || 'dark'
    }

    changeTheme(theme) {
        this.theme = theme
        this.body.dataset.theme = this.theme
    }
}

window.ThemesMgr = new ThemesMgr