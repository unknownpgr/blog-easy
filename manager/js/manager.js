import '../../system/jquery-3.4.1.min.js'
import { dir, read, Path, write, mkdir, each, remove, exists, copyDir } from '../../system/os.js'
import { config } from '../../system/config.js';

$(document).ready(async function () {

    //================================================================
    //  Local server check
    //================================================================

    // You can check if server is alive by checking directory exists.
    // Because http HEAD method cannot check directory existence.
    var serverConnected = (await exists('/')).isDirectory;
    if (!serverConnected) {
        alert('Server is not opened yet.')
        return;
    }

    //================================================================
    //  Function definition
    //================================================================

    /**
     * Make string to directory name by decapitalizing and removing special characters.
     * @param {String} str 
     */
    function dirfy(str) {
        return str
            .toLowerCase()                              // Decapitalize
            .replace(/[^a-z0-9]+/g, '_')                // Replace special characters to _
            .replace(/(^[^a-z0-9]|[^a-z0-9]$)/g, '')    // Remove special characters at first and last.
    }

    /**
     * Generate meta file in given directory
     * @param {String} directory 
     * @param {String} title 
     * @param {String} tags 
     * @param {String, Date} date 
     */
    function writeMeta(directory, title, tags, date) {
        var path = Path.join(directory, 'meta.json')
        var meta = { title: title, date: date ? date : new Date(), tags: tags, path: directory }
        meta = JSON.stringify(meta)
        return write(path, meta)
    }

    /**
     * Make a post with given data.
     * @param {String} title 
     * @param {String} content 
     * @param {String} tags 
     */
    async function writePost(title, content, tags) {
        if (!title || title.length == 0) throw new Error("Title cannot be empty.")

        const dirName = dirfy(title)
        var directory = Path.join('/post', dirName)

        var postExists = false
        try {
            await dir(directory)
            postExists = true
        } catch{ }
        if (postExists) throw new Error('Post with same title already exists.')

        var contentFile = Path.join(directory, 'content.txt')

        await mkdir(directory)
        return Promise.all([
            writeMeta(directory, title, tags),
            write(contentFile, content)])
    }

    //================================================================
    //  Show skin list
    //================================================================

    // Get skin list
    (async () => {
        var skinListTag = $('#skinList')
        skinListTag.html('Loading...')
        var skinList = ''
        await each(dir('/skin'), async path => {
            if (path.isDirectory) skinList +=
                `<li>
                    <a href="${Path.join(path.path, 'index.html')}">${path.name}</a>
                    <button onclick="applySkin(${path.path})"> Apply this skin </button>
                </li>`
        })
        skinListTag.html(skinList)
    })()

    //================================================================
    //  Post write callback
    //================================================================

    // Add post write callback
    $('#postWrite').click(async () => {
        var title = $('#postTitle').val()
        var content = $('#postContent').val()
        var tags = $('#postTags').val()

        try { await writePost(title, content, tags); }
        catch (e) {
            alert('Post failed: ' + e);
            console.log(e);
        }
    })

    //================================================================
    //  Post sync
    //================================================================

    // Sync post
    const blogConfig = await config('/system/config.json')

    var posts = []
    var tags = []

    await each(dir('/post'), async post => {

        // Remove existing files
        if (post.isFile) return remove(post.path)

        // Read meta file
        var meta = await read(Path.join(post.path, 'meta.json'))

        // We can modify list here because javascript is thread-safe.

        // Update post list
        posts.push(meta)

        // Update tag list. (Although js is thread-safe, we cannot check duplication here.)
        meta.tags
            .split(',')
            .forEach(e => tags.push(e))

        // Update meta file(optional)
        await writeMeta(post.path, meta.title, meta.tags, meta.date)
    })

    // Sort posts by date
    posts = posts.sort((a, b) => {
        if (a.date > b.date) return -1
        if (b.date > a.date) return 1
        return 0
    })

    // Remove duplicated tags
    tags = tags.reduce((pre, cur) => {
        if (pre.indexOf(cur) < 0) pre.push(cur);
        return pre
    }, [])

    // Update post list file to 
    const listCount = blogConfig.POST_LIST_COUNT;
    for (var i = 0; i < posts.length; i += listCount) {
        var currentList = []
        for (var j = i; j < i + listCount && j < posts.length; j++) {
            currentList.push(posts[j])
        }
        write(`/post/posts_${i}_${i + listCount}.json`, JSON.stringify(currentList))
    }

    // Update list of tags
    write('/post/posts_tags.json', JSON.stringify(tags))

    // Update list of posts by tag
    var tagDict = {}
    tags.forEach(tag => tagDict[tag] = [])
    posts.forEach(post => {
        post.tags.split(',').forEach(tag => tagDict[tag.trim()].push(post))
    })
    for (var tag in tagDict) {
        write(`/post/posts_tag_${tag}.json`, JSON.stringify(tagDict[tag]))
    }
});

/**
 * Remove all items in root directory except files listed in /system/preserve.txt
 */
async function clearRoot() {
    const dirfy = str => str.trim().toLowerCase()

    const preserveFile = '/system/preserve.txt'
    const preserveStr = await read(preserveFile)
    const preserveList = preserveStr
        .replace(/\r/g, '')                                         // \r\n => \n
        .split('\n')                                                // Line split
        .map(dirfy)                                                 // Beautify
        .filter(line => !line.startsWith('//') && line.length > 0)  // Remove annotations

    [   // Default preserve files
        'manager',
        'post',
        'server',
        'skin',
        'system',
        'start.bat'
    ]
        .map(dirfy)
        .forEach(x => preserveList.push(x))

    const fileList = await dir('/')
    const removeList = fileList
        .filter(file => preserveList.indexOf(file.name.toLowerCase()) < 0)
    return Promise.all(removeList.map(file => rmrf('/' + file.name)))
}

/**
 * Skin apply callback function
 * @param {String} skinPath 
 */
async function applySkin(skinPath) {
    try {
        await clearRoot()
        await copyDir(skinPath, '/')
    } catch (e) {
        alert('Error occerred while applying skin : ' + e)
    }
}