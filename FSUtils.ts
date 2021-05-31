import {FindExtension, FindFileNames, FindFolderNames, FindOptions} from "./FSOptions";
import {IFindResult, IGenerateOpt, IItemFindFile} from './FSUtils.d'
import * as path from 'path';
import {
    appendFileSync,
    closeSync,
    createReadStream,
    createWriteStream,
    Dirent,
    existsSync,
    openSync,
    PathLike,
    promises as fsPromises,
    Stats
} from "fs";
import {Stream} from "stream";
import readline from "readline";
import * as uuid from 'uuid';


export class FSUtils {
    public static path = path;

    private static readonly symb: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    public static randomString(size: number = 7, source: string = FSUtils.symb): string {
        let text = '';
        for (let i = 0; i < size; i++)
            text += source.charAt(Math.floor(Math.random() * source.length));

        return text;
    }

    public static rm(path: string, recursive = false, maxRetries = 5, retryDelay = 100): Promise<void> {
        path = this.resolve([path]);
        return fsPromises.rmdir(path, {maxRetries, recursive, retryDelay})
    }

    public static mk(path: string, recursive = false): Promise<string | undefined> {
        path = this.resolve([path]);
        return fsPromises.mkdir(path, {recursive});
    }

    public static resolve(files: string[]): string {
        return path.resolve(process.cwd(), ...files);
    }

    public static statFile(path: string): Promise<Stats> {
        path = this.resolve([path]);
        return fsPromises.stat(path)
    }

    public static exist(path: string): boolean {
        return existsSync(path);
    }

    public static async foreachFiles(
        map: Map<string, IFindResult>,
        callback: (file: IItemFindFile) => void | Promise<void>
    ): Promise<void> {
        if (!callback || !map) return;
        const check = async (item: IFindResult) => {
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

    public static async foreachFolders(
        map: Map<string, IFindResult>,
        callback: (folder: IFindResult) => void | Promise<void>
    ): Promise<void> {
        if (!callback || !map) return;
        const check = async (item: IFindResult) => {
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

    public static async findFileDuplicates(
        paths: string[],
        options: FindOptions,
        checkDuplicateFolder = false
    ): Promise<Map<string, string[]>> {
        const map: Map<string, string> = new Map<string, string>();
        const duplicate: Map<string, string[]> = new Map<string, string[]>();

        const checkDuplicate = (name: string, path: string) => {
            if (!map.has(name)) {
                map.set(name, path);
            } else {
                if (!duplicate.has(name)) {
                    duplicate.set(name, [map.get(name)!]);
                }
                duplicate.get(name)!.push(path);
            }
        };
        const checkPath = (folders: Map<string, IFindResult>) => {
            const check = (key: string, item: IFindResult) => {
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

    public static read(path: PathLike): Promise<string> {
        return fsPromises.readFile(path).then(v => v.toString());
    }

    public static async readLine(
        file: string,
        callback: (er: Error | null, line: string | null) => void
    ): Promise<void> {
        if (callback) {
            const fileStream = createReadStream(file);
            try {
                const rl = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity,
                });
                for await (const line of rl) {
                    callback(null, line);
                }
            } catch (er) {
                callback(er, null);
            } finally {
                await fileStream.close();
                callback(null, null);
            }
        }
    }

    public static getName(path: string): string {
        return this.path.parse(path).name;
    }

    public static addPrefix(file: string, prefix: string): string {
        const parse = path.parse(file);
        const name = prefix + parse.base;
        return path.resolve(parse.dir, name);
    }

    public static writeStream(path: string, stream: Stream): Promise<void> {
        return new Promise((res, rej) => {
            const writeable = createWriteStream(path);
            writeable.on('error', rej);
            writeable.on('end', res);
            writeable.on('close', res);
            stream.pipe(writeable);
        });
    }

    public static writeChunkToFileSync(
        path: string
    ): {
        writeTo?: (str: string | string[], separator?: string) => Error | void;
        writeEnd?: () => Error | void;
        error?: Error;
    } {
        try {
            const fd = openSync(path, 'a');
            const writeTo = (str: string | string[], separator?: string) => {
                try {
                    if (str instanceof Array) {
                        str = str.join(separator || '');
                    }
                    appendFileSync(fd, str);
                } catch (error) {
                    return error;
                }
            };
            const writeEnd = (): Error | void => {
                try {
                    closeSync(fd);
                } catch (error) {
                    return error;
                }
            };
            if (!writeTo || !writeEnd) {
                return {error: new Error('Error opened file')};
            }
            return {writeTo, writeEnd};
        } catch (error) {
            return {error};
        }
    }

    public static async find(
        path: string,
        options: FindOptions
    ): Promise<Map<string, IFindResult>> {
        const result: Map<string, IFindResult> = new Map<string, IFindResult>();

        if (!(options instanceof FindOptions)) {
            options = Object.assign(new FindOptions(), options);
        }
        options.check();

        const root = FSUtils.resolve([path]);
        const max = options.maxSlave < 0 ? Number.MAX_VALUE : options.maxSlave;
        if (root) {
            const getItem = (dirent: Dirent, currPath: string, slave: number): IItemFindFile => {
                const full = FSUtils.path.resolve(currPath, dirent.name);
                const parsed = FSUtils.path.parse(full);

                return <IItemFindFile>{
                    slave, dirent, parsed,
                    parent: currPath,
                    fullPath: full,
                    name: dirent.name,
                }
            }

            const addResult = (item: IItemFindFile) => {
                const folders = item.parsed.dir.split(FSUtils.path.sep) || [];
                if (folders.length) {
                    folders.shift()
                }
                let dir, cDir: IFindResult | undefined;
                dir = cDir = result.get(folders[0]);
                if (cDir) folders.shift();
                for (let folder of folders) {
                    if (dir) cDir = dir.folders.get(folder);
                    if (!cDir) {
                        cDir = {
                            name: folder, fullPath: item.parent,
                            folders: new Map(), files: []
                        }
                        if (dir) {
                            dir.folders.set(folder, cDir);
                        } else {
                            result.set(folder, cDir);
                        }
                        dir = cDir;
                    } else {
                        dir = cDir;
                    }
                }
                if (dir && item.dirent.isFile() && !options.folderLevel) {
                    dir.files!.push(item)
                }
            }
            const checkPath = async (item: IItemFindFile) => {
                let isAdd = true;
                if (options.folderLevel) {
                    if (options.filterFolders.length && item.dirent.isDirectory()) {
                        isAdd = FindFolderNames.checkFoldersName(options.filterFolders, item);
                    }
                } else {
                    if (options.filterExts.length) {
                        isAdd = FindExtension.checkExtensions(options.filterExts, item);
                    }
                    if (isAdd) {
                        if (options.filterNames.length && item.dirent.isFile()) {
                            isAdd = FindFileNames.checkFileName(options.filterNames, item)
                        }
                    }
                    if (isAdd) {
                        if (options.filterFolders.length && item.dirent.isDirectory()) {
                            isAdd = FindFolderNames.checkFoldersName(options.filterFolders, item);
                        }
                    }
                    if (isAdd && options.filter) {
                        isAdd = await options.filter(item);
                    }
                }
                if (isAdd) {
                    addResult(item);
                }
            }
            const readFiles = async (currPath: string, slave: number) => {
                if (slave > max) return;

                const files = await fsPromises.readdir(currPath, {withFileTypes: true});
                for (const dirent of files) {
                    const item = getItem(dirent, currPath, slave);
                    if (dirent.isFile() || dirent.isSymbolicLink()) {
                        await checkPath(item);
                    } else {
                        if (dirent.isDirectory()) {
                            const checkFolder = FindFolderNames.checkFoldersName(options.filterFolders, item, true);
                            const next = options.filter ? checkFolder && await options.filter(item) : checkFolder;
                            if (next) {
                                if (options.recursive) {
                                    await readFiles(`${currPath}${FSUtils.path.sep}${dirent.name}`, slave + 1);
                                } else {
                                    await checkPath(item);
                                }
                            }
                        } else {
                            console.error(dirent);
                        }
                    }
                }
            }

            await readFiles(root, 0);
            options.postEnd();

            const folders = root.split(FSUtils.path.sep).filter(v => v);
            if (folders.length) {
                let dir = result.get(folders[0]);
                if (dir) {
                    folders.shift();
                    for (let folder of folders) {
                        dir = dir!.folders.get(folder);
                        if (!dir) {
                            return result;
                        }
                    }
                    if (dir) {
                        return new Map<string, IFindResult>().set(dir!.name, dir!);
                    }
                }
            }
        }
        return result;
    }

    public static getUUID(version: 1 | 4 = 4): string {
        // @ts-ignore
        return uuid[`v${version}`]();
    }

    public static genFileName(fileName: string, opt: IGenerateOpt = {}): string {
        let path;
        opt = opt ?? {};
        opt.separator = opt.separator ?? '_';
        opt.side = opt.side ?? 'r';


        const getName = (): string => {
            let subName: string;
            switch (opt.type) {
                case "uuid":
                    subName = FSUtils.getUUID(opt.uuidVersion || 4);
                    break;
                case "val":
                    subName = opt.tmpVal || 'tmp'
                    break;
                case "date":
                    subName = new Date().toISOString();
                    break;
                default: {
                    subName = FSUtils.randomString(opt.randLength || 6);
                }
            }

            return opt.side === "r" ?
                `${opt.offOriginName ? '' : fileName}${opt.offOriginName ? '' : opt.separator}${subName}`
                : `${subName}${opt.offOriginName ? '' : opt.separator}${opt.offOriginName ? '' : fileName}`
        }
        if (!opt.checkExistFile) {
            return getName();
        }
        opt.rootDir = FSUtils.resolve([opt.rootDir || '']);
        while (!path) {
            const tmp = FSUtils.resolve([opt.rootDir, getName()]);
            if (!FSUtils.exist(tmp) || opt.tmpVal) {
                path = tmp;
            }
        }
        return path;
    }

    public static timeConverter(
        startTime: number,
        endTime: number = Date.now()
    ): string | number {
        if (startTime > endTime) {
            [startTime, endTime] = [endTime, startTime];
        }
        const time = new Date(endTime - startTime);
        time.setMinutes(time.getMinutes() + time.getTimezoneOffset());

        let res: string | number = '';
        const add = (param: number, field: string) => {
            if (param || param > 0) {
                res += (res ? ' ' : '') + `${param}${field}`;
            }
        };
        add(time.getHours(), 'h');
        add(time.getMinutes(), 'm');
        add(time.getSeconds(), 's');
        add(time.getMilliseconds(), 'ms');
        return res;
    }
}
