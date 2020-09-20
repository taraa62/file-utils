import {Stats} from "fs";
import {IFindOptions, IFindRes} from "./FileUtilsOptions";

export declare class FileUtils {
    constructor();

    static resolve(files: string[]): string;

    /**
     *
     * @param path
     * @param isFile - 0 - does it just exist?, 1 - is it a file?, 2 - is it a folder?
     */
    static exist(path: string[], isFile: 0 | 1 | 2): boolean;

    static statFile(path: string): Promise<Stats>;

    static statFileSync(path: string): Stats;

    /**
     * Find files
     */
    static findFiles(path: string, options: IFindOptions): Promise<Map<string, IFindRes>>;
}
