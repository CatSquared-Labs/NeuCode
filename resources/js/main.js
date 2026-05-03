Neutralino.init();

const editor = document.getElementById('main-editor');
const highlightLayer = document.getElementById('highlight-layer');
const lineNums = document.getElementById('line-numbers');
const fileTree = document.getElementById('file-tree');
const folderPathLabel = document.getElementById('folder-path');
const pathDisplay = document.getElementById('file-path');

let currentFile = null;
let currentFolder = null;
let lineStates = [];
let currentSyntaxConfig = null;

function toggleMenu(menuId) {
    document.getElementById(menuId).classList.toggle("show");
}

// Close the dropdown if the user clicks anywhere else
window.onclick = function(event) {
    if (!event.target.matches('.tool-btn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Sync scrolling between the master editor and the accessory layers
editor.addEventListener('scroll', () => {
    // 1. Sync the Neon Highlight Layer (Vertical AND Horizontal)
    highlightLayer.scrollTop = editor.scrollTop;
    highlightLayer.scrollLeft = editor.scrollLeft;

    // 2. Sync the Line Numbers Gutter (Vertical ONLY)
    lineNums.scrollTop = editor.scrollTop;
});

// --- EVENTS ---

// Plugin Key Listener
window.addEventListener('keydown', (e) => {
    handlePluginShortcuts(e);
});

// Initialization
Neutralino.events.on("ready", () => {
    console.log("NeuCode Ready.");
    // Setup file explorer buttons
    const newFileBtn = document.getElementById('new-file-btn');
    const newFolderBtn = document.getElementById('new-folder-btn');
    
    if (newFileBtn) newFileBtn.addEventListener('click', createNewFile);
    if (newFolderBtn) newFolderBtn.addEventListener('click', createNewFolder);
});

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