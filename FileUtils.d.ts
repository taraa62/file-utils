import {Dirent, PathLike, Stats} from "fs";
import {IFindOptions, IFindRes, IReadFile} from "./FileUtilsOptions";
import {Stream} from "stream";

export declare class FileUtils {
    constructor();

    static rmDirRecursive(path: string): Promise<void>;

    static mkDirRecursive(paths: string[]): Promise<string>;

    static statFile(path: string): Promise<Stats>;

    static statFileSync(path: string): Stats

    /**
     *
     * @param path
     * @param isFile - 0 - does it just exist?, 1 - is it a file?, 2 - is it a folder?
     */
    static exist(path: string[], isFile: 0 | 1 | 2): boolean;
    static exist(path: string);

    static resolve(files: string[]): string;

    static forEachFiles(
        map: Map<string, IFindRes>,
        callback: (file: IReadFile) => Promise<void>
    ): Promise<void>;

    static forEachFolders(
        map: Map<string, IFindRes>,
        callback: (file: IFindRes) => Promise<void>
    ): Promise<void>;

    static findFiles(
        path: string,
        options?: IFindOptions
    ): Promise<Map<string, IFindRes>>;

    static findFileDuplicates(
        paths: string[],
        options: IFindOptions,
        checkDuplicateFolder?: boolean
    ): Promise<Map<string, string[]>>

    static read(filePath: PathLike): Promise<string>;

    static readLine(
        file: string,
        callback: (er: Error | null, line: string | null) => void
    ): Promise<void>

    static getName(path: string): string;

    static write(path: string, data: string | string[]): Promise<void>;

    static writeStreamToFile(path: string, stream: Stream): Promise<void>;

    static addPrefixToFileName(file: string, prefix: string): string;

    static writeChunkToFileSync(
        path: string
    ): {
        writeTo?: (str: string | string[], separator?: string) => Error | void;
        writeEnd?: () => Error | void;
        error?: Error;
    }

}
