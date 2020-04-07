import { read, write } from "./os.js";

// Get json manager with asynchronously
export async function config(filePath) {

    // Json object
    var json = await read(filePath)

    // Refresh
    json.update = async function () {
        // Copy non-function element
        var newJson = {}
        for (var propertyName in json) if (!(json[propertyName] instanceof Function)) newJson[propertyName] = json[propertyName]
        // Write new json
        await write(filePath, JSON.stringify(newJson))
    }

    // Key check
    json.containsKey = key => key in json
    return json
}