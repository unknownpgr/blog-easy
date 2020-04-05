// Promise-fied jquery post function.
// We use the POST method instead of the GET because the GET querystring have length limit.
// Also, by using POST we do not have to manually encode data.
function post(url, params) {
    console.log(params)
    return new Promise((resolve, reject) => $.post(url, params, resolve).fail(reject))
}

// Abstract api function
async function api(apiName, path, content = '') {
    const res = await post('/api/' + apiName, {
        'path': absolutePath(path),
        'content': content
    });
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
    return new Promise((resolve, reject) => $.get(path, resolve).fail(reject));
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
    // Make destination directory
    await mkdir(dst)

    // Get file list
    const files = await dir(src)

    // Copy file
    if (src.charAt(src.length - 1) != '/') src += '/'
    if (dst.charAt(dst.length - 1) != '/') dst += '/'
    var list = files.map(async function (file) {
        const fileName = file['name']
        // If given element is file, just copy it.
        if (file['type'] == 'file') return await copy(src + fileName, dst + fileName)
        // Else, recursivly copy.
        else return await copyDir(src + fileName, dst + fileName)
    })
    // Return the promise.
    return await Promise.all(list)
}

// Convert relative path to absolute path
function absolutePath(url) {
    var link = document.createElement("a");
    link.href = url;
    var path = link.pathname;
    return path;
}