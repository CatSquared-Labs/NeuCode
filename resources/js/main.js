// OKAY ik bad documentation but i don't want to was 1000 years commenting everything

Neutralino.init();

const editor = document.getElementById('main-editor');
const lineNums = document.getElementById('line-numbers');
const pathDisplay = document.getElementById('file-path');
const breadcrumbs = document.getElementById('breadcrumbs');

let currentFile = null;
let lineStates = []; // 0: Normal, 1: Modified (Red), 2: Saved (Green)



function updateLines() {
    const lines = editor.value.split('\n');
    const lineCount = lines.length;

    while (lineStates.length < lineCount) lineStates.push(0);
    if (lineStates.length > lineCount) lineStates.length = lineCount;

    let html = '';
    for (let i = 0; i < lineCount; i++) {
        let stateClass = '';
        if (lineStates[i] === 1) stateClass = 'unsaved';
        if (lineStates[i] === 2) stateClass = 'saved';
        html += `<div class="line-num ${stateClass}">${i + 1}</div>`;
    }
    lineNums.innerHTML = html;
}

function updatePathUI(path) {
    if(!path) return;
    const parts = path.split('/').filter(p => p.length > 0);
    document.getElementById('active-tab-name').innerText = parts[parts.length - 1];
    breadcrumbs.innerText = parts.join('  ›  ');
}


// open funciton (opens a file explorer dialog and loads the selected file into the editor)
async function openFile() {
    let entries = await Neutralino.os.showOpenDialog('Open File');
    if (entries.length > 0) {
        currentFile = entries[0];
        const content = await Neutralino.filesystem.readFile(currentFile);
        editor.value = content;
        
        lineStates = []; // Reset markers on fresh open
        updateLines();
        updatePathUI(currentFile);
    }
}

// save function (saves the current content of the editor as a file)
async function saveFile() {
    if (!currentFile) {
        currentFile = await Neutralino.os.showSaveDialog('Save File');
    }
    if (currentFile) {
        await Neutralino.filesystem.writeFile(currentFile, editor.value);
        
        // Turn all RED lines to GREEN
        lineStates = lineStates.map(state => state === 1 ? 2 : state);
        
        updateLines();
        updatePathUI("");
        pathDisplay.innerText = "Saved";
        setTimeout(() => pathDisplay.innerText = "", 3000);
    }
}

// input event listeners

editor.addEventListener('input', () => {
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, cursorPos);
    const lineIndex = textBefore.split('\n').length - 1;

    lineStates[lineIndex] = 1;
    updateLines();
});

editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + 4;
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        const start = editor.selectionStart;
        const currentLineText = editor.value.substring(0, start).split('\n').pop();
        const whitespace = currentLineText.match(/^\s*/)[0];
        
        editor.value = editor.value.substring(0, start) + "\n" + whitespace + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + 1 + whitespace.length;
        
        const lineIndex = editor.value.substring(0, editor.selectionStart).split('\n').length - 1;
        lineStates[lineIndex] = 1;
        updateLines();
    }
});

// shortcuts
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); openFile(); }
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveFile(); }
});


updateLines();