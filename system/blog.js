import { read, exists, Path } from "./os.js";
import './jquery-3.4.1.min.js'

window.myVar = 'ETSE'


// All the variables and functions, do not pollute global scope.

// Blog configuration
let blogConfig;

/**
 * Get list of recent posts from (num) to (num+offset.)
 * For example, if num=3 and offset=2, get 2th, 3th and 4th recent post.
 * @param {Number} offset 
 * @param {Number} num 
 */
async function getPostTimeList(offset, num) {
    const listCount = blogConfig.POST_LIST_COUNT

    // Convert to integer
    offset = offset * 1
    num = num * 1

    // Calculate range
    var startFile = Math.floor(offset / listCount) * listCount
    var endFile = Math.floor((offset + num - 1) / listCount) * listCount
    var startIndex = offset % listCount
    var endIndex = startIndex + num

    // Make list
    try {
        var list = [];
        for (var i = startFile; i <= endFile; i += listCount) {
            const path = `/post/posts_${i}_${i + listCount}.json`
            if (!(await exists(path)).isFile) break
            var json = await read(path)
            if (json) json.forEach(post => list.push(post))
        }

        // Return posts in range
        return list.slice(startIndex, endIndex)
    } catch{
        return []
    }
}

/**
 * Get list of all tags
 */
async function getTagList() {
    return await read('/post/posts_tags.json')
}

$(document).ready(async function () {
    // load blog configuration
    blogConfig = await read('/system/config.json')

    /**
     * Subsitute given stirng, result of function or promise, into selected element.
     * But the funtion is only invoked only when such selector exists.
     * @param {*} selector 
     * @param {*} data 
     */
    async function subTxt(selector, data) {
        var elements = $(selector);
        if (elements.length > 0) {
            elements.each(async (i, element) => {
                if (data instanceof Function) element.innerHTML = await data(element, i)
                else if (data instanceof Promise) element.innerHTML = await data
                else element.innerHTML = data
            })
        }
    }

    /**
     * Get attribute of given element.
     * @param {HTMLElement} element 
     * @param {String} attr 
     * @param {*} defaultValue 
     */
    function getAttr(element, attr, defaultValue = undefined) {
        if (!element.hasAttribute(attr)) return defaultValue
        return element.getAttribute(attr)
    }

    // Universal substitution
    subTxt('.blog_title', blogConfig.title)
    subTxt('.blog_postListTime', async element => {
        var offset = getAttr(element, 'data-offset', 0)
        var num = getAttr(element, 'data-n', 0)

        var innerHTML = ''
        var list = await getPostTimeList(offset, num)
        list.forEach(post => innerHTML += `<li><a href="${post.path}/view.html">${post.title}</a></li>`)
        return innerHTML
    })
    subTxt('.blog_tagList', async elements => {
        var innerHTML = ''
        var list = await getTagList(offset, num)
        list.forEach(tag => innerHTML += `<li><a href="/view/${tag}/view.html">${tag}</a></li>`)
        return innerHTML
    })

    // Post-related subsitution
    const fullPath = new URL(location.href).pathname
    const fileName = fullPath.split(/(\\|\/)/g).pop()
    const postDir = fullPath.replace('view.html', '')
    if (fileName.toLowerCase() == 'view.html') {
        const info = await read(Path.join(postDir, 'meta.json'))

        subTxt('.blog_postTitle', info.title)
        subTxt('.blog_postContent', read('content.txt'))
        subTxt('.blog_postTags', info.tags.reduce((pre, cur) => pre + ',' + cur), '')
        subTxt('.blog_postTime', new Date(info.date))
    }
})