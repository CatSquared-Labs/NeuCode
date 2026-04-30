Neutralino.init();

const editor = document.getElementById('main-editor');
const highlightLayer = document.getElementById('highlight-layer');
const lineNums = document.getElementById('line-numbers');
const breadcrumbs = document.getElementById('breadcrumbs');
const pathDisplay = document.getElementById('file-path');

let currentFile = null;
let lineStates = [];
let currentSyntaxConfig = null;

async function saveFile() {
    if (!currentFile) currentFile = await Neutralino.os.showSaveDialog('Save File');
    if (currentFile) {
        await Neutralino.filesystem.writeFile(currentFile, editor.value);
        lineStates = lineStates.map(state => state === 1 ? 2 : state);
        updateLines();
        pathDisplay.innerText = "Saved";
        setTimeout(() => pathDisplay.innerText = "", 3000);
    }
}

// --- EVENTS ---

Neutralino.events.on("windowClose", () => { Neutralino.app.exit(); });

editor.addEventListener('scroll', () => {
    highlightLayer.scrollTop = editor.scrollTop;
    highlightLayer.scrollLeft = editor.scrollLeft;
});

editor.addEventListener('input', () => {
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, cursorPos);
    const lineIndex = textBefore.split('\n').length - 1;
    lineStates[lineIndex] = 1;
    updateLines();
    applyHighlight();
});

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + 4;
        applyHighlight();
    }
    if (e.key === 'Enter') {
        e.preventDefault();
        const start = editor.selectionStart;
        const currentLineText = editor.value.substring(0, start).split('\n').pop();
        const whitespace = currentLineText.match(/^\s*/)[0];
        editor.value = editor.value.substring(0, start) + "\n" + whitespace + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + 1 + whitespace.length;
        updateLines();
        applyHighlight();
    }
});

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); openFile(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveFile(); }
});

updateLines();