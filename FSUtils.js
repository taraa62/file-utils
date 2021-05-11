"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSUtils = void 0;
const FSOptions_1 = require("./FSOptions");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const readline_1 = __importDefault(require("readline"));
class FSUtils {
    static rm(path, recursive = false, maxRetries = 5, retryDelay = 100) {
        path = this.resolve([path]);
        return fs_1.promises.rmdir(path, { maxRetries, recursive, retryDelay });
    }
    static mk(path, recursive = false) {
        path = this.resolve([path]);
        return fs_1.promises.mkdir(path, { recursive });
    }
    static resolve(files) {
        return path.resolve(process.cwd(), ...files);
    }
    static statFile(path) {
        path = this.resolve([path]);
        return fs_1.promises.stat(path);
    }
    static exist(path) {
        return fs_1.existsSync(path);
    }
    static async find(path, options) {
        const result = new Map();
        if (!(options instanceof FSOptions_1.FindOptions)) {
            options = Object.assign(new FSOptions_1.FindOptions(), options);
        }
        options.check();
        const root = FSUtils.resolve([path]);
        const max = options.maxSlave < 0 ? Number.MAX_VALUE : options.maxSlave;
        if (root) {
            const getItem = (dirent, currPath, slave) => {
                var _a;
                const full = (_a = FSUtils.path.resolve(currPath, dirent.name)) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                const parsed = FSUtils.path.parse(full);
                return {
                    slave, dirent, parsed,
                    parent: currPath,
                    fullPath: full,
                    name: dirent.name.toLowerCase(),
                };
            };
            const addResult = (item) => {
                const folders = item.parsed.dir.split(FSUtils.path.sep) || [];
                if (folders.length) {
                    folders.shift();
                }
                let dir, cDir = undefined;
                dir = cDir = result.get(folders[0]);
                if (cDir)
                    folders.shift();
                for (let folder of folders) {
                    if (dir)
                        cDir = dir.folders.get(folder);
                    if (!cDir) {
                        cDir = {
                            name: folder, fullPath: item.parent,
                            folders: new Map(), files: []
                        };
                        if (dir) {
                            dir.folders.set(folder, cDir);
                        }
                        else {
                            result.set(folder, cDir);
                        }
                        dir = cDir;
                    }
                    else {
                        dir = cDir;
                    }
                }
                if (dir && item.dirent.isFile() && !options.folderLevel) {
                    dir.files.push(item);
                }
            };
            const checkPath = async (item) => {
                let isAdd = true;
                if (options.folderLevel) {
                    if (options.filterFolders.length && item.dirent.isDirectory()) {
                        isAdd = FSOptions_1.FindFolderNames.checkFoldersName(options.filterFolders, item);
                    }
                }
                else {
                    if (options.filterExts.length) {
                        isAdd = FSOptions_1.FindExtension.checkExtensions(options.filterExts, item);
                    }
                    if (isAdd) {
                        if (options.filterNames.length && item.dirent.isFile()) {
                            isAdd = FSOptions_1.FindFileNames.checkFileName(options.filterNames, item);
                        }
                    }
                    if (isAdd) {
                        if (options.filterFolders.length && item.dirent.isDirectory()) {
                            isAdd = FSOptions_1.FindFolderNames.checkFoldersName(options.filterFolders, item);
                        }
                    }
                    if (isAdd && options.filter) {
                        isAdd = await options.filter(item);
                    }
                }
                if (isAdd) {
                    addResult(item);
                }
            };
            const readFiles = async (currPath, slave) => {
                if (slave > max)
                    return;
                const files = await fs_1.promises.readdir(currPath, { withFileTypes: true });
                for (const dirent of files) {
                    const item = getItem(dirent, currPath, slave);
                    if (dirent.isFile() || dirent.isSymbolicLink()) {
                        await checkPath(item);
                    }
                    else {
                        if (dirent.isDirectory()) {
                            const checkFolder = FSOptions_1.FindFolderNames.checkFoldersName(options.filterFolders, item, true);
                            const next = options.filter ? checkFolder && await options.filter(item) : checkFolder;
                            if (next) {
                                if (options.recursive) {
                                    await readFiles(`${currPath}${FSUtils.path.sep}${dirent.name}`, slave + 1);
                                }
                                else {
                                    await checkPath(item);
                                }
                            }
                        }
                        else {
                            console.error(dirent);
                        }
                    }
                }
            };
            await readFiles(root, 0);
            options.postEnd();
            const folders = root.toLowerCase().split(FSUtils.path.sep).filter(v => v);
            if (folders.length) {
                let dir = result.get(folders[0]);
                if (dir) {
                    folders.shift();
                    for (let folder of folders) {
                        dir = dir.folders.get(folder);
                        if (!dir) {
                            return result;
                        }
                    }
                    if (dir) {
                        return new Map().set(dir.name, dir);
                    }
                }
            }
        }
        return result;
    }
    static async foreachFiles(map, callback) {
        if (!callback || !map)
            return;
        const check = async (item) => {
            if (item.files.length) {
                for (const file of item.files) {
                    await callback(file);
                }
            }
            if (item.folders.size) {
                for (const folder of item.folders.values()) {
                    await check(folder);
                }
            }
        };
        for (const [, folder] of map.entries()) {
            await check(folder);
        }
    }
    static async foreachFolders(map, callback) {
        if (!callback || !map)
            return;
        const check = async (item) => {
            await callback(item);
            if (item.folders) {
                for (const folder of item.folders.values()) {
                    await check(folder);
                }
            }
        };
        for (const folder of map.values()) {
            await check(folder);
        }
    }
    static async findFileDuplicates(paths, options, checkDuplicateFolder = false) {
        const map = new Map();
        const duplicate = new Map();
        const checkDuplicate = (name, path) => {
            if (!map.has(name)) {
                map.set(name, path);
            }
            else {
                if (!duplicate.has(name)) {
                    duplicate.set(name, [map.get(name)]);
                }
                duplicate.get(name).push(path);
            }
        };
        const checkPath = (folders) => {
            const check = (key, item) => {
                if (checkDuplicateFolder) {
                    checkDuplicate(key, item.fullPath);
                }
                if (item.files && !checkDuplicateFolder) {
                    for (const file of item.files) {
                        checkDuplicate(file.name, file.fullPath);
                    }
                }
                if (item.folders) {
                    // @ts-ignore
                    for (const folder of item.folders.values()) {
                        check(folder.name, folder);
                    }
                }
            };
            // @ts-ignore
            for (const [key, folder] of folders.entries()) {
                check(key, folder);
            }
        };
        for (const path of paths) {
            checkPath(await this.find(path, options));
        }
        return duplicate;
    }
    static read(path) {
        return fs_1.promises.readFile(path).then(v => v.toString());
    }
    static async readLine(file, callback) {
        if (callback) {
            const fileStream = fs_1.createReadStream(file);
            try {
                const rl = readline_1.default.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity,
                });
                for await (const line of rl) {
                    callback(null, line);
                }
            }
            catch (er) {
                callback(er, null);
            }
            finally {
                await fileStream.close();
                callback(null, null);
            }
        }
    }
    static getName(path) {
        return this.path.parse(path).name;
    }
    static addPrefix(file, prefix) {
        const parse = path.parse(file);
        const name = prefix + parse.base;
        return path.resolve(parse.dir, name);
    }
    static writeStream(path, stream) {
        return new Promise((res, rej) => {
            const writeable = fs_1.createWriteStream(path);
            writeable.on('error', rej);
            writeable.on('end', res);
            writeable.on('close', res);
            stream.pipe(writeable);
        });
    }
    static writeChunkToFileSync(path) {
        try {
            const fd = fs_1.openSync(path, 'a');
            const writeTo = (str, separator) => {
                try {
                    if (str instanceof Array) {
                        str = str.join(separator || '');
                    }
                    fs_1.appendFileSync(fd, str);
                }
                catch (error) {
                    return error;
                }
            };
            const writeEnd = () => {
                try {
                    fs_1.closeSync(fd);
                }
                catch (error) {
                    return error;
                }
            };
            if (!writeTo || !writeEnd) {
                return { error: new Error('Error opened file') };
            }
            return { writeTo, writeEnd };
        }
        catch (error) {
            return { error };
        }
    }
}
exports.FSUtils = FSUtils;
FSUtils.path = path;
