// Promise-fied ajax function
function ajax(url) {
    return new Promise((resolve, reject) => {
        $.ajax(url, {
            success: resolve,
            error: reject
        });
    });
}

// Abstract api function
async function api(apiName, path, content = '') {
    const res = await ajax('/api/' + apiName
        + '?path=' + encodeURIComponent(absolutePath(path))
        + '&content=' + encodeURIComponent(content));
    if (res['status'] == 'error') throw new Error(res['message']);
    else return res['content'];
}

// List directory of given path
function dir(path) {
    return api('dir', path);
}

// Read file from given path
function read(path) {
    // Use XHR instead of api.
    return new Promise((resolve, reject) => {
        $.get(path, resolve);
    });
}

// Write file to given path
function write(path, content) {
    return api('write', path, content);
}

// Read url from given path
function url(path) {
    return api('url', path);
}

// Remove file
function remove(path) {
    return api('remove', path);
}

// Make directory
function mkdir(path) {
    return api('mkdir', path);
}

// Remove directory
function rmdir(path) {
    return api('rmdir', path);
}

// Copy directory
async function copy(src, dst) {
    const data = await api('read', src);
    return await write(dst, data);
}

// Convert relative path to absolute path
function absolutePath(url) {
    var link = document.createElement("a");
    link.href = url;
    var path = link.pathname;
    return path;
}