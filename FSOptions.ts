import {IItemFindFile} from './FSUtils.d'

export enum EFindMethod {
    startsWith = 'startsWith',
    endsWith = 'endsWith',
    equals = 'equals',
    indexOf = 'indexOf',
    match = 'match'
}

class AbstractFind {

    public constructor(
        public params: string[],
        public method: EFindMethod = EFindMethod.equals,
        public include = true
    ) {
        this.postInit();
    }

    public static getParams(values: AbstractFind[]): string[] {
        let res: string[] = [];
        values.forEach(v => {
            res = res.concat(...v.params);
        });
        return res;
    }

    public static getItemParam<T extends FindFileNames | FindFolderNames | FindExtension>(values: T[], include = true): Record<string, string[]> {
        const res: Record<string, string[]> = {};

        values.forEach(v => {
            if (v.include === include) {
                if (!res[v.method]) {
                    res[v.method] = [];
                }
                res[v.method] = res[v.method].concat(...v.params);
            }
        })
        return res;
    }

    public static checkParams(params: Record<string, string[]>, value: string): boolean {
        const entries = Object.entries(params);
        let res: boolean = false;
        for (let [key, val] of entries) {
            if (res) return res;
            if (value[key as keyof String] || key === EFindMethod.equals) {
                switch (key) {
                    case EFindMethod.startsWith:
                    case EFindMethod.endsWith:
                        res = val.some(v => key === EFindMethod.startsWith ? value.startsWith(v) : value.endsWith(v));
                        break;
                    case EFindMethod.indexOf:
                        res = val.some(v => value.indexOf(v) > -1);
                        break;
                    case EFindMethod.equals:
                        res = val.some(v => v === value);
                        break;
                    case EFindMethod.match:
                        res = val.some(v => value.match(new RegExp(v, 'g')));
                        break;
                }
            }
        }
        return res
    }

    public postInit(): void {
    }
}

export class FindExtension extends AbstractFind {

    private static info: {
        isIncludeAll: boolean,
        exclude: Record<string, string[]>,
        include: Record<string, string[]>,
    } | null = null;

    public static checkExtensions(extensions: FindExtension[], item: IItemFindFile): boolean {
        if (!FindExtension.info) {
            FindExtension.info = {
                isIncludeAll: extensions.some(v => v.params.includes('*') && v.include),
                exclude: AbstractFind.getItemParam<FindExtension>(extensions, false),
                include: AbstractFind.getItemParam<FindExtension>(extensions, true)
            }
        }
        const incl = AbstractFind.checkParams(FindExtension.info.include, item.parsed.ext);
        const excl = AbstractFind.checkParams(FindExtension.info.exclude, item.parsed.ext);
        if (incl) {
            return excl ? false : true;
        }
        return FindExtension.info.isIncludeAll ? excl ? false : true : false
    }

    public static clear(): void {
        FindExtension.info = null;
    }

    public postInit(): void {
        if (this.method === EFindMethod.startsWith || this.method === EFindMethod.equals) {
            this.params?.forEach(((value, index) => {
                if (value !== '*' && !value.startsWith('.')) {
                    this.params[index] = `.${value}`.toLowerCase();
                }
            }));
        }
    }
}

export class FindFileNames extends AbstractFind {

    private static info: {
        isIncludeAll: boolean,
        exclude: Record<string, string[]>,
        include: Record<string, string[]>,
    } | null = null;

    public static checkFileName(names: FindFileNames[], item: IItemFindFile): boolean {
        if (!FindFileNames.info) {
            FindFileNames.info = {
                isIncludeAll: names.some(v => v.params.includes('*') && v.include),
                exclude: AbstractFind.getItemParam<FindFileNames>(names, false),
                include: AbstractFind.getItemParam<FindFileNames>(names, true)
            }
        }
        const incl = AbstractFind.checkParams(FindFileNames.info.include, item.parsed.name);
        const excl = AbstractFind.checkParams(FindFileNames.info.exclude, item.parsed.name);
        if (incl) {
            return excl ? false : true;
        }
        return FindFileNames.info.isIncludeAll ? excl ? false : true : false
    }

    public static clear(): void {
        FindFileNames.info = null;
    }
}

export class FindFolderNames extends AbstractFind {
    private static info: {
        isIncludeAll: boolean,
        exclude: Record<string, string[]>,
        include: Record<string, string[]>,
    } | null = null;

    public static checkFoldersName(folders: FindFolderNames[], item: IItemFindFile, def = false): boolean {
        if (!FindFolderNames.info) {
            FindFolderNames.info = {
                isIncludeAll: folders.some(v => v.params.includes('*') && v.include),
                exclude: AbstractFind.getItemParam<FindFolderNames>(folders, false),
                include: AbstractFind.getItemParam<FindFolderNames>(folders, true)
            }
        }
        const incl = AbstractFind.checkParams(FindFolderNames.info!.include, item.parsed.name);
        const excl = AbstractFind.checkParams(FindFolderNames.info!.exclude, item.parsed.name);
        if (incl) {
            return excl ? false : true;
        }
        return (FindFolderNames.info.isIncludeAll || def) ? excl ? false : true : false
    }

    public static clear(): void {
        FindFolderNames.info = null;
    }
}

export class FindOptions {
    public recursive = false;
    public maxSlave = -1; // all
    public folderLevel = false; //return result only folders

    public filterExts: FindExtension[] = [];
    public filterNames: FindFileNames[] = [];
    public filterFolders: FindFolderNames[] = [];

    public filter?: (item: IItemFindFile) => Promise<boolean>;


    public check(): void {
        const checkItem = (classType: any, array: Array<AbstractFind>) => {
            array.forEach(((item, index) => {
                if (!(item instanceof classType)) {
                    array[index] = Object.assign(new classType(), item);
                    array[index].postInit();
                }
            }))
        };

        checkItem(FindExtension, this.filterExts);
        checkItem(FindFileNames, this.filterNames);
        checkItem(FindFolderNames, this.filterFolders);
    }

    public postEnd() {
        FindExtension.clear();
        FindFileNames.clear();
        FindFolderNames.clear();
    }
}

