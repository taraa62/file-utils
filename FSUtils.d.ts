import {Dirent, PathLike, Stats} from "fs";
import {ParsedPath} from "path";
import {FindOptions} from "./FSOptions";
import {Stream} from "stream";

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

declare const FSUtils:{

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
    }
};


