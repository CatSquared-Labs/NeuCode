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

