async function openFilePath(filePath) {
    currentFile = filePath;
    const content = await Neutralino.filesystem.readFile(filePath);
    editor.value = content;
    const extension = filePath.split('.').pop();
    await loadSyntaxConfig(extension);
    lineStates = [];
    updateLines();
    applyHighlight();
    document.getElementById('active-tab-name').innerText = filePath.split('/').pop();
    pathDisplay.innerText = filePath;
}

function getEntryName(entry) {
    if (typeof entry === 'string') return entry;
    return entry.entry || entry.name || entry.path || '';
}

function isDirectoryEntry(entry) {
    if (typeof entry === 'string') return false;
    const type = (entry.type || '').toString().toUpperCase();
    return type === 'DIRECTORY' || type === 'DIR' || entry.isDirectory === true || entry.directory === true;
}

function getEntryPath(entry, parentPath) {
    if (typeof entry === 'string') {
        return `${parentPath.replace(/\\/g, '/')}/${entry}`;
    }
    if (entry.path) return entry.path;
    const name = getEntryName(entry);
    if (!name) return parentPath;
    return `${parentPath.replace(/\\/g, '/')}/${name}`;
}

async function createNewFile() {
    if (!currentFolder) {
        alert('Please open a folder first');
        return;
    }
    
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    
    const filePath = `${currentFolder.replace(/\\$/g, '/')}/${fileName}`;
    
    try {
        await Neutralino.filesystem.writeFile(filePath, '');
        // Refresh the file tree
        fileTree.innerHTML = '';
        await loadDirectory(currentFolder, fileTree);
    } catch (error) {
        alert(`Error creating file: ${error.message}`);
        console.error('File creation error:', error);
    }
}

async function createNewFolder() {
    if (!currentFolder) {
        alert('Please open a folder first');
        return;
    }
    
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    const folderPath = `${currentFolder.replace(/\\$/g, '/')}/${folderName}`;
    
    try {
        await Neutralino.filesystem.createDirectory(folderPath);
        // Refresh the file tree
        fileTree.innerHTML = '';
        await loadDirectory(currentFolder, fileTree);
    } catch (error) {
        alert(`Error creating folder: ${error.message}`);
        console.error('Folder creation error:', error);
    }
}

async function loadDirectory(folderPath, container, depth = 0) {
    try {
        const rawEntries = await Neutralino.filesystem.readDirectory(folderPath);
        let entries = [];

        if (Array.isArray(rawEntries)) {
            entries = rawEntries;
        } else if (rawEntries && Array.isArray(rawEntries.entries)) {
            entries = rawEntries.entries;
        } else if (rawEntries && Array.isArray(rawEntries.files)) {
            entries = rawEntries.files;
        }

        entries.sort((a, b) => {
            const aName = getEntryName(a).toLowerCase();
            const bName = getEntryName(b).toLowerCase();
            const aDir = isDirectoryEntry(a) ? 0 : 1;
            const bDir = isDirectoryEntry(b) ? 0 : 1;
            if (aDir !== bDir) return aDir - bDir;
            return aName.localeCompare(bName);
        });

        for (const entry of entries) {
            const name = getEntryName(entry);
            if (!name) continue;
            const fullPath = getEntryPath(entry, folderPath);
            const isDir = isDirectoryEntry(entry);

            const item = document.createElement('div');
            item.className = `tree-item ${isDir ? 'directory' : 'file'}`;
            item.style.paddingLeft = `${12 + depth * 14}px`;

            const icon = document.createElement('span');
            icon.className = 'tree-icon';
            icon.innerText = isDir ? '▸' : '•';
            item.appendChild(icon);

            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.innerText = name;
            item.appendChild(nameSpan);

            if (isDir) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-children';
                childrenContainer.style.display = 'none';
                item.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const expanded = item.classList.toggle('expanded');
                    icon.innerText = expanded ? '▾' : '▸';
                    if (expanded && !childrenContainer.hasChildNodes()) {
                        await loadDirectory(fullPath, childrenContainer, depth + 1);
                    }
                    childrenContainer.style.display = expanded ? 'flex' : 'none';
                });
                container.appendChild(item);
                container.appendChild(childrenContainer);
            } else {
                item.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await openFilePath(fullPath);
                });
                container.appendChild(item);
            }
        }
    } catch (error) {
        container.innerHTML = '<div class="tree-item">Unable to read folder</div>';
        console.error('Directory load error:', error);
    }
}

