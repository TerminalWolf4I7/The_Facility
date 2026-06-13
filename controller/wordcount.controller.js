// Controller: UI logic, event listeners, theme, save, etc.

(function () {
    const {
        countWordsLogic,
        countUniqueWordsLogic,
        countSentencesLogic,
        countParagraphsLogic,
        calculateAllStats
    } = window.WordCountModel;

    // ===== Elements Cache =====
    const elements = {
        html: document.documentElement,
        textInput: document.getElementById('textInput'),
        charCount: document.getElementById('charCount'),
        charNoSpaceCount: document.getElementById('charNoSpaceCount'),
        wordCount: document.getElementById('wordCount'),
        lineCount: document.getElementById('lineCount'),
        sentenceCount: document.getElementById('sentenceCount'),
        paragraphCount: document.getElementById('paragraphCount'),
        uniqueWordCount: document.getElementById('uniqueWordCount'),
        avgWordLength: document.getElementById('avgWordLength'),
        readTime: document.getElementById('readTime'),
        readTimeSec: document.getElementById('readTimeSec'),
        saveStatus: document.getElementById('saveStatus'),
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        sunIcon: document.getElementById('sunIcon'),
        moonIcon: document.getElementById('moonIcon'),
        clearBtn: document.getElementById('clearBtn'),
        copyBtn: document.getElementById('copyBtn'),
        shareBtn: document.getElementById('shareBtn'),
        printBtn: document.getElementById('printBtn'),
        autoSaveToggle: document.getElementById('autoSaveToggle'),
        autoSaveIntervalSelect: document.getElementById('autoSaveInterval'),
        manualSaveBtn: document.getElementById('manualSaveBtn'),
        currentYearSpan: document.getElementById('currentYear'),
        allCounterValues: document.querySelectorAll('.counter-value')
    };

    // ===== Debounce Utility =====
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // ===== Theme Management =====
    function applyTheme(isDark) {
        elements.html.classList.toggle('dark', isDark);
        elements.sunIcon.classList.toggle('hidden', isDark);
        elements.moonIcon.classList.toggle('hidden', !isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    function toggleTheme() {
        const isCurrentlyDark = elements.html.classList.contains('dark');
        if (window.gsap) {
            gsap.fromTo(elements.themeToggleBtn.querySelector('span'),
                { rotate: 0, scale: 1 },
                { rotate: isCurrentlyDark ? -180 : 180, scale: 1.2, duration: 0.4, ease: "back.out(1.7)", clearProps: "all" }
            );
        }
        applyTheme(!isCurrentlyDark);
    }

    // Initialize theme
    (function () {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches);
            }
        });
    })();
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // ===== UI Update Functions =====
    function updateStatsDisplay(stats) {
        elements.charCount.textContent = stats.chars.toLocaleString();
        elements.charNoSpaceCount.textContent = stats.noSpaces.toLocaleString();
        elements.wordCount.textContent = stats.words.toLocaleString();
        elements.lineCount.textContent = stats.lines.toLocaleString();
        elements.sentenceCount.textContent = stats.sentences.toLocaleString();
        elements.paragraphCount.textContent = stats.paragraphs.toLocaleString();
        elements.uniqueWordCount.textContent = stats.unique.toLocaleString();
        elements.avgWordLength.textContent = stats.avgLen.toFixed(2);
        elements.readTime.textContent = stats.minutesToRead.toFixed(2);
        elements.readTimeSec.textContent = stats.secondsToRead.toLocaleString();

        if (window.gsap) {
            gsap.fromTo(elements.allCounterValues,
                { scale: 1.08, color: "var(--tw-prose-links, #2563eb)" },
                { scale: 1, color: "", duration: 0.4, stagger: 0.03, ease: "back.out(1.7)" }
            );
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        let bgColor = 'bg-gray-800';
        if (type === 'error') bgColor = 'bg-red-600';
        else if (type === 'info') bgColor = 'bg-blue-600';

        toast.className = `fixed bottom-5 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-5 py-3 rounded-xl shadow-2xl z-[9999] text-sm font-medium`;
        toast.textContent = message;
        document.body.appendChild(toast);

        if (window.gsap) {
            gsap.fromTo(toast,
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
            );
        }

        setTimeout(() => {
            if (window.gsap) {
                gsap.to(toast, { opacity: 0, y: -20, scale: 0.9, duration: 0.3, ease: "power2.in", onComplete: () => { toast.remove(); } });
            } else {
                toast.remove();
            }
        }, 2500);
    }

    // ===== Auto Save Logic =====
    const saveStatusConfig = {
        saving: { icon: '<svg class="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>', defaultMsg: 'กำลังบันทึก...', classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/60 dark:text-yellow-300' },
        error: { icon: '<svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M5.07 19.07a10 10 0 1113.86 0H5.07z" /></svg>', defaultMsg: 'บันทึกไม่สำเร็จ', classes: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300' },
        success: { icon: '<svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>', defaultMsg: 'บันทึกแล้ว', classes: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300' }
    };

    function updateSaveStatusUI(statusType, message, timeout = 2000) {
        const statusEl = elements.saveStatus;
        const indicator = statusEl.querySelector('.save-indicator');
        const msgSpan = statusEl.querySelector('.save-msg');

        const config = saveStatusConfig[statusType] || saveStatusConfig.success;
        const baseClasses = 'inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium transition-all duration-300 text-xs';

        statusEl.className = `${baseClasses} ${config.classes}`;
        indicator.innerHTML = config.icon;
        msgSpan.textContent = message || config.defaultMsg;

        if (window.gsap) {
            gsap.killTweensOf(statusEl);
            gsap.fromTo(statusEl, { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.3 });
        } else {
            statusEl.style.opacity = 1;
        }

        clearTimeout(statusEl.timeoutId);
        if (timeout) {
            statusEl.timeoutId = setTimeout(() => {
                if (window.gsap) {
                    gsap.to(statusEl, { opacity: 0, y: -5, duration: 0.3, onComplete: () => statusEl.style.opacity = '0' });
                } else {
                    statusEl.style.opacity = 0;
                }
            }, timeout);
        }
    }

    function performSaveContent() {
        try {
            updateSaveStatusUI('saving', 'กำลังบันทึก...', null);
            const text = elements.textInput.value;
            localStorage.setItem('wordcounter-text', text);
            setTimeout(() => updateSaveStatusUI('success'), 300);
        } catch (error) {
            updateSaveStatusUI('error', 'เกิดข้อผิดพลาดในการบันทึก');
            console.error('Save error:', error);
        }
    }

    // Debounced handler for text input
    const debouncedProcessText = debounce(() => {
        const text = elements.textInput.value;
        const stats = calculateAllStats(text);
        updateStatsDisplay(stats);
        performSaveContent(); // <-- Save every time stats are updated (on input)
    }, 300);

    // ===== Event Listeners Setup =====
    function initializeEventListeners() {
        elements.textInput.addEventListener('input', debouncedProcessText);

        elements.clearBtn.addEventListener('click', () => {
            elements.textInput.value = '';
            debouncedProcessText();
            // performSaveContent(); <-- Already called in debouncedProcessText
            showToast('ล้างข้อความแล้ว', 'info');
            elements.textInput.focus();
        });

        elements.copyBtn.addEventListener('click', () => {
            if (!elements.textInput.value) {
                showToast('ไม่มีข้อความให้คัดลอก', 'error');
                return;
            }
            navigator.clipboard.writeText(elements.textInput.value)
                .then(() => showToast('คัดลอกข้อความแล้ว!'))
                .catch(err => {
                    console.error('Copy failed:', err);
                    showToast('ไม่สามารถคัดลอกได้', 'error');
                });
        });

        elements.shareBtn.addEventListener('click', () => {
            if (navigator.share && elements.textInput.value) {
                navigator.share({ title: 'Word Counter Text', text: elements.textInput.value })
                    .then(() => showToast('แชร์สำเร็จ!', 'info'))
                    .catch(err => {
                        if (err.name !== 'AbortError') {
                            console.error('Share failed:', err);
                            showToast('การแชร์ล้มเหลว', 'error');
                        }
                    });
            } else if (!elements.textInput.value) {
                showToast('ไม่มีข้อความให้แชร์', 'error');
            }
            else {
                showToast('อุปกรณ์นี้ไม่รองรับ Web Share API', 'info');
            }
        });

        elements.printBtn.addEventListener('click', () => {
            const textToPrint = elements.textInput.value;
            const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="th">
                <head><title>Word Counter - Print</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 25px; line-height: 1.6; }
                    pre { white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ddd; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
                    h2 { margin-bottom: 10px; color: #333; }
                </style>
                </head>
                <body>
                    <h2>ข้อความสำหรับพิมพ์:</h2>
                    <pre>${SecurityUtils.escapeHtml(textToPrint)}</pre> 
                </body></html>`);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
            };
        });

        elements.manualSaveBtn.addEventListener('click', performSaveContent);

        // Load saved text
        const savedText = localStorage.getItem('wordcounter-text') || '';
        elements.textInput.value = savedText;
        debouncedProcessText();
    }

    // ===== Initial Page Animations =====
    function animatePageOnLoad() {
        if (!window.gsap) return;
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        tl.from(elements.html.querySelector('h1'), { y: -30, opacity: 0, duration: 0.7, delay: 0.1 })
            .from(elements.html.querySelector('h1 + p'), { y: -20, opacity: 0, duration: 0.6 }, "-=0.5")
            .from(elements.textInput.parentElement, { scale: 0.95, opacity: 0, duration: 0.5 }, "-=0.4")
            .from(elements.allCounterValues.parentElement, { y: 30, opacity: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" }, "-=0.3");
    }

    // ===== Initialize App =====
    document.addEventListener('DOMContentLoaded', function () {
        if (elements.currentYearSpan) {
            elements.currentYearSpan.textContent = new Date().getFullYear();
        }
        initializeEventListeners();
        animatePageOnLoad();
    });
})();