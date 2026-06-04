function gitInit() {
    Neutralino.os.execCommand('git init', function (data) {
        alert('Repository initialized!');
    });
}

function gitCommit() {
    const commitMessage = prompt('Enter commit message:');
    if (commitMessage) {
        Neutralino.os.execCommand('git add .', function (data) {
        });
        Neutralino.os.execCommand(`git commit -m "${commitMessage}"`, function (data) {
            alert('Changes committed!');
        });
    }
}

function gitPush() {
    const remote = prompt('Enter remote name (default: origin):') || 'origin';
    const branch = prompt('Enter branch name (default: main):') || 'main';
    Neutralino.os.execCommand(`git push ${remote} ${branch}`, function (data) {
        alert('Changes pushed!');
    });
}