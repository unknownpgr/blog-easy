import '../../system/jquery-3.4.1.min.js'
import { dir, read } from '../../system/os.js'
import { config } from '../../system/config.js';

$(document).ready(async function () {
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
            .filter(file => preserveList.indexOf(file.name.toLowerCase()) < 0)
        return Promise.all(removeList.map(file => rmrf('/' + file.name)))
    }

    // Get skin list
    var skinListTag = $('#skinList')
    skinListTag.html('Loading...')
    dir('/skins').then(list => {
        var skinList = ''
        list
            .filter(file => file.isDirectory)
            .map(file => file.name)
            .forEach(file => skinList += '<li>' + file + '</li>')
        skinListTag.html(skinList)
    }).catch((e) => {
        skinListTag.text('Error occered while loading skin list.')
    })

    // Add post write callback
    $('#postWrite').click(() => {
        var title = $('#postTitle').val()
        var content = $('#postContent').val()
        var tags = $('#postTags').val()
    })
});