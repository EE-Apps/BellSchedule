/**
 * SettingsManager - управление настройками приложения с синхронизацией
 * 
 * Синхронизирует настройки между:
 * - localStorage (web и везде)
 * - Файлами приложения Android/Tauri (через bridge)
 * 
 * Алгоритм загрузки:
 * 1. init() вызывает loadSync() - синхронная загрузка из localStorage
 * 2. Параллельно запускается loadFromBridge() - асинхронная загрузка из файла
 * 3. Если файл загружен - настройки обновляются и вызывается onChange
 * 
 * Сохранение:
 * - Всегда сохраняет в localStorage (для web и как кэш)
 * - На Android/Tauri дополнительно сохраняет в файл
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

        this.init(window.eelib.settingsConfig)
    }

    // Инициализация настроек
    init({ storageKey, defaultSettings, schema, onChange = null, settingsFileName = 'settings.json' }) {
        this.storageKey = storageKey;
        this.defaultSettings = defaultSettings;
        this.schema = schema;
        this.onChange = onChange;
        this.settingsFileName = settingsFileName;
        
        // Синхронная загрузка из localStorage
        this.loadSync();
        
        // Асинхронная загрузка из файла (если доступен bridge)
        if (this.bridge && this.bridge.env !== 'web') {
            this.loadFromBridge();
        }
        
        return this;
    }

    // Синхронная загрузка из localStorage и дефолтных настроек
    loadSync() {
        try {
            let loaded = null;
            
            // Пытаемся из localStorage
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

            // Если загрузили - мержим с дефолтными, иначе берём дефолтные
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

    // Асинхронная загрузка из файла (Android/Tauri)
    async loadFromBridge() {
        try {
            const loaded = await this.bridge.getSettings(this.settingsFileName);
            if (loaded && typeof loaded === 'object') {
                // Обновляем существующие настройки
                this.settings = this.deepMerge(this.settings, loaded);
                window.settings = this.settings;
                console.log(`[SettingsManager] Merged settings from ${this.bridge.env}:`, loaded);
                
                // Вызываем callback если есть
                if (this.onChange) {
                    this.onChange(this.settings);
                }
            }
        } catch (e) {
            console.warn(`[SettingsManager] Failed to load from ${this.bridge.env}:`, e);
        }
    }

    // Загрузка настроек (из файла на Android/Tauri или из localStorage на web)
    // Оставлена для обратной совместимости
    async load() {
        // Сначала загружаем синхронно
        this.loadSync();
        
        // Потом загружаем из bridge если доступен
        if (this.bridge && this.bridge.env !== 'web') {
            await this.loadFromBridge();
        }
    }

    // Сохранение настроек (в файл на Android/Tauri и в localStorage)
    async save() {
        if (this.isSyncing) return; // Предотвращаем рекурсию
        
        try {
            this.isSyncing = true;

            // Сохраняем в localStorage (всегда)
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
                console.log('[SettingsManager] Saved to localStorage');
            } catch (e) {
                console.error('[SettingsManager] Error saving to localStorage:', e);
            }

            // Сохраняем в файл если доступен bridge и не web
            if (this.bridge && this.bridge.env !== 'web') {
                try {
                    const result = await this.bridge.saveSettings(this.settings);
                    console.log(`[SettingsManager] Saved to ${this.bridge.env}:`, result);
                } catch (e) {
                    console.warn(`[SettingsManager] Failed to save to ${this.bridge.env}:`, e);
                }
            }

            // Вызываем callback
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
        
        // Создаём промежуточные объекты если их нет
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
        const keys = path.split('.')
        const lastKey = keys.pop()
        let target = this.settings

        // Идем до предпоследнего объекта
        for (const key of keys) {
            if (!target || typeof target !== 'object') {
                return false
            }
            target = target[key]
        }

        if (target && Object.prototype.hasOwnProperty.call(target, lastKey)) {
            delete target[lastKey]
            this.save()
            return true;
        }

        return false
    }

    // Генерация UI настроек
    generateUI(containerId) {
        const container = document.createElement('div')
        container.className = 'pageContent'
        document.getElementById(containerId).querySelector(".pageContainer").appendChild(container)
        if (!container) return;

        Object.entries(this.schema).forEach(([sectionKey, section]) => {
            const sectionEl = document.createElement("div");
            sectionEl.className = "settings-section";

            sectionEl.innerHTML = `
                <div class="settings-header hideSettSection" data-section="sett-${sectionKey}">
                    <h2>${section.title}</h2>
                    <img src="img/ui/arrow/up.svg" style="rotate: 90deg;">
                </div>
                <div id="sett-${sectionKey}" class="settingsSectionDiv" style="height: 0px;"></div>
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

            section.items.forEach(item => {
                body.appendChild(this.createSettingItem(sectionKey, item));
            });

            container.appendChild(sectionEl);
        });
    }

    // Создание элемента настройки
    createSettingItem(sectionKey, item) {
        const value = this.settings[sectionKey][item.key];
        const block = document.createElement("div");
        block.className = "settingsBlock";

        if (item.type === "toggle") {
            block.innerHTML = `
                <label>${item.label}:</label>
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
                .map(([v, l]) =>
                    `<option value="${v}" ${v === value ? "selected" : ""}>${l}</option>`
                ).join("");

            block.innerHTML = `
                <label>${item.label}:</label>
                <select class="settings-select">${options}</select>
            `;

            block.querySelector("select").addEventListener("change", e => {
                this.set(`${sectionKey}.${item.key}`, e.target.value);
            });
        }

        if (item.type === "text") {
            const placeholder = item.placeholder || "";
            block.innerHTML = `
                <label>${item.label}:</label>
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
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(result[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    // Сброс к дефолтным настройкам
    reset() {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        this.save();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.settingsManager = new SettingsManager();
});