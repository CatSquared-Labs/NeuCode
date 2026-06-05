const editTextarea = document.getElementById('main-editor');

function focusEditor() {
    if (editTextarea) {
        editTextarea.focus();
    }
}

function insertTextAtCursor(text) {
    if (!editTextarea) return;
    const start = editTextarea.selectionStart;
    const end = editTextarea.selectionEnd;
    editTextarea.setRangeText(text, start, end, 'end');
    editTextarea.selectionStart = editTextarea.selectionEnd = start + text.length;
    editTextarea.focus();
    if (typeof updateLines === 'function') updateLines();
    if (typeof applyHighlight === 'function') applyHighlight();
}

function undoEdit() {
    focusEditor();
    document.execCommand('undo');
}

function redoEdit() {
    focusEditor();
    document.execCommand('redo');
}

function cutText() {
    focusEditor();
    const successful = document.execCommand('cut');
    if (!successful) {
        document.execCommand('copy');
        const start = editTextarea.selectionStart;
        const end = editTextarea.selectionEnd;
        editTextarea.setRangeText('', start, end, 'start');
    }
}

function copyText() {
    focusEditor();
    document.execCommand('copy');
}

async function pasteText() {
    focusEditor();
    let clipboardText = null;
    if (navigator.clipboard && navigator.clipboard.readText) {
        try {
            clipboardText = await navigator.clipboard.readText();
        } catch (err) {
            clipboardText = null;
        }
    }
    if (clipboardText !== null && clipboardText !== undefined) {
        insertTextAtCursor(clipboardText);
    } else {
        document.execCommand('paste');
    }
}

let currentFindIndex = 0;
let findMatches = [];

function openFindInMenu() {
    const findContainer = document.getElementById('find-input-container');
    const findInput = document.getElementById('find-text-input');
    
    if (findContainer) {
        findContainer.style.display = 'flex';
        if (findInput) {
            findInput.focus();
            findInput.select();
        }
    }
}

function closeFindInput() {
    const findContainer = document.getElementById('find-input-container');
    if (findContainer) {
        findContainer.style.display = 'none';
    }
    focusEditor();
}

function getMatches() {
    const findInput = document.getElementById('find-text-input');
    const searchText = findInput ? findInput.value : '';
    
    if (!searchText || searchText.length === 0) {
        findMatches = [];
        return [];
    }
    
    const text = editTextarea.value;
    const matches = [];
    let startIndex = 0;
    
    while ((startIndex = text.indexOf(searchText, startIndex)) !== -1) {
        matches.push(startIndex);
        startIndex += searchText.length;
    }
    
    findMatches = matches;
    return matches;
}

function findNext() {
    const findInput = document.getElementById('find-text-input');
    if (!findInput || !findInput.value) return;
    
    const matches = getMatches();
    if (matches.length === 0) return;
    
    currentFindIndex = (currentFindIndex + 1) % matches.length;
    const searchText = findInput.value;
    const matchStart = matches[currentFindIndex];
    
    editTextarea.focus();
    editTextarea.setSelectionRange(matchStart, matchStart + searchText.length);
}

function findPrev() {
    const findInput = document.getElementById('find-text-input');
    if (!findInput || !findInput.value) return;
    
    const matches = getMatches();
    if (matches.length === 0) return;
    
    currentFindIndex = (currentFindIndex - 1 + matches.length) % matches.length;
    const searchText = findInput.value;
    const matchStart = matches[currentFindIndex];
    
    editTextarea.focus();
    editTextarea.setSelectionRange(matchStart, matchStart + searchText.length);
}

// Initialize find input keyboard shortcuts
setTimeout(() => {
    const findInput = document.getElementById('find-text-input');
    if (findInput) {
        findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (e.shiftKey) {
                    findPrev();
                } else {
                    findNext();
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                closeFindInput();
            }
        });
    }
}, 100);

