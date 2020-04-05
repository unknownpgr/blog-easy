async function clearRoot() {
    const preserveFile = 'preserve.txt'
    const preserveStr = await read('/' + preserveFile)
    const preserveList = preserveStr
        .replace(/\r/g, '')
        .split('\n')
        .map(str => str.trim().toLowerCase())
        .filter(line => !line.startsWith('//') && line.length > 0)
    preserveList.push('preserve.txt')
    const fileList = await dir('/')
    const removeList = fileList
        .filter(file => preserveList.indexOf(file['name'].toLowerCase()) < 0)
    return Promise.all(removeList.map(file => rmrf('/' + file['name'])))
}

$(document).ready(async function () {
    clearRoot()
});