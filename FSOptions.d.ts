import {IItemFindFile} from "./FSUtils.d";

declare enum EFindMethod {
    startsWith = 'startsWith',
    endsWith = 'endsWith',
    equals = 'equals',
    indexOf = 'indexOf',
    match = 'match'
}

declare class FindExtension {
    constructor(params: string[], method: EFindMethod, include: boolean);
}

declare class FindFileNames {
    constructor(params: string[], method: EFindMethod, include: boolean);
}

declare class FindFolderNames {
    constructor(params: string[], method: EFindMethod, include: boolean);
}

declare class FindOptions {
    recursive: boolean;
    maxSlave: number; // all
    folderLevel: boolean; //return result only folders
    filterExts: FindExtension[];
    filterNames: FindFileNames[];
    filterFolders: FindFolderNames[];
    filter?: (item: IItemFindFile) => Promise<boolean>;
}
