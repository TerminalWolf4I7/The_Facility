// Model: Markdown Converter Data & Parser Logic

const MarkdownModel = {
    // โหลดข้อความที่บันทึกไว้ล่าสุด
    loadSavedContent() {
        try {
            return localStorage.getItem('markdown-content') || '';
        } catch (e) {
            console.error('LocalStorage load failed:', e);
            return '';
        }
    },

    // บันทึกข้อความอัตโนมัติ
    saveContent(text) {
        try {
            localStorage.setItem('markdown-content', text);
        } catch (e) {
            console.error('LocalStorage save failed:', e);
        }
    },

    // ล้างข้อมูลที่บันทึกไว้
    clearSavedContent() {
        try {
            localStorage.removeItem('markdown-content');
        } catch (e) {
            console.error('LocalStorage clear failed:', e);
        }
    },

    // แปลง Markdown เป็น HTML โดยใช้ Marked.js (แบบปลอดภัยกันแครช)
    parseMarkdown(markdownText) {
        if (!markdownText) return '';
        
        try {
            if (window.marked) {
                // เรียกใช้ marked.parse
                const rawHtml = window.marked.parse(markdownText);
                if (window.DOMPurify) {
                    return window.DOMPurify.sanitize(rawHtml, {
                        ALLOWED_TAGS: ['h1','h2','h3','h4','h5','h6','p','br','strong','em',
                                       'code','pre','blockquote','ul','ol','li','table','thead',
                                       'tbody','tr','th','td','a','img','hr','del','sup','sub'],
                        ALLOWED_ATTR: ['href','src','alt','class','id','target','rel'],
                        ALLOW_DATA_ATTR: false,
                    });
                }
                return rawHtml;
            }
            // กรณีไม่มี library โหลดอยู่ ให้แสดงตัวหนังสือธรรมดา
            return markdownText.replace(/\n/g, '<br>');
        } catch (e) {
            console.error('Marked parsing error:', e);
            return '<div class="text-rose-500">เกิดข้อผิดพลาดในการประมวลผลข้อความ</div>';
        }
    },

    // คำนวณสถิติของข้อความ
    calculateStats(text, previewHtml) {
        const chars = text.length;
        
        // นับจำนวนคำ
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        // นับจำนวนย่อหน้า
        const paragraphs = text.trim() ? text.split(/\n{2,}/).filter(p => p.trim() !== '').length : 0;
        
        // นับจำนวนตารางที่พบใน HTML ที่คอมไพล์แล้ว
        let tablesCount = 0;
        if (previewHtml) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = previewHtml;
            tablesCount = tempDiv.querySelectorAll('table').length;
        }

        return { chars, words, paragraphs, tablesCount };
    },

    // จัดสไตล์ Inline สำหรับนำไปวางใน Google Docs / Word
    generateRichHtmlForClipboard(previewHtml, rawMarkdown, thBg, thText, border) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = previewHtml;

        // Fallback colors if none provided
        const finalThBg = thBg || '#f1f5f9';
        const finalThText = thText || '#1e293b';
        const finalBorder = border || '#cbd5e1';

        // 1. จัดการ <table> ทั้งหมด
        tempDiv.querySelectorAll('table').forEach(table => {
            table.setAttribute('style', `border-collapse: collapse; width: 100%; border: 1px solid ${finalBorder}; margin: 15px 0; font-family: Arial, sans-serif;`);
        });

        // 2. จัดการ <th> (หัวตาราง)
        tempDiv.querySelectorAll('th').forEach(th => {
            th.setAttribute('style', `border: 1px solid ${finalBorder}; padding: 10px 14px; background-color: ${finalThBg}; color: ${finalThText}; font-weight: bold; text-align: left;`);
        });

        // 3. จัดการ <td> (ช่องตาราง)
        tempDiv.querySelectorAll('td').forEach(td => {
            td.setAttribute('style', `border: 1px solid ${finalBorder}; padding: 10px 14px; color: #334155; vertical-align: top;`);
        });

        // 4. จัดการ <blockquote>
        tempDiv.querySelectorAll('blockquote').forEach(bq => {
            bq.setAttribute('style', 'border-left: 4px solid #8b5cf6; padding-left: 14px; margin: 14px 0; font-style: italic; color: #475569; background-color: #f8fafc;');
        });

        // 5. จัดการ <code> (Inline Code)
        tempDiv.querySelectorAll('code').forEach(code => {
            if (code.parentNode.tagName !== 'PRE') {
                code.setAttribute('style', 'background-color: #fce7f3; color: #db2777; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em;');
            }
        });

        // 6. จัดการ <pre> (Code Blocks)
        tempDiv.querySelectorAll('pre').forEach(pre => {
            pre.setAttribute('style', 'background-color: #0f0f13; color: #f8fafc; padding: 12px; border-radius: 8px; font-family: monospace; overflow-x: auto; margin: 15px 0;');
        });

        return tempDiv.innerHTML;
    }
};

// แนบตัวแปรเข้า Global scope
window.MarkdownModel = MarkdownModel;
