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

// Copy file
async function copy(src, dst) {
    const data = await read(src);
    return await write(dst, data);
}

// Copy directory
async function copyDir(src, dst) {
    await mkdir(dst)
    const files = dir(src)
    if (src.charAt(src.length - 1) != '/') src += '/'
    if (dst.charAt(dst.length - 1) != '/') dst += '/'
    var list = files.map(file => read(src + file)
        .then(() => {
            // We can read it. therefore it is a file. move to destination directory.
            return write(dst + file)
        }).catch(() => {
            // We cannot read it. therefore it is a directory. recursivly copy.
            return copyDir(src + file, dst + file)
        }))
    return Promise.all(list)
}

// Convert relative path to absolute path
function absolutePath(url) {
    var link = document.createElement("a");
    link.href = url;
    var path = link.pathname;
    return path;
}