import '../../system/jquery-3.4.1.min.js'
import { dir, read, Path, write, mkdir } from '../../system/os.js'
import { config } from '../../system/config.js';

$(document).ready(async function () {

    const dirfy = str => str.trim().toLowerCase()

    //================================================================
    //  Function definition
    //================================================================

    async function clearRoot() {
        const preserveFile = 'preserve.txt'
        const preserveStr = await read('/' + preserveFile)
        const preserveList = preserveStr
            .replace(/\r/g, '')                                         // \r\n => \n
            .split('\n')                                                // Line split
            .map(dirfy)                                                 // Beautify
            .filter(line => !line.startsWith('//') && line.length > 0)  // Remove annotations

        [   // Default preserve files
            'preserve.txt',
            'server',
            'manager',
            'skin',
            'post',
            'start.bat',
            'system'
        ]
            .map(dirfy)
            .forEach(x => preserveList.push(x))

        const fileList = await dir('/')
        const removeList = fileList
            .filter(file => preserveList.indexOf(file.name.toLowerCase()) < 0)
        return Promise.all(removeList.map(file => rmrf('/' + file.name)))
    }

    function writeMeta(directory, title, tags, date) {
        var path = Path.join(directory, 'meta.json')
        var meta = { title: title, date: date ? date : new Date(), tags: tags, path: directory }
        meta = JSON.stringify(meta)
        write(path, meta)
    }

    async function writePost(title, content, tags) {
        const dirName = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/(^[^a-z0-9]|[^a-z0-9]$)/g, '')
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

    //================================================================
    //  Show skin list
    //================================================================

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

    //================================================================
    //  Post write callback
    //================================================================

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

    //================================================================
    //  Post sync
    //================================================================

    // List of post directories for further use.
    var posts = (await dir('/post')).filter(file => file.isDirectory)

    // Sync post
    var blogConfig = await config('/system/config.json')

    // Update post list and tag list.
    var tags = []

    // Sort posts and update tags
    posts = (await Promise.all(posts
        // Get list meta files
        .map(async post => {

            // Read meta file
            var metaFile = await read(Path.join(post.path, 'meta.json'))

            // Update tag list
            metaFile.tags
                .split(',')
                .forEach(e => tags.push(e))

            // Update meta file(optional)
            // writeMeta(post.path, metaFile.title, metaFile.tags, metaFile.date)
            // var metaFile = await read(Path.join(post.path, 'meta.json'))

            return metaFile
        })))
        // Sort by date
        .sort((a, b) => {
            if (a.date > b.date) return -1
            if (b.date > a.date) return 1
            return 0
        })

    // Remove duplicated tags
    blogConfig.tags = []
    tags.forEach(tmpTagList => {
        if (blogConfig.tags.indexOf(tmpTagList) < 0) blogConfig.tags.push(tmpTagList)
    })

    // Write to file
    await blogConfig.update()

    // Update post time list for client use.
    const listCount = blogConfig.POST_LIST_COUNT;
    for (var i = 0; i < posts.length; i += listCount) {
        var currentList = []
        for (var j = i; j < i + listCount && j < posts.length; j++) {
            currentList.push(posts[j])
        }
        write(`/post/posts_${i}_${i + listCount}.json`, JSON.stringify(currentList))
    }

    // Update post tag list for client use.
    var tagDict = {}
    blogConfig.tags.forEach(tag => tagDict[tag] = [])
    posts.forEach(post => {
        post.tags.split(',').forEach(tag => tagDict[tag].push(post))
    })

    write('/post/posts_tags.json', JSON.stringify(blogConfig.tags))

    for (var tag in tagDict) {
        write(`/post/posts_tag_${tag}.json`, JSON.stringify(tagDict[tag]))
    }
});