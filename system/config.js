import { read, write } from "./os.js";

// Get json manager with asynchronously
export async function config(filePath) {
    // Private json
    var json = await read(filePath)

    // Manager object
    var manager = {}
    for (var varName in json) {
        // Register getter/setter
        manager['set_' + varName] = async function (value) {
            json[varName] = value
            await write(filePath, JSON.stringify(json))
        }
        manager['get_' + varName] = () => json[varName]
    }
    return manager
}

// Get json manager synchronous
export function configSync(filePath) {
    // Manager object
    var manager = {}

    // Private json
    read(filePath)
        .then(json => {
            for (var varName in json) {
                // Register getter/setter
                manager['set_' + varName] = async function (value) {
                    json[varName] = value
                    await write(JSON.stringify(filePath), json)
                }
                manager['get_' + varName] = () => json[varName]
            }

        })
    return manager
}