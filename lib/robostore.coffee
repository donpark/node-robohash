Log = require('log')
log = new Log Log.DEBUG

FS = require('fs')
Path = require('path')

randomIndex = (array) -> (Math.random() * 10000 | 0) % array.length

class Robostore
    constructor: (@baseDir) ->
        @parts = {}
        # robostore base directory should have part-type specific subdirectories
        subdirs = FS.readdirSync @baseDir
        for partType in subdirs
            partDir = Path.join @baseDir, partType
            if FS.statSync(partDir).isDirectory()
                @parts[partType] = FS.readdirSync partDir
        # log.debug "#{JSON.stringify @parts}"
    
    namedPart: (type, name) -> Path.join @baseDir, type, name

    indexedPart: (type, index) -> Path.join @baseDir, type, @parts[type][index]
        
    randomPart: (type) -> this.indexedPart type, randomIndex(@parts[type])    

# findFiles = (dir, pattern) ->
#     result = []
#     files = FS.readdirSync dir
#     for file in files
#         result.push file if file.match pattern
#     result

exports.getStorage = (path) -> new Robostore(path)
