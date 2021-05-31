import {Dirent, PathLike, Stats} from "fs";
import {ParsedPath} from "path";
import {EFindMethod, FindOptions} from "./FSOptions";
import {Stream} from "stream";

declare class AbstractFind {
    constructor(
        params: string[],
        method: EFindMethod,
        include: boolean);
}

declare class FindExtension extends AbstractFind {
}

declare class FindFileNames extends AbstractFind {
}

declare class FindFolderNames extends AbstractFind {
}


export interface IFindOptions {
    recursive: boolean;
    maxSlave: number; // default = -1 - all child folders
    folderLevel: boolean; //return result only folders

    filterExts: FindExtension[];
    filterNames: FindFileNames[];
    filterFolders: FindFolderNames[];

    filter?: (item: IItemFindFile) => Promise<boolean>;
}

export interface IItemFindFile {
    slave: number;
    parent: string,
    dirent: Dirent;
    fullPath: string;
    parsed: ParsedPath;
    name: string;
}

export interface IFindResult {
    folders: Map<string, IFindResult>;
    files: IItemFindFile[];
    fullPath: string;
    name: string;
}

export interface IGenerateOpt {
    checkExistFile?: boolean;         // if true, there is resolved with process.cwd()
    rootDir?: string;                 // if checkExistFile=true && !rootDir, rootDir=process.cwd()

    type?: 'uuid' | 'date' | 'random' | 'val' // default 'uuid'
    offOriginName?: boolean;          //default false
    tmpVal?: string;

    randLength?: number;              //default 6
    uuidVersion?: 1 | 4;              //default 4

    separator?: string;               //default '_'
    side?: 'r' | 'l';                 // right|left default 'r'
}


declare const FSUtils: {

    rm(path: string, recursive: boolean, maxRetries: number, retryDelay: number): Promise<void>;

    mk(path: string, recursive: boolean): Promise<string | undefined>;

    resolve(files: string[]): string;

    statFile(path: string): Promise<Stats>;

    exist(path: string): boolean;

    find(path: string, options: FindOptions): Promise<Map<string, IFindResult>>;

    foreachFiles(map: Map<string, IFindResult>, callback: (file: IItemFindFile) => void | Promise<void>): Promise<void>;

    foreachFolders(map: Map<string, IFindResult>, callback: (folder: IFindResult) => void | Promise<void>): Promise<void>;

    findFileDuplicates(paths: string[], options: FindOptions, checkDuplicateFolder: boolean): Promise<Map<string, string[]>>

    read(path: PathLike): Promise<string>;

    readLine(
        file: string,
        callback: (er: Error | null, line: string | null) => void
    ): Promise<void>;

    getName(path: string): string;

    addPrefix(file: string, prefix: string): string;

    writeStream(path: string, stream: Stream): Promise<void>;

    writeChunkToFileSync(
        path: string
    ): {
        writeTo?: (str: string | string[], separator?: string) => Error | void;
        writeEnd?: () => Error | void;
        error?: Error;
    };

    randomString(size?: number, source?: string): string;

    getUUID(version?: 1 | 4): string;

    genFileName(fileName: string, opt?: IGenerateOpt): string;

    timeConverter(startTime: number,  endTime?: number): string | number;
};


