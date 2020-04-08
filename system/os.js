import './jquery-3.4.1.min.js'

//================================================================
//  Server independent
//================================================================

/**
 * Read any type of file from given path
 * @param {String} path 
 */
function read(path) {
    // Use XHR instead of api.
    return new Promise((resolve, reject) => $.get(path, resolve).fail(reject));
}

/**
 * Apply asyncCallback for all element in return of listPromise.
 * Return Promise.all
 * @param {Promise} listPromise 
 * @param {Function} asyncCallback 
 */
async function each(listPromise, asyncCallback) {
    const list = await listPromise;
    return await Promise.all(list.map(asyncCallback));
}

/**
 * Javascript path managing tool
 */
const Path = {

    /**
     * Convert relative path to absolute path
     * @param {String} url 
     */
    absolute: function (url) {
        var link = document.createElement("a");
        link.href = url;
        var path = link.pathname;
        // Because it uses html element, path is encoded.
        // Therefore, it shuld be decoded.
        path = decodeURIComponent(path)
        return path;
    },

    /**
     * Join given paths. do not care relative path
     */
    join: function () {
        var args = []
        for (var i = 0; i < arguments.length; i++)args.push(arguments[i])
        return args.join('/').replace(/\/+/g, '/')
    }
}

//================================================================
//  Server dependent private
//================================================================

/**
 * Promise-fied jquery post function.
 * We use the POST method instead of the GET because the GET querystring have length limit.
 * Also, by using POST we do not have to manually encode data.
 * @param {String} url 
 * @param {*} params 
 */
function post(url, params) {
    return new Promise((resolve, reject) => $.post(url, params, resolve).fail(reject))
}

/**
 * Abstract api function
 * @param {String} apiName 
 * @param {String} path 
 * @param {*} content 
 */
async function api(apiName, path, content = '') {
    const res = await post('/api/' + apiName, {
        'path': Path.absolute(path),
        'content': content
    });
    // console.log(apiName, path, content, res)
    if (res.status == 'error') throw new Error(res.message);
    else return res.content;
}

//================================================================
//  Server dependent public
//================================================================

/**
 * List directory of given path.
 * Return dictionary of {name,path,isFile,isDir}
 * @param {String} path 
 */
async function dir(path) {
    const files = await api('dir', path);
    return files.map(file => {
        file.isFile = file.type == 'file';
        file.isDirectory = !file.isFile;
        file.path = Path.join(path, file.name)
        return file
    });
}

/**
 * Write file to given path.
 * If file already exists, override.
 * @param {String} path 
 * @param {*} content 
 */
function write(path, content) {
    return api('write', path, content + '');
}


/**
 * Read url from given path
 * @param {String} path 
 */
function url(path) {
    return api('url', path);
}

/**
 * Remove file
 * @param {String} path 
 */
function remove(path) {
    return api('remove', path);
}

/**
 * Make directory
 * @param {String} path 
 */
function mkdir(path) {
    return api('mkdir', path);
}

/**
 * Remove directory
 * @param {String} path 
 */
function rmdir(path) {
    return api('rmdir', path);
}

/**
 * Copy file
 * @param {String} src 
 * @param {String} dst 
 */
async function copy(src, dst) {
    const data = await read(src);
    return await write(dst, data);
}

/**
 * Copy directory
 * @param {String} src 
 * @param {String} dst 
 */
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

/**
 * Recursivly remove file and directory.
 * @param {String} path 
 */
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

/**
 * Check if given file exists.
 * Returns promise that returns dictionary of {exists, isFile,isDirectory}.
 * Directory existence check is only available when server is opened.
 * @param {String} path 
 */
function exists(path) {
    return new Promise((res, rej) => {
        $.ajax({
            url: path,
            type: 'HEAD',
            error: () => rej(),
            success: () => res({
                isFile: true,
                isDirectory: false,
                exist: true
            })
        });
    })
        .catch(() => api('exists', path))
        .catch(() => {
            return {
                isFile: false,
                isDirectory: false,
                exist: false
            }
        })
}

// Export all
export { exists, each, dir, read, write, url, remove, mkdir, rmdir, copy, copyDir, rmrf, Path }