async function loadSyntaxConfig(extension) {
    try {
        // Looks in /resources/langs/ws.json, etc.
        let data = await Neutralino.filesystem.readFile(`./resources/langs/${extension}.json`);
        currentSyntaxConfig = JSON.parse(data);
    } catch (err) {
        currentSyntaxConfig = { type: "code", rules: { color_change_trigger: [] } };
    }
}

function applyHighlight() {
    const text = editor.value;
    
    if (!currentSyntaxConfig || currentSyntaxConfig.type === "plain") {
        highlightLayer.innerText = text;
        return;
    }

    let escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = escapedText.split('\n');
    const rules = currentSyntaxConfig.rules;

    const highlightedLines = lines.map(line => {
        let i = 0;
        let out = "";

        while (i < line.length) {
            let char = line[i];

            // 1. Comments
            if (rules.comment_trigger && char === rules.comment_trigger) {
                out += `<span class="comment">${line.substring(i)}</span>`;
                break;
            }

            // 2. Strings (Bleu Ciel)
            if (char === '"' || char === "'") {
                let quoteType = char;
                let start = i;
                i++; // Skip opening quote
                while (i < line.length && line[i] !== quoteType) {
                    // Handle escaped quotes like \"
                    if (line[i] === '\\' && line[i+1] === quoteType) {
                        i += 2;
                    } else {
                        i++;
                    }
                }
                i++; // Include closing quote
                let stringVal = line.substring(start, i);
                out += `<span class="string">${stringVal}</span>`;
                continue;
            }

            // 3. Gold Brackets
            if (char === '(' || char === ')') {
                out += `<span class="bracket">${char}</span>`;
                i++; continue;
            }

            // 4. Triggers (Dot, etc.)
            let matchedTrigger = rules.color_change_trigger.find(t => line.startsWith(t, i));
            if (matchedTrigger) {
                let isDecimal = /[0-9]/.test(line[i-1] || '') && /[0-9]/.test(line[i+matchedTrigger.length] || '');
                if (!isDecimal) {
                    out += `<span>${matchedTrigger}</span>`;
                    i += matchedTrigger.length;
                    let nextWord = "";
                    while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
                        nextWord += line[i]; i++;
                    }
                    out += `<span class="accent">${nextWord}</span>`;
                    continue;
                }
            }

            // 5. Words (Keywords, Types, Functions)
            if (/[a-zA-Z]/.test(char)) {
                let word = "";
                while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
                    word += line[i]; i++;
                }

                let isFunc = line.substring(i).trim().startsWith('(');

                if (rules.keywords && rules.keywords.includes(word)) {
                    out += `<span class="keyword">${word}</span>`;
                } else if (rules.types && rules.types.includes(word)) {
                    out += `<span class="type">${word}</span>`;
                } else if (isFunc) {
                    out += `<span class="function">${word}</span>`;
                } else {
                    out += word;
                }
                continue;
            }

            out += char;
            i++;
        }
        return out;
    });
    highlightLayer.innerHTML = highlightedLines.join('\n') + "\n";
}

// --- CORE FUNCTIONS ---

function updateLines() {
    const lines = editor.value.split('\n');
    const lineCount = lines.length;
    while (lineStates.length < lineCount) lineStates.push(0);
    if (lineStates.length > lineCount) lineStates.length = lineCount;

    let html = '';
    for (let i = 0; i < lineCount; i++) {
        let stateClass = (lineStates[i] === 1) ? 'unsaved' : (lineStates[i] === 2) ? 'saved' : '';
        html += `<div class="line-num ${stateClass}">${i + 1}</div>`;
    }
    lineNums.innerHTML = html;
}

async function openFile() {
    let entries = await Neutralino.os.showOpenDialog('Open File');
    if (entries.length > 0) {
        currentFile = entries[0];
        const content = await Neutralino.filesystem.readFile(currentFile);
        editor.value = content;
        
        const ext = currentFile.split('.').pop();
        await loadSyntaxConfig(ext);

        lineStates = []; 
        updateLines();
        applyHighlight();
        
        const parts = currentFile.split('/').filter(p => p.length > 0);
        document.getElementById('active-tab-name').innerText = parts[parts.length - 1];
        breadcrumbs.innerText = parts.join('  ›  ');
    }
}