import {IFilterConsist, IFilterNameFile, IFindOptions, IFindRes} from "./FileUtilsOptions";
import {Dirent, existsSync, promises as fsPromises, Stats, statSync} from 'fs';
import * as path from 'path';


type TConsist = {
    start: [string, (0 | 1 | 2)][] | undefined,
    end: [string, (0 | 1 | 2)][] | undefined,
    indexOf: [string, (0 | 1 | 2)][] | undefined,
    equals: [string, (0 | 1 | 2)][] | undefined,
};

export class FileUtils {
    public static path = path;

    public static resolve(files: string[]): string {
        return path.resolve(process.cwd(), ...files);
    }

    /**
     *
     * @param path
     * @param isFile - 0 - does it just exist?, 1 - is it a file?, 2 - is it a folder?
     */
    public static exist(path: string[], isFile: 0 | 1 | 2 = 0): boolean {
        const file = this.path.resolve(process.cwd(), ...path);
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


    public static async findFiles(
        path: string,
        options: IFindOptions = {}
    ): Promise<Map<string, IFindRes>> {
        const result: Map<string, IFindRes> = new Map<string, IFindRes>();
        const root = FileUtils.resolve([path]);
        const stat = await this.statFile(root);
        const rootFolder = this.path.parse(root).base;
        if (!stat.isDirectory() || stat.isBlockDevice()) {
            throw new Error('This file has error');
        }
        const isOpt = Object.keys(options).length;

        const getConsistObj = (param: string): TConsist => {
            const getEntries = (p: keyof IFilterConsist) => {
                return (options[param as keyof IFindOptions] as IFilterConsist)?.[p]
                    ? Object.entries(
                        (options[param as keyof IFindOptions] as IFilterConsist)[
                            p
                            ] as IFilterNameFile
                    )
                    : undefined;
            };

            return {
                start: getEntries('startsWith'),
                end: getEntries('endsWith'),
                indexOf: getEntries('indexOf'),
                equals: getEntries('equals'),
            };
        };
        const include: TConsist = getConsistObj('includeName');
        const exclude: TConsist = getConsistObj('excludeName');

        const checkConsist = (
            name: string,
            type: 2 | 1,
            conf: TConsist
        ): undefined | boolean => {
            let res = conf.start?.find(([key, val]) =>
                val === type ? name.startsWith(key) : false
            );
            if (res !== undefined) return !!res;
            res = conf.end?.find(([key, val]) =>
                val === type ? name.endsWith(key) : false
            );
            if (res !== undefined) return !!res;
            res = conf.indexOf?.find(([key, val]) =>
                val === type ? name.indexOf(key) > -1 : false
            );
            if (res !== undefined) return !!res;
            res = conf.equals?.find(([key, val]) =>
                val === type ? name === key : false
            );
            return res !== undefined ? !!res : undefined;
        };
        if (options.extension?.length) {
            options.extension.forEach((value, index, array) => {
                if (!value.startsWith('.')) array[index] = '.' + value;
            });
        }
        if (options.notExtension?.length) {
            options.notExtension.forEach((value, index, array) => {
                if (!value.startsWith('.')) array[index] = '.' + value;
            });
        }
        const checkName = (parsedPath: path.ParsedPath, type: 1 | 2): boolean => {
            let res = true;
            if (typeof options.iFind === 'function') {
                return options.iFind(parsedPath, type);
            }
            if (options.notExtension?.length) {
                res = !options.notExtension.find(v => parsedPath.ext === v);
            }
            if (res) {
                if (options.extension?.length) {
                    const exist = options.extension.find(v => parsedPath.ext === v);
                    res = !!exist;
                }
                if (res) {
                    if (options.excludeName) {
                        const exc = checkConsist(parsedPath.name, type, exclude);
                        res = exc !== undefined ? !exc : res;
                    }
                    if (res && options.includeName) {
                        const incl = checkConsist(parsedPath.name, type, include);
                        res = incl !== undefined ? incl : true;
                    }
                }
            }
            return res;
        };

        const checkFile = (file: Dirent, subPath: string): void => {
            if (result.has(file.name)) return;
            const fullPath = this.resolve([subPath, file.name]);
            if (!isOpt && file.isFile()) {
                result.set(file.name, { path: fullPath });
                return;
            } else {
                if (options.indexOfPath) {
                    if (fullPath.indexOf(options.indexOfPath) < 0) return;
                }
                const info = this.path.parse(fullPath);
                const isCluded = checkName(info, file.isDirectory() ? 2 : 1);
                if (isCluded) {
                    if (!options.folderHierarchy) {
                        if (file.isDirectory()) {
                            if (options.isFolderLevel) {
                                result.set(file.name, { path: fullPath });
                            }
                        } else result.set(file.name, { path: fullPath });
                    } else {
                        const folders = subPath.split(this.path.sep);

                        if (options.inFolders?.length) {
                            let isFind = false;
                            for (const folder of options.inFolders) {
                                if (folders.includes(folder)) {
                                    isFind = true;
                                    break;
                                }
                            }
                            if (!isFind) return;
                        }
                        let rootIndex = folders.findIndex(v => v === rootFolder);
                        rootIndex++;
                        let dirInfo = result.get(folders[rootIndex]);
                        if (dirInfo) rootIndex++;
                        for (rootIndex; rootIndex < folders.length; rootIndex++) {
                            if (!dirInfo) {
                                dirInfo = {
                                    path: folders.slice(0, rootIndex).join(this.path.sep),
                                    folders: new Map<string, IFindRes>(),
                                    files: [],
                                };
                                result.set(folders[rootIndex], dirInfo);
                            } else {
                                if (!dirInfo.folders!.has(folders[rootIndex])) {
                                    const obj: IFindRes = {
                                        path: folders.slice(0, rootIndex).join(this.path.sep),
                                        folders: new Map<string, IFindRes>(),
                                        files: [],
                                    };
                                    dirInfo.folders!.set(folders[rootIndex], obj);
                                    dirInfo = obj;
                                } else {
                                    dirInfo = dirInfo.folders!.get(folders[rootIndex]);
                                }
                            }
                        }
                        if (file.isFile()) {
                            dirInfo?.files?.push({
                                name: file.name,
                                path: fullPath,
                            });
                        }
                    }
                }
            }
        };
        const readDir = async (path: string) => {
            const files = await fsPromises.readdir(path, { withFileTypes: true });
            for (const file of files) {
                if (file.isDirectory()) {
                    if (options.isFolderLevel) checkFile(file, path);
                    if (
                        options.recursive ||
                        checkConsist(file.name, file.isDirectory() ? 2 : 1, include) ||
                        options?.inFolders?.includes(file.name)
                    ) {
                        await readDir(`${path}/${file.name}`);
                    }
                } else if (!options.isFolderLevel) {
                    checkFile(file, path);
                }
            }
        };

        if (root) {
            await readDir(root);
        }
        return result;
    }
}
