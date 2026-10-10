class ThemesMgr {
    constructor() {
        this.theme = 'dark'
        this.body = document.body
        this.blackDown = false
    }

    init() {
        this.body.dataset.theme = window.settings.main.theme || 'dark'
        this.blackDown = window.eelib.theme.blackDown || false
        this.applyBlackDown()
    }

    changeTheme(theme) {
        this.theme = theme
        this.body.dataset.theme = this.theme
    }

    applyBlackDown(mode = this.blackDown) {
        let blackDownEl = document.getElementById('blackDown')
        if (!blackDownEl) {
            blackDownEl = document.createElement('div')
            blackDownEl.id = 'blackDown'
            blackDownEl.style.transition = 'opacity 0.5s'
            blackDownEl.style.pointerEvents = 'none'
            document.getElementById('content').appendChild(blackDownEl)
        }

        if (mode === false) {
            blackDownEl.style.background = 'linear-gradient(180deg,rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)'
        } else if (mode === true || mode === 'top' || mode === 'two') {
            if (mode === true) {
                blackDownEl.style.background = 'linear-gradient(180deg,rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 1) 100%)'
            } else if (mode === 'top') {
                blackDownEl.style.background = 'linear-gradient(180deg,rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0) 100%)'
            } else if (mode === 'two') {
                blackDownEl.style.background = 'linear-gradient(180deg,rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 1) 100%)'
            }
        }
    }

    hideBlackDown(mode) {
        let blackDownEl = document.getElementById('blackDown');
        if (!blackDownEl) return;

        if (mode === true) {
            blackDownEl.style.opacity = '0';
        } else if (mode === false) {
            blackDownEl.style.opacity = '1';
        } else {
            let currentOpacity = blackDownEl.style.opacity === '' ? 1 : parseFloat(blackDownEl.style.opacity);
            blackDownEl.style.opacity = currentOpacity === 0 ? '1' : '0';
        }
    }
}

window.ThemesMgr = new ThemesMgr