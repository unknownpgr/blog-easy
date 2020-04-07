import './jquery-3.4.1.min.js'

//================================================================
//  Server independent
//================================================================

// Read file from given path
function read(path) {
    // Use XHR instead of api.
    return new Promise((resolve, reject) => $.get(path, resolve).fail(reject));
}

// Javascript path managing tool
const Path = {
    // Convert relative path to absolute path
    absolute: function (url) {
        var link = document.createElement("a");
        link.href = url;
        var path = link.pathname;
        // Because it uses html element, path is encoded.
        // Therefore, it shuld be decoded.
        path = decodeURIComponent(path)
        return path;
    },

    // Join given paths. do not care relative path
    join: function () {
        var args = []
        for (var i = 0; i < arguments.length; i++)args.push(arguments[i])
        return args.join('/').replace(/\/+/g, '/')
    }
}

//================================================================
//  Server dependent private
//================================================================

// Promise-fied jquery post function.
// We use the POST method instead of the GET because the GET querystring have length limit.
// Also, by using POST we do not have to manually encode data.
function post(url, params) {
    return new Promise((resolve, reject) => $.post(url, params, resolve).fail(reject))
}

// Abstract api function
async function api(apiName, path, content = '') {
    const res = await post('/api/' + apiName, {
        'path': Path.absolute(path),
        'content': content
    });
    console.log(res)
    if (res.status == 'error') throw new Error(res.message);
    else return res.content;
}

//================================================================
//  Server dependent public
//================================================================

// List directory of given path
async function dir(path) {
    const files = await api('dir', path);
    return files.map(file => {
        file.isFile = file.type == 'file';
        file.isDirectory = !file.isFile;
        file.path = Path.join(path, file.name)
        return file
    });
}

// Write file to given path
function write(path, content) {
    return api('write', path, content + '');
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
    var list = files.map(async function (file) {
        const dstPath = Path.join(dst, file.name)
        // If given element is file, just copy it.
        if (file.isFile) return await copy(file.path, dstPath)
        // Else, recursivly copy.
        else return await copyDir(file.path, dstPath)
    })
    // Return the promise.
    return await Promise.all(list)
}

// Recursivly remove file and directory.
async function rmrf(path) {
    // Try to remove as file
    try { return await remove(path) }
    catch {
        // Try to remove as directory
        try { return await rmdir(path) }
        catch {
            // Recursivly remove
            const files = await dir(path);
            await Promise.all(files.map(file => rmrf(file.path)));
            return await rmdir(path);
        }
    }
}

// Export all
export { dir, read, write, url, remove, mkdir, rmdir, copy, copyDir, rmrf, Path }