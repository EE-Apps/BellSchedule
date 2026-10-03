/**
 * SettingsManager - управление настройками приложения с синхронизацией
 * 
 * Синхронизирует настройки между:
 * - localStorage (web и везде как кэш)
 * - Файлами приложения Android/Tauri (через bridge, файл settings.json)
 */
class SettingsManager {
    constructor() {
        this.settings = {};
        this.storageKey = '';
        this.defaultSettings = {};
        this.schema = {};
        this.onChange = null;
        this.bridge = window.bridge || null;
        this.settingsFileName = 'settings.json';
        this.isSyncing = false;

        // Безопасное получение конфигурации (избегаем ошибок, если eelib ещё не загружен)
        const config = (typeof window !== 'undefined' && window.eelib && window.eelib.settingsConfig) 
            ? window.eelib.settingsConfig 
            : {};
            
        this.init(config);
    }

    // Инициализация настроек
    init({ storageKey = 'app_settings', defaultSettings = {}, schema = {}, onChange = null, settingsFileName = 'settings.json' } = {}) {
        this.storageKey = storageKey;
        this.defaultSettings = defaultSettings;
        this.schema = schema;
        this.onChange = onChange;
        this.settingsFileName = settingsFileName;
        
        // 1. Синхронная загрузка из localStorage (мгновенный рендер UI)
        this.loadSync();
        
        // 2. Асинхронная загрузка из файла settings.json (если доступен bridge)
        if (this.bridge && this.bridge.env !== 'web') {
            this.loadFromBridge();
        }
        
        return this;
    }

    // Синхронная загрузка из localStorage и дефолтных настроек
    loadSync() {
        try {
            let loaded = null;
            
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                try {
                    loaded = JSON.parse(saved);
                    console.log('[SettingsManager] Loaded from localStorage');
                } catch (e) {
                    console.error('[SettingsManager] Error parsing localStorage:', e);
                    loaded = null;
                }
            }

            if (loaded && typeof loaded === 'object') {
                this.settings = this.deepMerge(this.defaultSettings, loaded);
            } else {
                this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
            }

            window.settings = this.settings;
        } catch (e) {
            console.error('[SettingsManager] Error in loadSync():', e);
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
            window.settings = this.settings;
        }
    }

    // Асинхронная загрузка из файла settings.json (Android/Tauri)
    async loadFromBridge() {
        try {
            // Читаем именно из this.settingsFileName
            const loaded = await this.bridge.getSettings(this.settingsFileName);
            if (loaded && typeof loaded === 'object' && Object.keys(loaded).length > 0) {
                this.settings = this.deepMerge(this.settings, loaded);
                window.settings = this.settings;
                console.log(`[SettingsManager] Merged settings from ${this.bridge.env} (${this.settingsFileName}):`, loaded);
                
                // Обновляем localStorage актуальными данными из файла
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));

                if (this.onChange) {
                    this.onChange(this.settings);
                }
            }
        } catch (e) {
            console.warn(`[SettingsManager] Failed to load from ${this.bridge.env}:`, e);
        }
    }

    // Загрузка настроек (для обратной совместимости)
    async load() {
        this.loadSync();
        if (this.bridge && this.bridge.env !== 'web') {
            await this.loadFromBridge();
        }
    }

    // Сохранение настроек (в localStorage и в файл settings.json)
    async save() {
        if (this.isSyncing) return; // Предотвращаем рекурсию
        
        try {
            this.isSyncing = true;

            // 1. Сохраняем в localStorage (всегда, как кэш и для web-версии)
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                console.log('[SettingsManager] Saved to localStorage');
            } catch (e) {
                console.error('[SettingsManager] Error saving to localStorage:', e);
            }

            // 2. Сохраняем в файл settings.json через bridge (Android/Tauri/Web Mock)
            if (this.bridge) {
                try {
                    // ВАЖНО: явно передаем this.settingsFileName
                    const result = await this.bridge.saveSettings(this.settings, this.settingsFileName);
                    console.log(`[SettingsManager] Saved to file (${this.bridge.env}):`, result);
                } catch (e) {
                    console.warn(`[SettingsManager] Failed to save to file (${this.bridge.env}):`, e);
                }
            }

            // 3. Вызываем callback
            if (this.onChange) {
                this.onChange(this.settings);
            }
        } catch (e) {
            console.error('[SettingsManager] Error in save():', e);
        } finally {
            this.isSyncing = false;
        }
    }

    // Получение значения по пути
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.settings);
    }

    // Установка значения по пути (синхронно обновляет, асинхронно сохраняет)
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.settings;
        
        for (const key of keys) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
        this.save(); // Асинхронное сохранение
        return value;
    }

    del(path) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this.settings;

        for (const key of keys) {
            if (!target || typeof target !== 'object') {
                return false;
            }
            target = target[key];
        }

        if (target && Object.prototype.hasOwnProperty.call(target, lastKey)) {
            delete target[lastKey];
            this.save();
            return true;
        }

        return false;
    }

    // Генерация UI настроек
    generateUI(containerId) {
        const container = document.createElement('div');
        container.className = 'pageContent';
        const targetContainer = document.getElementById(containerId);
        if (!targetContainer) return;
        
        const pageContainer = targetContainer.querySelector(".pageContainer") || targetContainer;
        pageContainer.appendChild(container);

        Object.entries(this.schema).forEach(([sectionKey, section]) => {
            const sectionEl = document.createElement("div");
            sectionEl.className = "settings-section";

            sectionEl.innerHTML = `
                <div class="settings-header hideSettSection" data-section="sett-${sectionKey}">
                    <h2>${section.title}</h2>
                    <img src="img/ui/arrow/up.svg" style="rotate: 90deg; width: 16px;">
                </div>
                <div id="sett-${sectionKey}" class="settingsSectionDiv" style="height: 0px; overflow: hidden; transition: height 0.3s ease;"></div>
            `;

            sectionEl.querySelector(".hideSettSection").onclick = (e) => {
                const targetId = e.currentTarget.getAttribute("data-section");
                const targetEl = document.getElementById(targetId);
                if (targetEl.style.height === '0px') {
                    targetEl.style.height = targetEl.scrollHeight + 'px';
                    e.currentTarget.querySelector('img').style.rotate = '0deg';
                    sectionEl.classList.add('active');
                    targetEl.classList.add('active');
                } else {
                    targetEl.style.height = '0px';
                    e.currentTarget.querySelector('img').style.rotate = '90deg';
                    sectionEl.classList.remove('active');
                    targetEl.classList.remove('active');
                }
            };

            const body = sectionEl.querySelector(".settingsSectionDiv");
            if (section.items) {
                section.items.forEach(item => {
                    body.appendChild(this.createSettingItem(sectionKey, item));
                });
            }

            container.appendChild(sectionEl);
        });
    }

    // Создание элемента настройки
    createSettingItem(sectionKey, item) {
        const sectionSettings = this.settings[sectionKey] || {};
        const value = sectionSettings[item.key];
        const block = document.createElement("div");
        block.className = "settingsBlock";

        if (item.type === "toggle") {
            block.innerHTML = `
                <label>${item.label}</label>
                <label class="oneui-switch">
                    <input type="checkbox" ${value ? "checked" : ""}>
                    <span class="slider"></span>
                </label>
            `;
            block.querySelector("input").addEventListener("change", e => {
                this.set(`${sectionKey}.${item.key}`, e.target.checked);
            });
        }

        if (item.type === "select") {
            const options = Object.entries(item.options)
                .map(([v, l]) => `<option value="${v}" ${String(v) === String(value) ? "selected" : ""}>${l}</option>`)
                .join("");

            block.innerHTML = `
                <label>${item.label}</label>
                <select class="settings-select">${options}</select>
            `;
            block.querySelector("select").addEventListener("change", e => {
                this.set(`${sectionKey}.${item.key}`, e.target.value);
            });
        }

        if (item.type === "text") {
            const placeholder = item.placeholder || "";
            block.innerHTML = `
                <label>${item.label}</label>
                <input type="text" class="settings-text" value="${value || ""}" placeholder="${placeholder}">
            `;
            block.querySelector("input").addEventListener("change", e => {
                this.set(`${sectionKey}.${item.key}`, e.target.value);
            });
        }

        return block;
    }

    // Глубокое слияние объектов
    deepMerge(target, source) {
        const result = JSON.parse(JSON.stringify(target));
        for (const key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    // Сброс к дефолтным настройкам (с перезаписью файла)
    reset() {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        this.save();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.settingsManager = new SettingsManager();
});


(function () {
    /**
     * CrossPlatformBridge - единая система доступа к нативным функциям
     */
    class CrossPlatformBridge {
        constructor() {
            this.env = this.detectEnvironment();
            console.log(`[Bridge] Initialized in environment: ${this.env}`);
        }

        detectEnvironment() {
            if (typeof window.AndroidBridge !== 'undefined') {
                return 'android';
            }
            if (typeof window.__TAURI__ !== 'undefined' || typeof window.__TAURI_IPC__ !== 'undefined') {
                return 'tauri';
            }
            return 'web';
        }

        callAndroidNative(methodName, ...args) {
            return new Promise((resolve) => {
                const callbackId = `cb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                window[callbackId] = (data) => {
                    delete window[callbackId];
                    resolve(data);
                };

                try {
                    if (typeof window.AndroidBridge[methodName] === 'function') {
                        window.AndroidBridge[methodName](...args, callbackId);
                    } else {
                        console.error(`[Bridge Android] Method ${methodName} not found on AndroidBridge`);
                        delete window[callbackId];
                        resolve(null);
                    }
                } catch (error) {
                    console.error(`[Bridge Android] Error calling ${methodName}:`, error);
                    delete window[callbackId];
                    resolve(null);
                }
            });
        }

        // ==========================================
        // ПУБЛИЧНЫЕ МЕТОДЫ ИНТЕРФЕЙСА
        // ==========================================

        async readFile(fileName) {
            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('readFile', fileName);
                case 'tauri':
                    if (window.__TAURI__ && window.__TAURI__.fs) {
                        return await window.__TAURI__.fs.readTextFile(fileName);
                    }
                    return '';
                case 'web':
                default:
                    return localStorage.getItem(`mock_file_${fileName}`) || '';
            }
        }

        async writeFile(fileName, content) {
            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('writeFile', fileName, content);
                case 'tauri':
                    if (window.__TAURI__ && window.__TAURI__.fs) {
                        await window.__TAURI__.fs.writeTextFile(fileName, content);
                        return true;
                    }
                    return false;
                case 'web':
                default:
                    localStorage.setItem(`mock_file_${fileName}`, content);
                    return true;
            }
        }

        /**
         * Чтение настроек из файла settings.json
         */
        async getSettings(fileName = 'settings.json') {
            switch (this.env) {
                case 'android': {
                    const res = await this.callAndroidNative('readFile', fileName);
                    try {
                        return typeof res === 'string' ? JSON.parse(res) : (res || {});
                    } catch (e) {
                        console.error(`[Bridge Android] Error parsing settings from ${fileName}:`, e);
                        return {};
                    }
                }
                case 'tauri': {
                    try {
                        if (window.__TAURI__ && window.__TAURI__.fs) {
                            const content = await window.__TAURI__.fs.readTextFile(fileName);
                            return JSON.parse(content);
                        }
                        return {};
                    } catch (e) {
                        // Файл может ещё не существовать при первом запуске
                        console.warn(`[Bridge Tauri] Settings file ${fileName} not found or unreadable:`, e);
                        return {};
                    }
                }
                case 'web':
                default: {
                    // ИСПРАВЛЕНО: теперь используем fileName, а не хардкодный 'mock_settings'
                    const saved = localStorage.getItem(`mock_file_${fileName}`);
                    return saved ? JSON.parse(saved) : {};
                }
            }
        }

        /**
         * Обновление конкретного параметра в файле настроек
         */
        async updateSetting(key, value, fileName = 'settings.json') {
            switch (this.env) {
                case 'android': {
                    const valString = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    return await this.callAndroidNative('updateSetting', key, valString, fileName);
                }
                case 'tauri': {
                    try {
                        // Читаем текущие, обновляем ключ, сохраняем обратно
                        const currentSettings = await this.getSettings(fileName);
                        currentSettings[key] = value;
                        return await this.saveSettings(currentSettings, fileName);
                    } catch (e) {
                        console.error('[Bridge Tauri] Error updating setting:', e);
                        return false;
                    }
                }
                case 'web':
                default: {
                    // ИСПРАВЛЕНО: корректная работа с fileName
                    const saved = localStorage.getItem(`mock_file_${fileName}`);
                    const settings = saved ? JSON.parse(saved) : {};
                    settings[key] = value;
                    localStorage.setItem(`mock_file_${fileName}`, JSON.stringify(settings));
                    return true;
                }
            }
        }

        /**
         * Сохранение настроек в файл settings.json
         */
        async saveSettings(settings, fileName = 'settings.json') {
            const jsonString = typeof settings === 'string' ? settings : JSON.stringify(settings);

            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('writeFile', fileName, jsonString);
                case 'tauri':
                    try {
                        if (window.__TAURI__ && window.__TAURI__.fs) {
                            await window.__TAURI__.fs.writeTextFile(fileName, jsonString);
                            return true;
                        }
                        return false;
                    } catch (e) {
                        console.error('[Bridge Tauri] Error saving settings:', e);
                        return false;
                    }
                case 'web':
                default:
                    // ИСПРАВЛЕНО: корректная работа с fileName
                    localStorage.setItem(`mock_file_${fileName}`, jsonString);
                    return true;
            }
        }

        async listFiles() {
            switch (this.env) {
                case 'android': {
                    const res = await this.callAndroidNative('listFiles');
                    try {
                        return typeof res === 'string' ? JSON.parse(res) : (res || []);
                    } catch (e) {
                        return [];
                    }
                }
                case 'tauri':
                    console.warn('[Bridge Tauri Stub] listFiles called');
                    return [];
                case 'web':
                default:
                    return Object.keys(localStorage)
                        .filter(k => k.startsWith('mock_file_'))
                        .map(k => k.replace('mock_file_', ''));
            }
        }
    }

    // Регистрируем экземпляр в глобальном окне
    window.bridge = new CrossPlatformBridge();
})();