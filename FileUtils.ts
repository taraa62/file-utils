import {IFindOptions, IFindRes} from "./FileUtilsOptions";
import {Dirent, existsSync, promises as fsPromises, Stats, statSync} from 'fs';
import * as _path from "path";
import {ParsedPath} from "path";


type TConsist = {
    start: [string, (0 | 1 | 2)][] | undefined,
    end: [string, (0 | 1 | 2)][] | undefined,
    indexOf: [string, (0 | 1 | 2)][] | undefined,
    equals: [string, (0 | 1 | 2)][] | undefined,
};

export class FileUtils {

    public static resolve(files: string[]): string {
        return _path.resolve(process.cwd(), ...files);
    }

    /**
     *
     * @param path
     * @param isFile - 0 - does it just exist?, 1 - is it a file?, 2 - is it a folder?
     */
    public static exist(path: string[], isFile: 0 | 1 | 2 = 0): boolean {
        const file = _path.resolve(process.cwd(), ...path);
        if (isFile === 0) return existsSync(file);
        const stat = this.statFileSync(file);
        return isFile === 1 ? stat.isFile() : stat.isDirectory();
    }

    public static statFile(path: string): Promise<Stats> {
        path = this.resolve([path]);
        return fsPromises.stat(path)
    }

    public static statFileSync(path: string): Stats {
        path = this.resolve([path]);
        return statSync(path)
    }

    public static async findFiles(path: string, options: IFindOptions = {}): Promise<Map<string, IFindRes>> {
        const result: Map<string, IFindRes> = new Map<string, IFindRes>()
        const root = FileUtils.resolve([path]);
        const stat = await this.statFile(root);
        const rootFolder = _path.parse(root).base;
        if (!stat.isDirectory() || stat.isBlockDevice()) {
            throw new Error('This file has error');
        }
        const isOpt = Object.keys(options).length;


        const getConsistObj = (param: string): TConsist => {
            return {
                start: options[param]?.startsWith ? Object.entries(options[param].startsWith) : undefined,
                end: options[param]?.endsWith ? Object.entries(options[param].endsWith) : undefined,
                indexOf: options[param]?.indexOf ? Object.entries(options[param].indexOf) : undefined,
                equals: options[param]?.equals ? Object.entries(options[param].equals) : undefined,
            }
        }
        const include: TConsist = getConsistObj('includeName');
        const exclude: TConsist = getConsistObj('excludeName');

        const checkConsist = (name: string, type: 2 | 1, conf: TConsist): boolean => {
            const start = conf.start?.find(([key, val]) => val === type ? name.startsWith(key) : false);
            if (start) return true;
            const end = conf.end?.find(([key, val]) => val === type ? name.endsWith(key) : false);
            if (end) return true;
            const index = conf.indexOf?.find(([key, val]) => val === type ? name.indexOf(key) > -1 : false);
            if (index) return true;
            const eq = conf.equals?.find(([key, val]) => val === type ? name === key : false);
            return !!eq
        }
        if (options.extension?.length) options.extension.forEach(((value, index, array) => {
            if (!value.startsWith('.')) array[index] = '.' + value
        }))
        if (options.notExtension?.length) options.notExtension.forEach(((value, index, array) => {
            if (!value.startsWith('.')) array[index] = '.' + value
        }))

        const checkName = (parsedPath: ParsedPath, type: 1 | 2): boolean => {
            let res = true;
            if (typeof options.iFind === "function") {
                return options.iFind(parsedPath, type);
            }
            if (options.notExtension?.length) {
                res = !options.notExtension.find(v => parsedPath.ext === v);
            }
            if (res) {
                if (options.extension?.length) {
                    const exist = options.extension.find(v => parsedPath.ext === v)
                    res = !!exist;
                }
                if (res) {
                    if (options.excludeName) {
                        const exist = (checkConsist(parsedPath.name, type, exclude));
                        res = !exist
                    }
                    if (res && options.includeName) {
                        res = checkConsist(parsedPath.name, type, include);
                    }
                }
            }
            return res;
        }

        const checkFile = (file: Dirent, subPath: string): void => {
            if (result.has(file.name)) return;
            const fullPath = this.resolve([subPath, file.name]);
            if (!isOpt && file.isFile()) {
                result.set(file.name, {path: fullPath});
                return;
            } else {
                if (options.indexOfPath) {
                    if (fullPath.indexOf(options.indexOfPath) < 0)
                        return;
                }
                const info = _path.parse(fullPath);
                const isCluded = checkName(info, file.isDirectory() ? 2 : 1);
                if (isCluded) {
                    if (!options.folderHierarchy) {
                        if (file.isDirectory()) {
                            if (options.isFolderLevel) result.set(file.name, {path: fullPath})
                        } else result.set(file.name, {path: fullPath});
                    } else {
                        const folders = subPath.split(_path.sep);
                        let rootIndex = folders.findIndex(v => v === rootFolder);
                        rootIndex++;
                        let dirInfo = result.get(folders[rootIndex]);
                        if (dirInfo) rootIndex++;
                        for (rootIndex; rootIndex < folders.length; rootIndex++) {
                            if (!dirInfo) {
                                dirInfo = {
                                    path: folders.slice(0, rootIndex).join(_path.sep),
                                    folders: new Map<string, IFindRes>(),
                                    files: [],
                                };
                                result.set(folders[rootIndex], dirInfo);
                            } else {
                                if (!dirInfo.folders!.has(folders[rootIndex])) {
                                    const obj: IFindRes = {
                                        path: folders.slice(0, rootIndex).join(_path.sep),
                                        folders: new Map<string, IFindRes>(),
                                        files: [],
                                    }
                                    dirInfo.folders!.set(folders[rootIndex], obj);
                                    dirInfo = obj;
                                } else {
                                    dirInfo = dirInfo.folders!.get(folders[rootIndex]);
                                }
                            }
                        }
                        if (file.isFile()) {
                            dirInfo?.files.push({
                                name: file.name,
                                path: fullPath
                            })
                        }
                    }
                }
            }
        }
        const readDir = async (path: string) => {
            const files = await fsPromises.readdir(path, {withFileTypes: true});
            for (const file of files) {
                if (file.isDirectory()) {
                    if (options.isFolderLevel) checkFile(file, path);
                    if (options.recursive)
                        await readDir(`${path}/${file.name}`);
                } else if (!options.isFolderLevel) {
                    checkFile(file, path);
                }
            }
        }

        if (root) {
            await readDir(root);
        }
        return result;
    }
}