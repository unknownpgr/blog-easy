// Promise-fied ajax function
function ajax(url) {
    return new Promise((resolve, reject) => {
        $.ajax(url, {
            success: resolve,
            error: reject
        })
    })
}

// Abstract api function
function api(apiName, path, content = '') {
    return ajax('/api/' + apiName
        + '?path=' + encodeURIComponent(path)
        + '&content=' + encodeURIComponent(content))
}

// List directory of given path
function dir(path) {
    return api('dir', path)
}

// Read file from given path
function read(path) {
    return api('read', path)
}

// Write file to given path
function write(path, content) {
    return api('write', path, content)
}

// Read url from given path
function url(path) {
    return api('url', path)
}

// Remove file
function remove(path) {
    return api('remove', path)
}