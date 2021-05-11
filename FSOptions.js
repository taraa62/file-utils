"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindOptions = exports.FindFolderNames = exports.FindFileNames = exports.FindExtension = exports.EFindMethod = void 0;
var EFindMethod;
(function (EFindMethod) {
    EFindMethod["startsWith"] = "startsWith";
    EFindMethod["endsWith"] = "endsWith";
    EFindMethod["equals"] = "equals";
    EFindMethod["indexOf"] = "indexOf";
    EFindMethod["match"] = "match";
})(EFindMethod = exports.EFindMethod || (exports.EFindMethod = {}));
class AbstractFind {
    constructor(params, method = EFindMethod.equals, include = true) {
        this.params = params;
        this.method = method;
        this.include = include;
        this.postInit();
    }
    static getParams(values) {
        let res = [];
        values.forEach(v => {
            res = res.concat(...v.params);
        });
        return res;
    }
    static getItemParam(values, include = true) {
        const res = {};
        values.forEach(v => {
            if (v.include === include) {
                if (!res[v.method]) {
                    res[v.method] = [];
                }
                res[v.method] = res[v.method].concat(...v.params);
            }
        });
        return res;
    }
    static checkParams(params, value) {
        const entries = Object.entries(params);
        let res = false;
        for (let [key, val] of entries) {
            if (res)
                return res;
            if (value[key] || key === EFindMethod.equals) {
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
        return res;
    }
    postInit() {
    }
}
class FindExtension extends AbstractFind {
    static checkExtensions(extensions, item) {
        if (!FindExtension.info) {
            FindExtension.info = {
                isIncludeAll: extensions.some(v => v.params.includes('*') && v.include),
                exclude: AbstractFind.getItemParam(extensions, false),
                include: AbstractFind.getItemParam(extensions, true)
            };
        }
        const incl = AbstractFind.checkParams(FindExtension.info.include, item.parsed.ext);
        const excl = AbstractFind.checkParams(FindExtension.info.exclude, item.parsed.ext);
        if (incl) {
            return excl ? false : true;
        }
        return FindExtension.info.isIncludeAll ? excl ? false : true : false;
    }
    static clear() {
        FindExtension.info = null;
    }
    postInit() {
        var _a;
        if (this.method === EFindMethod.startsWith || this.method === EFindMethod.equals) {
            (_a = this.params) === null || _a === void 0 ? void 0 : _a.forEach(((value, index) => {
                if (value !== '*' && !value.startsWith('.')) {
                    this.params[index] = `.${value}`.toLowerCase();
                }
            }));
        }
    }
}
exports.FindExtension = FindExtension;
FindExtension.info = null;
class FindFileNames extends AbstractFind {
    static checkFileName(names, item) {
        if (!FindFileNames.info) {
            FindFileNames.info = {
                isIncludeAll: names.some(v => v.params.includes('*') && v.include),
                exclude: AbstractFind.getItemParam(names, false),
                include: AbstractFind.getItemParam(names, true)
            };
        }
        const incl = AbstractFind.checkParams(FindFileNames.info.include, item.parsed.name);
        const excl = AbstractFind.checkParams(FindFileNames.info.exclude, item.parsed.name);
        if (incl) {
            return excl ? false : true;
        }
        return FindFileNames.info.isIncludeAll ? excl ? false : true : false;
    }
    static clear() {
        FindFileNames.info = null;
    }
}
exports.FindFileNames = FindFileNames;
FindFileNames.info = null;
class FindFolderNames extends AbstractFind {
    static checkFoldersName(folders, item, def = false) {
        if (!FindFolderNames.info) {
            FindFolderNames.info = {
                isIncludeAll: folders.some(v => v.params.includes('*') && v.include),
                exclude: AbstractFind.getItemParam(folders, false),
                include: AbstractFind.getItemParam(folders, true)
            };
        }
        const incl = AbstractFind.checkParams(FindFolderNames.info.include, item.parsed.name);
        const excl = AbstractFind.checkParams(FindFolderNames.info.exclude, item.parsed.name);
        if (incl) {
            return excl ? false : true;
        }
        return (FindFolderNames.info.isIncludeAll || def) ? excl ? false : true : false;
    }
    static clear() {
        FindFolderNames.info = null;
    }
}
exports.FindFolderNames = FindFolderNames;
FindFolderNames.info = null;
class FindOptions {
    constructor() {
        this.recursive = false;
        this.maxSlave = -1; // all
        this.folderLevel = false; //return result only folders
        this.filterExts = [];
        this.filterNames = [];
        this.filterFolders = [];
    }
    check() {
        const checkItem = (classType, array) => {
            array.forEach(((item, index) => {
                if (!(item instanceof classType)) {
                    array[index] = Object.assign(new classType(), item);
                    array[index].postInit();
                }
            }));
        };
        checkItem(FindExtension, this.filterExts);
        checkItem(FindFileNames, this.filterNames);
        checkItem(FindFolderNames, this.filterFolders);
    }
    postEnd() {
        FindExtension.clear();
        FindFileNames.clear();
        FindFolderNames.clear();
    }
}
exports.FindOptions = FindOptions;
