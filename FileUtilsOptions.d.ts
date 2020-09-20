import {ParsedPath} from "path";

export interface IFindOptions {
    recursive?: boolean;
    isFolderLevel?: boolean; // for the key and the value will be for the folder
    extension?: string[];
    notExtension?: string[];
    folderHierarchy?: boolean;
    includeName?: IFilterConsist;
    excludeName?: IFilterConsist;
    indexOfPath?: string;
    iFind?: (parsedPath: ParsedPath, type: 1 | 2) => boolean;
}

export interface IFilterConsist {
    startsWith?: IFilterNameFile;
    endsWith?: IFilterNameFile;
    equals?: IFilterNameFile;
    indexOf?: IFilterNameFile;
}

export interface IFilterNameFile {
    [name: string]: 0 | 1 | 2
}

export interface IFindRes {
    path: string;
    folders?: Map<string, IFindRes>;
    files?: IReadFile[];
}

export interface IReadFile {
    name: string;
    path: string;
}

