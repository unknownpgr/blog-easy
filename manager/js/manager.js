import '../../system/jquery-3.4.1.min.js'
import { dir, read, Path, write, mkdir, each, remove, exists, copyDir, rmrf, copy } from '../../system/os.js'
import { config } from '../../system/config.js';

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
 * Sync meta file.
 * @param {String} directory 
 */
async function syncPostMeta(directory) {
    const metaPath = Path.join(directory, 'meta.json')
    const metaData = await read(metaPath)

    // Fill property
    if (!metaData.tags) metaData.tags = []
    if (!metaData.contentFile) {
        let contentFile;
        (await dir(directory)).map(path => {
            if (path.path.indexOf('content') > 0) contentFile = path.name
        })
        metaData.contentFile = contentFile
    }
    if (typeof metaData.tags == 'string') metaData.tags = metaData.tags.split(',').map(x => x.trim())

    await write(metaPath, JSON.stringify(metaData))
    await copy('/view.html', Path.join(directory, 'view.html'))
    return metaData
}

/**
 * Make a post with given data.
 * @param {String} title 
 * @param {String} content 
 * @param {String} tags 
 */
async function writePost(title, content, tags) {
    if (!title || title.length == 0) throw new Error("Title cannot be empty.")

    const postDir = Path.join('/post', dirfy(title))
    const postExists = await exists(postDir)
    if (postExists.exists) throw new Error('Post with same name alread exists.')

    const contentPath = Path.join(postDir, 'content.txt')
    const metaPath = Path.join(postDir, 'meta.json')
    const metaData = { title: title, date: new Date(), tags: tags, path: postDir }

    await mkdir(postDir)
    await write(metaPath, JSON.stringify(metaData))
    await write(contentPath, content)
    await updatePost()
}

async function updatePost() {
    // Sync post
    const blogConfig = await config('/system/config.json')

    // List of post and tags
    var posts = []
    var tags = []

    await each(dir('/post'), async post => {

        // Remove existing list files
        if (post.isFile) return remove(post.path)
        else {
            // We can modify list here because javascript is thread-safe.

            // Read meta file
            const metaData = await syncPostMeta(post.path)

            // Update post list
            posts.push(metaData)

            // Update tag list. (Although js is thread-safe, we cannot check duplication here.)
            console.log(metaData)
            metaData.tags.forEach(e => tags.push(e))
        }
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
        post.tags.forEach(tag => tagDict[tag.trim()].push(post))
    })
    for (var tag in tagDict) {
        write(`/post/posts_tag_${tag}.json`, JSON.stringify(tagDict[tag]))
    }
}

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
        .filter(line => !line.startsWith('//') && line.length > 0); // Remove annotations

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
        await each(dir('/post'), async post => {
            if (post.isFile) return
            await copy('/view.html', Path.join(post.path, 'view.html'))
        })
        alert('Skin apply success')
    } catch (e) {
        console.log(e)
        alert('Error occerred while applying skin : ' + e)
    }
}

window.applySkin = applySkin;

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
    //  Display skin list
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
                    <button onclick="applySkin('${path.path}')"> Apply this skin </button>
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

        try {
            await writePost(title, content, tags);
            alert('Post successfully posted.')
        }
        catch (e) {
            alert('Post failed: ' + e);
            console.log(e);
        }
    })

    //================================================================
    //  Post sync
    //================================================================

    updatePost()
});