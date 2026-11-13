// await window.waitForVariable(() => window.user.status, 'active', 500)
window.waitForVariable = function waitForVariable(getter, targetValue, interval = 100) {
    return new Promise((resolve) => {
        const timer = setInterval(() => {
            if (getter() === targetValue) {
                clearInterval(timer);
                resolve()
            }
        }, interval)
    })
}