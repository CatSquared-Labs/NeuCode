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

async function openFolder() {
    let selectedFolder = await Neutralino.os.showFolderDialog('Open Folder');
    if (!selectedFolder) return;
    if (Array.isArray(selectedFolder)) {
        selectedFolder = selectedFolder[0];
    }
    currentFolder = selectedFolder;
    folderPathLabel.innerText = currentFolder;
    fileTree.innerHTML = '';
    await loadDirectory(currentFolder, fileTree);
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
        document.getElementById('file-path').innerText = currentFile;
    }
}