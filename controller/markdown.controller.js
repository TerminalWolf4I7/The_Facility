// Controller: Markdown Converter Event Handlers & View Bridge

class MarkdownController {
    constructor() {
        this.model = window.MarkdownModel;
        this.cacheElements();
        this.init();
    }

    cacheElements() {
        this.markdownInput = document.getElementById('markdownInput');
        this.previewArea = document.getElementById('previewArea');
        this.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.sunIcon = document.getElementById('sunIcon');
        this.moonIcon = document.getElementById('moonIcon');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Copy buttons
        this.btnCopyRich = document.getElementById('btnCopyRich');
        this.btnCopyHtml = document.getElementById('btnCopyHtml');
        this.btnCopyMarkdown = document.getElementById('btnCopyMarkdown');
        
        // Indicators & Stats
        this.autoSaveIndicator = document.getElementById('autoSaveIndicator');
        this.statChars = document.getElementById('statChars');
        this.statWords = document.getElementById('statWords');
        this.statParagraphs = document.getElementById('statParagraphs');
        this.statTables = document.getElementById('statTables');

        // Responsive Tabs
        this.tabEditBtn = document.getElementById('tabEditBtn');
        this.tabPreviewBtn = document.getElementById('tabPreviewBtn');
        this.editorPane = document.getElementById('editorPane');
        this.previewPane = document.getElementById('previewPane');

        // Table Generator
        this.tableMenuBtn = document.getElementById('tableMenuBtn');
        this.tableDropdown = document.getElementById('tableDropdown');
        this.tableGridContainer = document.getElementById('tableGridContainer');
        this.gridDimensionsLabel = document.getElementById('gridDimensionsLabel');

        // Table customizers
        this.colorThBg = document.getElementById('colorThBg');
        this.colorThText = document.getElementById('colorThText');
        this.colorBorder = document.getElementById('colorBorder');
        this.presetNeutral = document.getElementById('presetNeutral');
        this.presetPurple = document.getElementById('presetPurple');
        this.presetBlue = document.getElementById('presetBlue');
        this.presetGreen = document.getElementById('presetGreen');
        this.presetOrange = document.getElementById('presetOrange');
    }

    init() {
        if (!this.markdownInput || !this.previewArea) {
            console.error("Critical elements not found in DOM");
            return;
        }

        // 1. ตั้งค่า marked.js ในระบบ
        if (window.marked) {
            window.marked.use({
                gfm: true,
                breaks: true,
                headerIds: false,
                mangle: false
            });
        }

        // 2. จัดการ Event Listeners
        this.bindEvents();

        // 3. เริ่มระบบตาราง Grid Selector
        this.initTableDropdownGrid();

        // 4. ซิงค์ธีมดั้งเดิม
        this.syncThemeOnLoad();

        // 4.5. โหลดค่าปรับแต่งสีตาราง
        this.initTableCustomizers();

        // 5. โหลดข้อมูลเดิมที่บันทึกไว้ (ทำก่อน Animation)
        this.loadInitialContent();

        // 6. รันแอนิเมชันเปิดหน้า (ทำหลังสุดเมื่อทุกอย่างพร้อมแล้ว)
        this.runEntranceAnimations();
    }

    bindEvents() {
        // ประมวลผล Markdown แบบ Debounced
        const debouncedProcess = this.debounce(() => this.processAndRender(), 200);
        this.markdownInput.addEventListener('input', debouncedProcess);

        // จัดการคลิกปุ่มต่างๆ
        this.clearBtn.addEventListener('click', () => this.handleClear());
        this.btnCopyRich.addEventListener('click', () => this.handleCopyRich());
        this.btnCopyHtml.addEventListener('click', () => this.handleCopyHtml());
        this.btnCopyMarkdown.addEventListener('click', () => this.handleCopyMarkdown());

        // ปุ่มสลับธีม
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // ปุ่ม Responsive Tabs (มือถือ)
        if (this.tabEditBtn && this.tabPreviewBtn) {
            this.tabEditBtn.addEventListener('click', () => this.switchToTab('edit'));
            this.tabPreviewBtn.addEventListener('click', () => this.switchToTab('preview'));
        }

        // Dropdown ของตาราง
        if (this.tableMenuBtn && this.tableDropdown) {
            this.tableMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTableDropdown();
            });
            document.addEventListener('click', () => {
                this.tableDropdown.classList.add('hidden');
            });
            this.tableDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }

    // ประมวลผลแปลง Markdown และอัปเดตสถิติ
    processAndRender() {
        const text = this.markdownInput.value;
        
        // 1. แปลงด้วย Model
        const html = this.model.parseMarkdown(text);
        this.previewArea.innerHTML = html;

        // ตกแต่งตารางใน Preview
        this.applyCustomStylesToPreview();

        // 2. เรียก Highlight.js สำหรับ Code blocks
        if (window.hljs) {
            this.previewArea.querySelectorAll('pre code').forEach((block) => {
                window.hljs.highlightElement(block);
            });
        }

        // 3. คำนวณสถิติและอัปเดตวิว
        const stats = this.model.calculateStats(text, html);
        this.updateStatsView(stats);

        // 4. บันทึกข้อมูลอัตโนมัติ
        this.model.saveContent(text);

        // แสดงสถานะบันทึก
        if (this.autoSaveIndicator && window.gsap) {
            window.gsap.fromTo(this.autoSaveIndicator, { opacity: 0.4 }, { opacity: 1, duration: 0.3 });
        }
    }

    updateStatsView(stats) {
        this.statChars.textContent = stats.chars.toLocaleString();
        this.statWords.textContent = stats.words.toLocaleString();
        this.statParagraphs.textContent = stats.paragraphs.toLocaleString();
        this.statTables.textContent = stats.tablesCount.toLocaleString();

        // แอนิเมชันตอนค่าเปลี่ยน
        if (window.gsap) {
            window.gsap.fromTo(".stat-card div:last-child", 
                { scale: 1.1, opacity: 0.8 }, 
                { scale: 1, opacity: 1, duration: 0.3, stagger: 0.02 }
            );
        }
    }

    loadInitialContent() {
        const saved = this.model.loadSavedContent();
        if (saved) {
            this.markdownInput.value = saved;
        } else {
            // โหลดเทมเพลตเริ่มต้นกรณีไม่มีข้อมูลเซฟไว้
            this.markdownInput.value = `# ตารางข้อมูลตัวอย่าง

| สินค้า | ราคา (บาท) | จำนวน | สถานะ |
| :--- | :---: | :---: | :--- |
| สมุดโน้ตพรีเมียม | 250 | 5 | มีในสต็อก |
| ดินสอกร๊าฟไม้แท้ | 75 | 10 | มีในสต็อก |
| ปากกาหมึกซึมวินเทจ | 1,490 | 1 | สินค้าหมด |

> กดปุ่มสีม่วง **"คัดลอกตารางไป Google Docs"** แล้วนำไปวางใน Google Docs ได้ทันที!`;
        }
        this.processAndRender();
    }

    // ===== Clipboard Operations (Google Docs Table Export) =====
    async handleCopyRich() {
        this.processAndRender(); // ประมวลผลล่าสุด
        const rawText = this.markdownInput.value;
        const html = this.previewArea.innerHTML.trim();

        if (!html) {
            this.showToast('ไม่มีข้อความให้คัดลอก กรุณากรอกข้อความก่อน', 'error');
            return;
        }

        const thBg = this.colorThBg.value;
        const thText = this.colorThText.value;
        const border = this.colorBorder.value;

        // จัดสไตล์ Inline สำหรับ Google Docs ผ่าน Model
        const docsHtml = this.model.generateRichHtmlForClipboard(html, rawText, thBg, thText, border);

        try {
            const htmlBlob = new Blob([docsHtml], { type: 'text/html' });
            const textBlob = new Blob([rawText], { type: 'text/plain' });
            
            const data = [new ClipboardItem({
                'text/html': htmlBlob,
                'text/plain': textBlob
            })];

            await navigator.clipboard.write(data);
            
            if (window.gsap && this.btnCopyRich) {
                window.gsap.fromTo(this.btnCopyRich, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "elastic.out(1.2)" });
            }
            
            this.showToast('คัดลอกตาราง Rich Text เรียบร้อย! ไปกด Ctrl+V ใน Google Docs ได้ทันที');
        } catch (err) {
            console.error("Rich text copy failure:", err);
            this.showToast('ไม่สามารถคัดลอก Rich Text ได้ คัดลอกแบบโค้ดดิบแทน', 'info');
        }
    }

    handleCopyHtml() {
        this.processAndRender();
        const html = this.previewArea.innerHTML.trim();
        if (!html) {
            this.showToast('ไม่มีข้อมูลจะคัดลอก', 'error');
            return;
        }

        navigator.clipboard.writeText(html)
            .then(() => {
                if (window.gsap && this.btnCopyHtml) {
                    window.gsap.fromTo(this.btnCopyHtml, { scale: 0.95 }, { scale: 1, duration: 0.25 });
                }
                this.showToast('คัดลอกรหัส HTML โค้ดเรียบร้อยแล้ว');
            })
            .catch(() => this.showToast('ไม่สามารถคัดลอกได้', 'error'));
    }

    handleCopyMarkdown() {
        const text = this.markdownInput.value.trim();
        if (!text) {
            this.showToast('ไม่มีข้อความจะคัดลอก', 'error');
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                if (window.gsap && this.btnCopyMarkdown) {
                    window.gsap.fromTo(this.btnCopyMarkdown, { scale: 0.95 }, { scale: 1, duration: 0.25 });
                }
                this.showToast('คัดลอก Markdown ต้นฉบับเรียบร้อยแล้ว');
            })
            .catch(() => this.showToast('ไม่สามารถคัดลอกได้', 'error'));
    }

    handleClear() {
        if (!this.markdownInput.value.trim()) return;

        if (window.gsap) {
            window.gsap.to([this.markdownInput, this.previewArea], {
                opacity: 0.3,
                scale: 0.98,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                onComplete: () => {
                    this.markdownInput.value = '';
                    this.previewArea.innerHTML = '';
                    this.updateStatsView({ chars: 0, words: 0, paragraphs: 0, tablesCount: 0 });
                    this.model.clearSavedContent();
                    this.showToast('ล้างข้อมูลเรียบร้อยแล้ว', 'info');
                    this.markdownInput.focus();
                }
            });
        } else {
            this.markdownInput.value = '';
            this.previewArea.innerHTML = '';
            this.updateStatsView({ chars: 0, words: 0, paragraphs: 0, tablesCount: 0 });
            this.model.clearSavedContent();
            this.markdownInput.focus();
        }
    }

    // ===== UI Helpers & Dropdown logic =====
    toggleTableDropdown() {
        const isOpen = !this.tableDropdown.classList.contains('hidden');
        this.tableDropdown.classList.toggle('hidden', isOpen);
        
        if (!isOpen) {
            this.highlightTableDropdownCells(1, 1);
            if (window.gsap) {
                window.gsap.from(this.tableDropdown, { y: -8, opacity: 0, duration: 0.2, ease: "power2.out" });
            }
        }
    }

    initTableDropdownGrid() {
        if (!this.tableGridContainer) return;
        this.tableGridContainer.innerHTML = '';

        for (let r = 1; r <= 5; r++) {
            for (let c = 1; c <= 5; c++) {
                const cell = document.createElement('div');
                cell.className = 'w-6 h-6 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-300 rounded hover:bg-purple-300 dark:hover:bg-purple-800 transition cursor-pointer';
                cell.dataset.rows = r;
                cell.dataset.cols = c;

                cell.addEventListener('mouseenter', () => this.highlightTableDropdownCells(r, c));
                cell.addEventListener('click', () => {
                    this.insertTableTemplate(r, c);
                    this.tableDropdown.classList.add('hidden');
                });

                this.tableGridContainer.appendChild(cell);
            }
        }
    }

    initTableCustomizers() {
        // Load from localStorage or use defaults (Neutral theme)
        const savedThBg = localStorage.getItem('table-th-bg');
        const savedThText = localStorage.getItem('table-th-text');
        const savedBorder = localStorage.getItem('table-border');

        if (savedThBg) this.colorThBg.value = savedThBg;
        if (savedThText) this.colorThText.value = savedThText;
        if (savedBorder) this.colorBorder.value = savedBorder;

        // Listeners for manual pickers
        const handleColorInput = () => {
            this.applyCustomStylesToPreview();
        };

        const handleColorChange = () => {
            localStorage.setItem('table-th-bg', this.colorThBg.value);
            localStorage.setItem('table-th-text', this.colorThText.value);
            localStorage.setItem('table-border', this.colorBorder.value);
        };

        [this.colorThBg, this.colorThText, this.colorBorder].forEach(input => {
            if (input) {
                input.addEventListener('input', handleColorInput);
                input.addEventListener('change', handleColorChange);
            }
        });

        // Theme presets configuration
        const presets = {
            neutral: { bg: '#f1f5f9', text: '#1e293b', border: '#cbd5e1' },
            purple: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
            blue: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
            green: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
            orange: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' }
        };

        const applyPreset = (themeKey) => {
            const p = presets[themeKey];
            if (p) {
                this.colorThBg.value = p.bg;
                this.colorThText.value = p.text;
                this.colorBorder.value = p.border;
                handleColorChange();
                this.applyCustomStylesToPreview();
                
                // Active feedback animation if GSAP is loaded
                if (window.gsap) {
                    const btn = document.getElementById(`preset${themeKey.charAt(0).toUpperCase() + themeKey.slice(1)}`);
                    if (btn) {
                        window.gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.2 });
                    }
                }
            }
        };

        if (this.presetNeutral) this.presetNeutral.addEventListener('click', () => applyPreset('neutral'));
        if (this.presetPurple) this.presetPurple.addEventListener('click', () => applyPreset('purple'));
        if (this.presetBlue) this.presetBlue.addEventListener('click', () => applyPreset('blue'));
        if (this.presetGreen) this.presetGreen.addEventListener('click', () => applyPreset('green'));
        if (this.presetOrange) this.presetOrange.addEventListener('click', () => applyPreset('orange'));
    }

    applyCustomStylesToPreview() {
        if (!this.previewArea) return;

        const thBg = this.colorThBg.value;
        const thText = this.colorThText.value;
        const border = this.colorBorder.value;

        // Style the tables in the preview area
        this.previewArea.querySelectorAll('table').forEach(table => {
            table.style.border = `1px solid ${border}`;
            table.style.borderCollapse = 'collapse';
        });

        this.previewArea.querySelectorAll('th').forEach(th => {
            th.style.backgroundColor = thBg;
            th.style.color = thText;
            th.style.border = `1px solid ${border}`;
        });

        this.previewArea.querySelectorAll('td').forEach(td => {
            td.style.border = `1px solid ${border}`;
            td.style.borderColor = border;
        });
    }

    highlightTableDropdownCells(rows, cols) {
        this.gridDimensionsLabel.textContent = `${rows} แถว x ${cols} คอลัมน์`;
        const cells = this.tableGridContainer.querySelectorAll('div');
        
        cells.forEach(cell => {
            const r = parseInt(cell.dataset.rows);
            const c = parseInt(cell.dataset.cols);
            
            if (r <= rows && c <= cols) {
                cell.classList.remove('bg-slate-50', 'dark:bg-dark-300', 'border-slate-200');
                cell.classList.add('bg-purple-500', 'dark:bg-purple-600', 'border-purple-600');
            } else {
                cell.classList.add('bg-slate-50', 'dark:bg-dark-300', 'border-slate-200');
                cell.classList.remove('bg-purple-500', 'dark:bg-purple-600', 'border-purple-600');
            }
        });
    }

    insertTableTemplate(rows, cols) {
        const textarea = this.markdownInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        let tableStr = '\n';
        for (let c = 1; c <= cols; c++) tableStr += `| หัวตาราง ${c} `;
        tableStr += '|\n';

        for (let c = 1; c <= cols; c++) tableStr += '| :--- ';
        tableStr += '|\n';

        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) tableStr += `| ข้อมูล ${r}-${c} `;
            tableStr += '|\n';
        }
        tableStr += '\n';

        textarea.value = text.substring(0, start) + tableStr + text.substring(end);
        textarea.focus();
        
        const nextCursor = start + tableStr.length;
        textarea.setSelectionRange(nextCursor, nextCursor);
        this.processAndRender();
    }

    // แทรก Markdown ทั่วไปผ่านทางลัด Toolbar
    insertShortcut(type) {
        const textarea = this.markdownInput;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);
        
        let val = '';
        let offset = 0;

        switch (type) {
            case 'bold': val = `**${selected || 'ตัวหนา'}**`; offset = selected ? 0 : -2; break;
            case 'italic': val = `*${selected || 'ตัวเอียง'}*`; offset = selected ? 0 : -1; break;
            case 'strike': val = `~~${selected || 'ขีดฆ่า'}~~`; offset = selected ? 0 : -2; break;
            case 'h1': val = `\n# ${selected || 'หัวข้อใหญ่ H1'}\n`; break;
            case 'h2': val = `\n## ${selected || 'หัวข้อรอง H2'}\n`; break;
            case 'h3': val = `\n### ${selected || 'หัวข้อย่อย H3'}\n`; break;
            case 'ul': val = `\n- ${selected || 'รายการแรก'}\n- รายการถัดไป`; break;
            case 'ol': val = `\n1. ${selected || 'รายการแรก'}\n2. รายการถัดไป`; break;
            case 'quote': val = `\n> ${selected || 'ข้อความอ้างอิง'}\n`; break;
            case 'code': val = `\`${selected || 'โค้ด'}\``; offset = selected ? 0 : -1; break;
            case 'hr': val = `\n---\n`; break;
            case 'link': val = `[${selected || 'ข้อความลิงก์'}](https://example.com)`; offset = selected ? 0 : -21; break;
        }

        textarea.value = text.substring(0, start) + val + text.substring(end);
        textarea.focus();
        
        const nextPos = start + val.length + offset;
        textarea.setSelectionRange(nextPos, nextPos);
        this.processAndRender();
    }

    // สลับ Tab ในหน้าจอมือถือ
    switchToTab(tab) {
        if (tab === 'edit') {
            this.tabEditBtn.className = "flex-1 py-2 text-center font-bold text-sm rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30";
            this.tabPreviewBtn.className = "flex-1 py-2 text-center font-bold text-sm rounded-xl bg-slate-100 dark:bg-dark-300 text-slate-500 dark:text-slate-400";
            this.editorPane.classList.remove('hidden');
            this.previewPane.classList.add('hidden');
            if (window.gsap) window.gsap.from(this.editorPane, { x: -12, opacity: 0, duration: 0.25 });
        } else {
            this.tabPreviewBtn.className = "flex-1 py-2 text-center font-bold text-sm rounded-xl bg-pink-100 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400 border border-pink-200 dark:border-pink-900/30";
            this.tabEditBtn.className = "flex-1 py-2 text-center font-bold text-sm rounded-xl bg-slate-100 dark:bg-dark-300 text-slate-500 dark:text-slate-400";
            this.editorPane.classList.add('hidden');
            this.previewPane.classList.remove('hidden');
            this.processAndRender(); // อัปเดตพรีวิว
            if (window.gsap) window.gsap.from(this.previewPane, { x: 12, opacity: 0, duration: 0.25 });
        }
    }

    // ===== Theme syncing =====
    syncThemeOnLoad() {
        const isDark = document.documentElement.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
        this.applyThemeState(isDark);
    }

    applyThemeState(isDark) {
        document.documentElement.classList.toggle('dark', isDark);
        this.sunIcon.classList.toggle('hidden', isDark);
        this.moonIcon.classList.toggle('hidden', !isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (window.gsap && this.themeToggleBtn) {
            window.gsap.fromTo(this.themeToggleBtn.querySelector('span'),
                { rotate: 0 }, { rotate: isDark ? -180 : 180, duration: 0.35, ease: "back.out(1.5)" }
            );
        }
        this.applyThemeState(!isDark);
    }

    // ===== Animations & Notification Views =====
    runEntranceAnimations() {
        if (!window.gsap) return;

        // ใช้ fromTo() แทน from() เพื่อรับประกันว่า final state ของ opacity/scale
        // จะเป็น 1 เสมอ แม้ animation ถูกยกเลิกหรือขัดข้องระหว่างทาง
        window.gsap.timeline({ defaults: { ease: "power2.out" } })
            .fromTo("header h1", { y: -25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.05 })
            .fromTo("header p", { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.45")
            .fromTo("main", { scale: 0.97, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6 }, "-=0.4")
            .fromTo(".toolbar-btn", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.015, duration: 0.35 }, "-=0.3")
            .fromTo("#editorPane", { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, "-=0.25")
            .fromTo("#previewPane", { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, "-=0.5")
            .fromTo("footer .stat-card", { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.04 }, "-=0.35");
    }

    showToast(message, type = 'success') {
        const old = document.getElementById('custom-toast');
        if (old) old.remove();

        const toast = document.createElement('div');
        toast.id = 'custom-toast';
        
        let grad = 'from-purple-600 to-pink-600';
        let svg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
        
        if (type === 'error') {
            grad = 'from-rose-500 to-orange-500';
            svg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
        } else if (type === 'info') {
            grad = 'from-indigo-600 to-blue-600';
            svg = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
        }

        toast.className = `fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${grad} text-white px-5 py-3 rounded-2xl shadow-2xl z-[9999] text-sm font-semibold flex items-center gap-2 border border-white/10`;
        toast.innerHTML = `${svg} <span>${message}</span>`;
        document.body.appendChild(toast);

        if (window.gsap) {
            window.gsap.fromTo(toast, { y: 35, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.6)" });
            
            setTimeout(() => {
                window.gsap.to(toast, { 
                    opacity: 0, y: -25, scale: 0.96, duration: 0.25, ease: "power2.in", 
                    onComplete: () => toast.remove() 
                });
            }, 2600);
        } else {
            setTimeout(() => toast.remove(), 2600);
        }
    }

    debounce(func, delay) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }
}

// ผูกฟังก์ชัน Global เพื่อให้เรียกใช้ง่ายจาก onclick ใน HTML
window.insertShortcut = function(type) {
    if (window.markdownControllerInstance) {
        window.markdownControllerInstance.insertShortcut(type);
    }
};

window.insertTemplateTable = function(r, c) {
    if (window.markdownControllerInstance) {
        window.markdownControllerInstance.insertTableTemplate(r, c);
    }
};

// แนบ Controller เข้า Global scope
window.MarkdownController = MarkdownController;
