class EElib {
    constructor() {

    }
    
    runProcess() {
        // Init



        // Tools
        window.switchPage   = window.cnavMgr.switchPage;
        window.changePage   = window.cnavMgr.changePage;
        window.createNav    = window.cnavMgr.createNav;
        window.openNavPanel = window.cnavMgr.openNavPanel;
        window.returnToPage = window.cnavMgr.returnToPage



        // Run
        this.initializeNav()
        window.settingsManager.generateUI('settings')
    }

    initializeNav() {
        if (window.pagesManager && typeof window.pagesManager.createBtnList === 'function') {
            console.log('Initializing navigation...');
            window.cnavMgr.init(window.eelib.pages);
            window.cnavMgr.createNav(window.eelib.pages);
        } else {
            console.log('Waiting for pagesManager...');
            window.addEventListener('pagesManagerReady', () => {
                console.log('pagesManager ready, initializing navigation...');
                window.cnavMgr.init(window.eelib.pages);
                window.cnavMgr.createNav(window.eelib.pages);
            }, { once: true });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.eelibMgr = new EElib
    window.eelibMgr.runProcess()
})