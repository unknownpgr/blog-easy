import { read } from "./os.js";
import './jquery-3.4.1.min.js'

(async () => {
    const blogInfo = await read('/system/config.json')

    // Subsitute given stirng, result of function or promise into selected element
    async function subTxt(selector, data) {
        var tags = $(selector);
        if (tags.length > 0) {
            if (data instanceof Function) tags.text(await data())
            else if (data instanceof Promise) tags.text(await data)
            else tags.text(data)
        }
    }

    subTxt('.blog_title', blogInfo.title)
})()