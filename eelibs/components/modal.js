class ModalMgr {
    constructor() {
        this.activeModals = new Map();
        this.handleEscape = (e) => {
            if (e.key === 'Escape') {
                const lastModalId = Array.from(this.activeModals.keys()).pop();
                if (lastModalId) this.closeModal(lastModalId, true);
            }
        };
        document.addEventListener('keydown', this.handleEscape);
    }

    createModalConfirm(id, title, message, buttons = []) {
        if (this.activeModals.has(id)) {
            this.closeModal(id, true);
        }

        if (buttons.length === 0) {
            buttons = [
                { label: 'Cancel', value: 'cancel', className: 'sec' },
                { label: 'OK', value: 'ok', className: '' }
            ];
        }

        const modalBg = document.getElementById('modal') || document.createElement('div');
        modalBg.innerHTML = '';
        modalBg.id = 'modal';
        modalBg.className = 'modal active';
        
        const modalDiv = document.getElementById('modalForuse') || document.createElement('div');
        modalDiv.innerHTML = '';
        modalDiv.id = 'modalForuse';
        modalDiv.className = 'dialog confirm';
        
        const buttonsHtml = buttons.map(btn => 
            `<button type="button" class="aBtn ${btn.className || ''}" data-value="${btn.value}">${btn.label}</button>`
        ).join('');

        modalDiv.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    ${buttonsHtml}
                </div>
            </div>
        `;
        
        document.getElementById('content')?.classList.add('modal-open');
        modalBg.appendChild(modalDiv);
        if (!modalBg.parentNode) document.body.appendChild(modalBg);
        
        setTimeout(() => {
            this.setupConfirmEvents(id, modalDiv, modalBg, buttons);
        }, 0);
        
        return new Promise((resolve) => {
            this.activeModals.set(id, { 
                resolve, 
                modalBg,
                removeGlobalClickListener: null
            });
        });
    }

    createModalInput(id, labelText, type = 'text', placeholder = '', options = {}) {
        if (this.activeModals.has(id)) {
            this.closeModal(id, true);
        }

        const modalBg = document.getElementById('modal') || document.createElement('div');
        modalBg.innerHTML = '';
        modalBg.id = 'modal';
        modalBg.className = 'modal active';
        
        const modalDiv = document.getElementById('modalForuse') || document.createElement('div');
        modalDiv.innerHTML = '';
        modalDiv.id = 'modalForuse';
        modalDiv.className = 'dialog input';
        
        let content = '';
        let additionalScripts = '';

        switch(type) {
            case 'text':
            case 'number':
            case 'password':
            case 'email':
            case 'url':
            case 'tel':
            case 'search':
                content = `<input type="${type}" id="${id}" name="${id}" placeholder="${placeholder}" class="modal-input" value="${options.value || ''}" ${options.required ? 'required' : ''} ${options.pattern ? `pattern="${options.pattern}"` : ''}>`;
                break;
                
            case 'textarea':
                content = `<textarea id="${id}" name="${id}" placeholder="${placeholder}" class="modal-textarea" rows="${options.rows || 4}" ${options.required ? 'required' : ''}>${options.value || ''}</textarea>`;
                break;
                
            case 'date':
                content = this.createCustomDatePicker(id, options.value);
                additionalScripts = 'initDatePicker';
                break;
                
            case 'time':
                content = this.createCustomTimePicker(id, options.value);
                additionalScripts = 'initTimePicker';
                break;
                
            case 'datetime-local':
                content = this.createCustomDateTimePicker(id, options.value);
                additionalScripts = 'initDateTimePicker';
                break;
                
            case 'color':
                content = this.createCustomColorPicker(id, options.value || '#000000');
                additionalScripts = 'initColorPicker';
                break;
                
            case 'checkbox':
                content = `<div class="checkbox-container">
                    <input type="checkbox" id="${id}" name="${id}" class="modal-checkbox" ${options.value ? 'checked' : ''} ${options.required ? 'required' : ''}>
                    <label for="${id}" class="checkbox-label">${options.checkboxLabel || 'Enable'}</label>
                </div>`;
                break;

            case 'radio':
                content = `<div class="radio-container" id="${id}-container">
                    ${(options.radioOptions || []).map(opt => `
                        <label class="radio-label">
                            <input type="radio" name="${id}" value="${opt.value}" class="modal-radio" ${opt.value === options.value ? 'checked' : ''}>
                            <span>${opt.label}</span>
                        </label>
                    `).join('')}
                </div>`;
                break;
                
            case 'select':
                content = this.createCustomSelect(id, options.selectOptions || [], options.value);
                additionalScripts = 'initCustomSelect';
                break;

            case 'multiselect':
                content = this.createCustomMultiSelect(id, options.selectOptions || [], options.value || []);
                additionalScripts = 'initCustomMultiSelect';
                break;
                
            case 'range':
                content = this.createCustomRange(id, options);
                additionalScripts = 'initCustomRange';
                break;
                
            case 'file':
                content = `<div class="file-input-container">
                    <input type="file" id="${id}" name="${id}" class="modal-file-input" ${options.multiple ? 'multiple' : ''} ${options.accept ? `accept="${options.accept}"` : ''}>
                    <label for="${id}" class="file-input-label">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                        </svg>
                        <span class="file-text" id="${id}-file-text">${options.value || 'Choose file...'}</span>
                    </label>
                </div>`;
                additionalScripts = 'initFileInput';
                break;
                
            default:
                content = `<input type="text" id="${id}" name="${id}" placeholder="${placeholder}" class="modal-input">`;
        }

        modalDiv.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">${labelText}</h3>
                </div>
                <div class="modal-body">
                    ${content}
                    ${options.hint ? `<small class="modal-hint">${options.hint}</small>` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" id="cancel-modal" class="btn-secondary">Cancel</button>
                    <button type="button" id="submit-modal" class="btn-primary">OK</button>
                </div>
            </div>
        `;
        
        document.getElementById('content')?.classList.add('modal-open');
        modalBg.appendChild(modalDiv);
        if (!modalBg.parentNode) document.body.appendChild(modalBg);
        
        setTimeout(() => {
            if (additionalScripts === 'initDatePicker') this.initDatePicker(id);
            else if (additionalScripts === 'initTimePicker') this.initTimePicker(id);
            else if (additionalScripts === 'initDateTimePicker') this.initDateTimePicker(id);
            else if (additionalScripts === 'initColorPicker') this.initColorPicker(id, options.value || '#000000');
            else if (additionalScripts === 'initCustomSelect') this.initCustomSelect(id);
            else if (additionalScripts === 'initCustomMultiSelect') this.initCustomMultiSelect(id);
            else if (additionalScripts === 'initCustomRange') this.initCustomRange(id);
            else if (additionalScripts === 'initFileInput') this.initFileInput(id);
            
            this.setupModalEvents(id, type, modalBg, options);
        }, 0);
        
        return new Promise((resolve) => {
            this.activeModals.set(id, { 
                resolve, 
                modalBg,
                removeGlobalClickListener: null
            });
        });
    }

    createCustomDatePicker(id, value = '') {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        return `
            <div class="date-picker-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${value}">
                <div class="date-display" id="${id}-display">
                    <span class="date-value">${value || 'Select date'}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="date-picker-dropdown" id="${id}-dropdown" style="display: none;">
                    <div class="date-picker-header">
                        <button type="button" class="date-nav" data-action="prev-year">‹‹</button>
                        <button type="button" class="date-nav" data-action="prev-month">‹</button>
                        <span class="date-current" id="${id}-current">${this.getMonthName(month)} ${year}</span>
                        <button type="button" class="date-nav" data-action="next-month">›</button>
                        <button type="button" class="date-nav" data-action="next-year">››</button>
                    </div>
                    <div class="date-picker-weekdays">
                        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                    </div>
                    <div class="date-picker-days" id="${id}-days"></div>
                </div>
            </div>
        `;
    }

    createCustomTimePicker(id, value = '') {
        const [initialH, initialM] = value ? value.split(':') : [12, 0];
        return `
            <div class="time-picker-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${value}">
                <div class="time-display" id="${id}-display">
                    <span class="time-value">${value || 'Select time'}</span>
                </div>
                <div class="time-picker-dropdown" id="${id}-dropdown" style="display: none;">
                    <div class="time-picker-wheels">
                        <div class="time-wheel" id="${id}-hours">
                            ${this.generateTimeOptions(0, 23, initialH)}
                        </div>
                        <div class="time-separator">:</div>
                        <div class="time-wheel" id="${id}-minutes">
                            ${this.generateTimeOptions(0, 59, initialM)}
                        </div>
                    </div>
                </div>
                <div class="time-picker-black"></div>
            </div>
        `;
    }

    createCustomDateTimePicker(id, value = '') {
        return `
            <div class="datetime-picker-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${value}">
                <div class="datetime-display" id="${id}-display">
                    <span class="datetime-value">${value || 'Select date & time'}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                </div>
                <div class="datetime-picker-tabs" id="${id}-tabs" style="display: none;">
                    <button type="button" class="datetime-tab active" data-tab="date">Date</button>
                    <button type="button" class="datetime-tab" data-tab="time">Time</button>
                </div>
                <div class="datetime-picker-content" id="${id}-content" style="display: none;">
                    <div class="tab-pane active" data-pane="date">
                        ${this.createCustomDatePicker(id + '-date', value ? value.split('T')[0] : '').replace(id, id + '-date')}
                    </div>
                    <div class="tab-pane" data-pane="time">
                        ${this.createCustomTimePicker(id + '-time', value ? value.split('T')[1] : '').replace(id, id + '-time')}
                    </div>
                </div>
            </div>
        `;
    }

    createCustomColorPicker(id, defaultColor) {
        const presetColors = [
            '#FF0000', '#FF6B00', '#FFD600', '#00FF00', '#00FFFF', '#0066FF', '#9900FF', '#FF00FF',
            '#800000', '#804000', '#808000', '#008000', '#008080', '#000080', '#4B0082', '#800080',
            '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#C9C9FF', '#E0BBE4', '#FFC9DE',
            '#000000', '#404040', '#808080', '#BFBFBF', '#FFFFFF'
        ];
        
        return `
            <div class="color-picker-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${defaultColor}">
                <div class="color-display" id="${id}-display">
                    <div class="color-preview" style="background-color: ${defaultColor};"></div>
                    <span class="color-value">${defaultColor}</span>
                </div>
                <div class="color-picker-dropdown" id="${id}-dropdown" style="display: none;">
                    <div class="color-preset-grid">
                        ${presetColors.map(color => `
                            <div class="color-preset-item" data-color="${color}" style="background-color: ${color};">
                                ${color.toUpperCase() === defaultColor.toUpperCase() ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div class="color-custom-section">
                        <label class="color-custom-label">Custom color</label>
                        <div class="color-input-group">
                            <input type="color" id="${id}-native" value="${defaultColor}" class="color-native-input">
                            <input type="text" id="${id}-hex" value="${defaultColor}" class="color-hex-input" pattern="^#[0-9A-Fa-f]{6}$" maxlength="7">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createCustomSelect(id, options, value = '') {
        const selectedOpt = options.find(opt => (opt.value || opt) === value);
        return `
            <div class="custom-select-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${value}">
                <div class="custom-select-display" id="${id}-display">
                    <span class="select-value">${selectedOpt ? (selectedOpt.label || selectedOpt.value || selectedOpt) : 'Select an option'}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="custom-select-dropdown" id="${id}-dropdown" style="display: none;">
                    ${options.map((opt, idx) => {
                        const val = opt.value || opt;
                        const label = opt.label || opt;
                        const isSelected = val === value ? 'selected' : '';
                        return `<div class="select-option ${isSelected}" data-value="${val}" data-index="${idx}">${label}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    createCustomMultiSelect(id, options, values = []) {
        return `
            <div class="custom-select-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${JSON.stringify(values)}">
                <div class="custom-select-display" id="${id}-display">
                    <span class="select-value">${values.length > 0 ? `${values.length} selected` : 'Select options'}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
                <div class="custom-select-dropdown" id="${id}-dropdown" style="display: none;">
                    ${options.map((opt, idx) => {
                        const val = opt.value || opt;
                        const label = opt.label || opt;
                        const isChecked = values.includes(val) ? 'checked' : '';
                        return `
                            <label class="select-option">
                                <input type="checkbox" class="multiselect-checkbox" data-value="${val}" ${isChecked}>
                                <span>${label}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    createCustomRange(id, options = {}) {
        const min = options.min || 0;
        const max = options.max || 100;
        const step = options.step || 1;
        const value = options.value !== undefined ? options.value : min;
        
        return `
            <div class="range-container" id="${id}-container">
                <input type="hidden" id="${id}" name="${id}" value="${value}">
                <div class="range-display">
                    <span class="range-label">${options.label || 'Value'}</span>
                    <span class="range-value" id="${id}-value">${value}</span>
                </div>
                <div class="range-slider-wrapper">
                    <input type="range" id="${id}-slider" min="${min}" max="${max}" step="${step}" value="${value}" class="range-slider">
                    <div class="range-track">
                        <div class="range-progress" id="${id}-progress" style="width: ${((value - min) / (max - min)) * 100}%"></div>
                    </div>
                </div>
                <div class="range-minmax">
                    <span>${min}</span>
                    <span>${max}</span>
                </div>
            </div>
        `;
    }

    getMonthName(month) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month];
    }

    generateTimeOptions(start, end, selectedValue = null) {
        let html = '';
        for (let i = start; i <= end; i++) {
            const value = i.toString().padStart(2, '0');
            const isSelected = value === selectedValue ? 'selected' : '';
            html += `<div class="time-option ${isSelected}" data-value="${value}">${value}</div>`;
        }
        return html;
    }

    formatDate(date) {
        if (!date) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    initDatePicker(id) {
        const container = document.getElementById(`${id}-container`);
        if (!container) return;
        const display = document.getElementById(`${id}-display`);
        const dropdown = document.getElementById(`${id}-dropdown`);
        const input = document.getElementById(id);
        
        let currentDate = input.value ? new Date(input.value) : new Date();
        let selectedDate = input.value ? new Date(input.value) : null;
        
        const renderCalendar = () => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const currentEl = document.getElementById(`${id}-current`);
            if (currentEl) currentEl.textContent = `${this.getMonthName(month)} ${year}`;
            
            const daysContainer = document.getElementById(`${id}-days`);
            if (!daysContainer) return;
            daysContainer.innerHTML = '';
            
            for (let i = 0; i < firstDay; i++) {
                daysContainer.innerHTML += '<div class="date-day empty"></div>';
            }
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                
                daysContainer.innerHTML += `
                    <div class="date-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" 
                         data-date="${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}">
                        ${day}
                    </div>
                `;
            }
            
            daysContainer.querySelectorAll('.date-day:not(.empty)').forEach(dayEl => {
                dayEl.addEventListener('click', () => {
                    const dateStr = dayEl.dataset.date;
                    selectedDate = new Date(dateStr);
                    input.value = dateStr;
                    const displayValue = display.querySelector('.date-value');
                    if (displayValue) displayValue.textContent = this.formatDate(selectedDate);
                    dropdown.style.display = 'none';
                });
            });
        };
        
        display.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            if (dropdown.style.display === 'block') renderCalendar();
        });
        
        dropdown.querySelectorAll('.date-nav').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'prev-month') currentDate.setMonth(currentDate.getMonth() - 1);
                else if (action === 'next-month') currentDate.setMonth(currentDate.getMonth() + 1);
                else if (action === 'prev-year') currentDate.setFullYear(currentDate.getFullYear() - 1);
                else if (action === 'next-year') currentDate.setFullYear(currentDate.getFullYear() + 1);
                renderCalendar();
            });
        });
        
        renderCalendar();
    }

    initTimePicker(id) {
        const display = document.getElementById(`${id}-display`);
        const dropdown = document.getElementById(`${id}-dropdown`);
        const input = document.getElementById(id);
        const hoursWheel = document.getElementById(`${id}-hours`);
        const minutesWheel = document.getElementById(`${id}-minutes`);
        
        if (!display || !dropdown) return;

        let selectedHour = 12;
        let selectedMinute = 0;
        
        if (input.value) {
            const parts = input.value.split(':');
            selectedHour = parseInt(parts[0]) || 12;
            selectedMinute = parseInt(parts[1]) || 0;
        }
        
        const updateTime = () => {
            const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
            input.value = timeStr;
            const displayValue = display.querySelector('.time-value');
            if (displayValue) displayValue.textContent = timeStr;
        };
        
        display.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        hoursWheel.querySelectorAll('.time-option').forEach(opt => {
            opt.addEventListener('click', () => {
                hoursWheel.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                selectedHour = parseInt(opt.dataset.value);
                updateTime();
            });
        });
        
        minutesWheel.querySelectorAll('.time-option').forEach(opt => {
            opt.addEventListener('click', () => {
                minutesWheel.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                selectedMinute = parseInt(opt.dataset.value);
                updateTime();
            });
        });

        updateTime();
    }

    initDateTimePicker(id) {
        const tabs = document.getElementById(`${id}-tabs`);
        const content = document.getElementById(`${id}-content`);
        const display = document.getElementById(`${id}-display`);
        const input = document.getElementById(id);
        
        if (!display || !tabs || !content) return;
        
        display.addEventListener('click', () => {
            const isVisible = tabs.style.display !== 'none';
            tabs.style.display = isVisible ? 'none' : 'flex';
            content.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.initDatePicker(`${id}-date`);
                this.initTimePicker(`${id}-time`);
            }
        });
        
        tabs.querySelectorAll('.datetime-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                tabs.querySelectorAll('.datetime-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                content.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.dataset.pane === tabName);
                });
            });
        });

        setTimeout(() => {
            const dateInput = document.getElementById(`${id}-date`);
            const timeInput = document.getElementById(`${id}-time`);
            const updateMainValue = () => {
                if (dateInput && timeInput && dateInput.value && timeInput.value) {
                    input.value = `${dateInput.value}T${timeInput.value}`;
                    const displayValue = display.querySelector('.datetime-value');
                    if (displayValue) displayValue.textContent = input.value.replace('T', ' ');
                }
            };
            if (dateInput) dateInput.addEventListener('change', updateMainValue);
            if (timeInput) timeInput.addEventListener('change', updateMainValue);
        }, 100);
    }

    initColorPicker(id, defaultColor) {
        const display = document.getElementById(`${id}-display`);
        const dropdown = document.getElementById(`${id}-dropdown`);
        const input = document.getElementById(id);
        const preview = display.querySelector('.color-preview');
        const valueSpan = display.querySelector('.color-value');
        const nativeInput = document.getElementById(`${id}-native`);
        const hexInput = document.getElementById(`${id}-hex`);
        
        if (!display || !dropdown) return;
        
        const updateColor = (color) => {
            input.value = color;
            preview.style.backgroundColor = color;
            valueSpan.textContent = color;
            nativeInput.value = color;
            hexInput.value = color;
            
            dropdown.querySelectorAll('.color-preset-item svg').forEach(svg => svg.remove());
            const selected = dropdown.querySelector(`[data-color="${color.toUpperCase()}"]`);
            if (selected) {
                selected.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            }
        };
        
        display.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        dropdown.querySelectorAll('.color-preset-item').forEach(item => {
            item.addEventListener('click', () => updateColor(item.dataset.color));
        });
        
        nativeInput.addEventListener('input', (e) => updateColor(e.target.value));
        
        hexInput.addEventListener('change', (e) => {
            const value = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                updateColor(value);
            }
        });
    }

    initCustomSelect(id) {
        const display = document.getElementById(`${id}-display`);
        const dropdown = document.getElementById(`${id}-dropdown`);
        const input = document.getElementById(id);
        const valueSpan = display.querySelector('.select-value');
        
        if (!display || !dropdown) return;
        
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        dropdown.querySelectorAll('.select-option').forEach(option => {
            option.addEventListener('click', () => {
                dropdown.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                input.value = option.dataset.value;
                valueSpan.textContent = option.textContent.trim();
                dropdown.style.display = 'none';
            });
        });
    }

    initCustomMultiSelect(id) {
        const display = document.getElementById(`${id}-display`);
        const dropdown = document.getElementById(`${id}-dropdown`);
        const input = document.getElementById(id);
        const valueSpan = display.querySelector('.select-value');
        
        if (!display || !dropdown) return;
        
        const updateValue = () => {
            const checked = dropdown.querySelectorAll('.multiselect-checkbox:checked');
            const values = Array.from(checked).map(cb => cb.dataset.value);
            input.value = JSON.stringify(values);
            valueSpan.textContent = values.length > 0 ? `${values.length} selected` : 'Select options';
        };
        
        display.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        
        dropdown.querySelectorAll('.multiselect-checkbox').forEach(cb => {
            cb.addEventListener('change', updateValue);
        });
    }

    initCustomRange(id) {
        const slider = document.getElementById(`${id}-slider`);
        const valueSpan = document.getElementById(`${id}-value`);
        const input = document.getElementById(id);
        
        if (!slider) return;
        
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            input.value = value;
            if (valueSpan) valueSpan.textContent = value;
        });
    }

    initFileInput(id) {
        const fileInput = document.getElementById(id);
        const fileText = document.getElementById(`${id}-file-text`);
        
        if (!fileInput || !fileText) return;
        
        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                fileText.textContent = files.length === 1 ? files[0].name : `${files.length} files selected`;
            } else {
                fileText.textContent = 'Choose file...';
            }
        });
    }

    setupConfirmEvents(id, modalDiv, modalBg, buttons) {
        const actionBtns = modalDiv.querySelectorAll('[data-value]');
        
        const closeModalHandler = (value = null, cancelled = true) => {
            this.closeModal(id, cancelled, value);
        };

        modalBg.addEventListener('click', (e) => {
            if (e.target === modalBg) closeModalHandler(null, true);
        });
        
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                const isCancel = buttons.find(b => b.value === value)?.className?.includes('secondary') || value === 'cancel';
                closeModalHandler(value, isCancel);
            });
        });

        this.activeModals.get(id).removeGlobalClickListener = () => {};
    }

    setupModalEvents(id, type, modalBg, options) {
        const cancelBtn = document.getElementById('cancel-modal');
        const submitBtn = document.getElementById('submit-modal');
        
        const closeModalHandler = (cancelled = true, value = null) => {
            this.closeModal(id, cancelled, value);
        };

        const closeDropdowns = (e) => {
            if (!e.target.closest('.date-picker-container') && 
                !e.target.closest('.time-picker-container') &&
                !e.target.closest('.datetime-picker-container') &&
                !e.target.closest('.color-picker-container') &&
                !e.target.closest('.custom-select-container')) {
                document.querySelectorAll('[id$="-dropdown"]').forEach(dd => dd.style.display = 'none');
                document.querySelectorAll('[id$="-tabs"]').forEach(tab => tab.style.display = 'none');
                document.querySelectorAll('[id$="-content"]').forEach(content => content.style.display = 'none');
            }
        };
        document.addEventListener('click', closeDropdowns);
        
        if (cancelBtn) cancelBtn.addEventListener('click', () => closeModalHandler(true));
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                let value = null;
                let isValid = true;

                if (type === 'checkbox') {
                    const el = document.getElementById(id);
                    value = el ? el.checked : false;
                } else if (type === 'radio') {
                    const el = document.querySelector(`input[name="${id}"]:checked`);
                    value = el ? el.value : null;
                    if (options.required && !value) isValid = false;
                } else if (type === 'multiselect') {
                    const el = document.getElementById(id);
                    value = el ? JSON.parse(el.value) : [];
                } else {
                    const el = document.getElementById(id);
                    if (el) {
                        if (options.required && !el.value) isValid = false;
                        if (options.pattern && el.value && !new RegExp(options.pattern).test(el.value)) isValid = false;
                        
                        if (el.checkValidity && !el.checkValidity()) {
                            isValid = false;
                            el.reportValidity();
                        }
                        value = el.value;
                    }
                }
                
                if (isValid) {
                    closeModalHandler(false, value);
                }
            });
        }

        modalBg.addEventListener('click', (e) => {
            if (e.target === modalBg) closeModalHandler(true);
        });

        this.activeModals.get(id).removeGlobalClickListener = () => {
            document.removeEventListener('click', closeDropdowns);
        };
    }

    closeModal(id, cancelled = false, value = null) {
        const modalData = this.activeModals.get(id);
        if (!modalData) return;
        
        const { resolve, modalBg, removeGlobalClickListener } = modalData;
        
        if (removeGlobalClickListener) removeGlobalClickListener();
        
        if (modalBg && modalBg.parentNode) {
            modalBg.parentNode.removeChild(modalBg);
        }
        
        document.getElementById('content')?.classList.remove('modal-open');
        
        if (cancelled) {
            resolve({ id, value: null, cancelled: true });
        } else {
            resolve({ id, value, cancelled: false });
        }
        
        this.activeModals.delete(id);
    }
}

window.modalMgr = new ModalMgr();