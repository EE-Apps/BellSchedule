(function () {
    /**
     * CrossPlatformBridge - единая система доступа к нативным функциям
     * 
     * Поддерживает платформы:
     * - Android: использует window.AndroidBridge для вызовов Kotlin-кода
     * - Tauri: использует window.__TAURI__ для доступа к файловой системе
     * - Web: использует localStorage как эмуляцию файловой системы
     * 
     * Синхронизация настроек:
     * Методы getSettings() и saveSettings() поддерживают синхронизацию
     * с SettingsManager для хранения настроек в файлах приложения.
     */
    class CrossPlatformBridge {
        constructor() {
            this.env = this.detectEnvironment();
            console.log(`[Bridge] Initialized in environment: ${this.env}`);
        }

        /**
         * Определение среды исполнения
         */
        detectEnvironment() {
            if (typeof window.AndroidBridge !== 'undefined') {
                return 'android';
            }
            if (typeof window.__TAURI__ !== 'undefined' || typeof window.__TAURI_IPC__ !== 'undefined') {
                return 'tauri';
            }
            return 'web';
        }

        /**
         * Вспомогательный метод для вызова нативного Kotlin-кода через динамический callback
         */
        callAndroidNative(methodName, ...args) {
            return new Promise((resolve) => {
                // Генерируем уникальное имя функции-колбэка для Android
                const callbackId = `cb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                // Регистрируем временную глобальную функцию
                window[callbackId] = (data) => {
                    delete window[callbackId]; // Удаляем после вызова, чтобы не засорять память
                    resolve(data);
                };

                try {
                    // Вызываем метод AndroidBridge, переданный из Kotlin
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

        /**
         * Чтение файла
         * @param {string} fileName 
         * @returns {Promise<string>}
         */
        async readFile(fileName) {
            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('readFile', fileName);

                case 'tauri':
                    // TODO: Реализация для Tauri
                    // Пример: return await window.__TAURI__.fs.readTextFile(fileName);
                    console.warn('[Bridge Tauri Stub] readFile called:', fileName);
                    return '';

                case 'web':
                default:
                    console.warn('[Bridge Web Mock] readFile called:', fileName);
                    return localStorage.getItem(`mock_file_${fileName}`) || '';
            }
        }

        /**
         * Запись файла
         * @param {string} fileName 
         * @param {string} content 
         * @returns {Promise<boolean>}
         */
        async writeFile(fileName, content) {
            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('writeFile', fileName, content);

                case 'tauri':
                    // TODO: Реализация для Tauri
                    // Пример: await window.__TAURI__.fs.writeTextFile(fileName, content);
                    console.warn('[Bridge Tauri Stub] writeFile called:', fileName, content);
                    return true;

                case 'web':
                default:
                    console.warn('[Bridge Web Mock] writeFile called:', fileName);
                    localStorage.setItem(`mock_file_${fileName}`, content);
                    return true;
            }
        }

        /**
         * Чтение настроек (возвращает объект)
         * @param {string} fileName - имя файла настроек (по умолчанию settings.json)
         * @returns {Promise<Object>}
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
                        // TODO: Реализация для Tauri
                        // Пример: const content = await window.__TAURI__.fs.readTextFile(fileName);
                        // return JSON.parse(content);
                        console.warn('[Bridge Tauri Stub] getSettings called:', fileName);
                        return {};
                    } catch (e) {
                        console.error('[Bridge Tauri] Error reading settings:', e);
                        return {};
                    }
                }

                case 'web':
                default: {
                    console.warn('[Bridge Web Mock] getSettings called');
                    const saved = localStorage.getItem('mock_settings');
                    return saved ? JSON.parse(saved) : {};
                }
            }
        }

        /**
         * Обновление конкретного параметра в settings.json
         * @param {string} key Имя ключа/параметра
         * @param {any} value Значение (строка, число, boolean или объект)
         * @param {string} fileName - имя файла настроек (по умолчанию settings.json)
         * @returns {Promise<boolean>}
         */
        async updateSetting(key, value, fileName = 'settings.json') {
            const valString = typeof value === 'object' ? JSON.stringify(value) : String(value);

            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('updateSetting', key, valString, fileName);

                case 'tauri':
                    try {
                        // TODO: Реализация для Tauri
                        // Пример: получить файл, обновить ключ, сохранить
                        console.warn('[Bridge Tauri Stub] updateSetting called:', key, value, fileName);
                        return true;
                    } catch (e) {
                        console.error('[Bridge Tauri] Error updating setting:', e);
                        return false;
                    }

                case 'web':
                default: {
                    console.warn('[Bridge Web Mock] updateSetting called:', key, value);
                    const saved = localStorage.getItem('mock_settings');
                    const settings = saved ? JSON.parse(saved) : {};
                    settings[key] = value;
                    localStorage.setItem('mock_settings', JSON.stringify(settings));
                    return true;
                }
            }
        }

        /**
         * Сохранение настроек
         * @param {Object|string} settings 
         * @param {string} fileName - имя файла настроек (по умолчанию settings.json)
         * @returns {Promise<boolean>}
         */
        async saveSettings(settings, fileName = 'settings.json') {
            const jsonString = typeof settings === 'string' ? settings : JSON.stringify(settings);

            switch (this.env) {
                case 'android':
                    return await this.callAndroidNative('writeFile', fileName, jsonString);

                case 'tauri':
                    try {
                        // TODO: Реализация для Tauri
                        // Пример: await window.__TAURI__.fs.writeTextFile(fileName, jsonString);
                        console.warn('[Bridge Tauri Stub] saveSettings called:', fileName, jsonString);
                        return true;
                    } catch (e) {
                        console.error('[Bridge Tauri] Error saving settings:', e);
                        return false;
                    }

                case 'web':
                default:
                    console.warn('[Bridge Web Mock] saveSettings called:', jsonString);
                    localStorage.setItem('mock_settings', jsonString);
                    return true;
            }
        }

        /**
         * Получение списка файлов
         * @returns {Promise<Array<string>>}
         */
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
                    console.warn('[Bridge Web Mock] listFiles called');
                    return Object.keys(localStorage)
                        .filter(k => k.startsWith('mock_file_'))
                        .map(k => k.replace('mock_file_', ''));
            }
        }
    }

    // Регистрируем экземпляр в глобальном окне
    window.bridge = new CrossPlatformBridge();
})();