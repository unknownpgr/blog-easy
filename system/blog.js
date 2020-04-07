import { read } from "./os.js";
import './jquery-3.4.1.min.js'

(async () => {
    // Blog configuration
    const blogConfig = await read('/system/config.json')

    // Subsitute given stirng, result of function or promise into selected element.
    // But do that only when such selector exists.
    async function subTxt(selector, data) {
        var tags = $(selector);
        if (tags.length > 0) {
            if (data instanceof Function) tags.text(await data($(selector)))
            else if (data instanceof Promise) tags.text(await data)
            else tags.text(data)
        }
    }

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
            console.log(offset, num, startFile, endFile)
            for (var i = startFile; i <= endFile; i += listCount) {
                var json = await read(`/post/posts_${i}_${i + listCount}.json`)
                if (json) json.forEach(post => list.push(post))
            }

            // Return posts in range
            return list.slice(startIndex, endIndex)
        } catch{
            return []
        }
    }

    subTxt('.blog_title', blogConfig.title)
    subTxt('.blog_postListTime', async (elements) => {
        elements.each(async (i, element) => {
            element = $(element)
            var offset = element.attr('data-offset')
            offset = offset ? offset : 0
            var num = element.attr('data-n')
            num = num ? num : 0

            var innerHTML = ''
            var list = await getPostTimeList(offset, num)
            list.forEach(post => innerHTML += `<li><a href="${post.path}/view.html">${post.title}</a></li>`)
            element.html(innerHTML)
        })
    })
})()