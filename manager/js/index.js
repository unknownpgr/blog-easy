import '../../system/jquery-3.4.1.min.js'
import { dir, read, Path, write, mkdir } from '../../system/os.js'
import { config } from '../../system/config.js';

$(document).ready(async function () {

    const dirfy = str => str.trim().toLowerCase()

    async function clearRoot() {
        const preserveFile = 'preserve.txt'
        const preserveStr = await read('/' + preserveFile)
        const preserveList = preserveStr
            .replace(/\r/g, '')                                         // \r\n => \n
            .split('\n')                                                // Line split
            .map(dirfy)                                                     // Beautify
            .filter(line => !line.startsWith('//') && line.length > 0)  // Remove annotations

        [   // Default preserve files
            'preserve.txt',
            'EasyBlog',
            'manager',
            'skin',
            'post',
            'Start.bat',
            'system'
        ]
            .map(dirfy)
            .forEach(x => preserveList.push(x))

        const fileList = await dir('/')
        const removeList = fileList
            .filter(file => preserveList.indexOf(file.name.toLowerCase()) < 0)
        return Promise.all(removeList.map(file => rmrf('/' + file.name)))
    }

    function writeMeta(directory, title, tags) {
        var path = Path.join(directory, 'meta.json')
        var meta = { title: title, date: new Date(), tags: tags, path: path }
        meta = JSON.stringify(meta)
        write(path, meta)
    }

    async function writePost(title, content, tags) {
        const dirName = title
            .toLowerCase()
            .replace(/[^a-z]+/g, '_')
            .replace(/(^[^a-z]|[^a-z]$)/g, '')
        var directory = Path.join('/post', dirName)

        var postExists = false
        try {
            await dir(directory)
            postExists = true
        } catch{ }
        if (postExists) throw new Error('Post with same title already exists.')

        var contentFile = Path.join(directory, 'content.txt')
        await mkdir(directory)
        return Promise.all([writeMeta(directory, title, tags), write(contentFile, content)])
    }

    // Get skin list
    var skinListTag = $('#skinList')
    skinListTag.html('Loading...')
    dir('/skin').then(list => {
        var skinList = ''
        list
            .filter(file => file.isDirectory)
            .forEach(file => skinList += `<li><a href="${Path.join(file.path, 'index.html')}">${file.name}</a></li>`)
        skinListTag.html(skinList)
    }).catch((e) => {
        skinListTag.text('Error occered while loading skin list.')
    })

    // Add post write callback
    $('#postWrite').click(() => {
        var title = $('#postTitle').val()
        var content = $('#postContent').val()
        var tags = $('#postTags').val()

        writePost(title, content, tags)
            .then(() => alert('Posted'))
            .catch(e => {
                alert('Post failed: ' + e)
                console.log(e)
            })
    })

    // Sync post
    var blogConfig = await config('/system/config.json')
    blogConfig.posts = (await Promise.all((await dir('/post')).map(async (post) => await read(Path.join(post.path, 'meta.json')))))
        .sort((a, b) => {
            if (a.date > b.date) return -1
            if (b.date > a.date) return 1
            return 0
        })
    blogConfig.update()

    // Update post list
});
