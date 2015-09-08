export function findAllDeps(packageDir) {
    require('atom-package-deps').install('omnisharp-atom')
    return true;
}

export function errors() {
    return [];
}
