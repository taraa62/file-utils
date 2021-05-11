"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FSUtils_1 = require("./FSUtils");
const FSOptions_1 = require("./FSOptions");
describe('init', () => {
    test.skip('extension', () => {
        FSUtils_1.FSUtils.find('.', {
            filterExts: [
                // new FindExtension(['*']),
                // new FindExtension(['json']),
                // new FindExtension(['json']),
                new FSOptions_1.FindExtension(['on'], FSOptions_1.EFindMethod.endsWith),
            ]
        });
    });
    test.skip('file name', () => {
        FSUtils_1.FSUtils.find('.', {
            filterNames: [
                // new FindFileNames(['*'], EFindMethod.startsWith,  true),
                // new FindFileNames(['pa', 'fs', 'fi'], EFindMethod.startsWith,  false),
                new FSOptions_1.FindFileNames(['pa'], FSOptions_1.EFindMethod.startsWith, true),
                // new FindFileNames(['pa', 'je', 'fs'], EFindMethod.startsWith,  true)
                new FSOptions_1.FindFileNames(['config'], FSOptions_1.EFindMethod.endsWith, true),
                new FSOptions_1.FindFileNames(['ign'], FSOptions_1.EFindMethod.indexOf, true),
                new FSOptions_1.FindFileNames(['tsconfig'], FSOptions_1.EFindMethod.equals, false),
                new FSOptions_1.FindFileNames(['pti'], FSOptions_1.EFindMethod.match, true),
                new FSOptions_1.FindFileNames(['lock', 'util'], FSOptions_1.EFindMethod.match, false),
            ]
        });
    });
    test.skip('folder name', () => {
        FSUtils_1.FSUtils.find('.', {
            filterNames: [
                new FSOptions_1.FindFileNames(['*'], FSOptions_1.EFindMethod.equals, false),
            ],
            filterFolders: [
                new FSOptions_1.FindFolderNames(['coverage'], FSOptions_1.EFindMethod.startsWith, true)
            ]
        });
    });
    test.skip('recursion', async () => {
        const files = await FSUtils_1.FSUtils.find('./../pcu/', {
            recursive: true,
            maxSlave: 1
        });
        console.log(files);
    });
    test.skip('filter', async () => {
        const files = await FSUtils_1.FSUtils.find('./../pcu/', {
            recursive: true,
            maxSlave: 3,
            filter: (item => {
                return Promise.resolve(item.dirent.isFile());
            })
        });
        console.log(files);
    });
    test.skip('folder level', async () => {
        const files = await FSUtils_1.FSUtils.find('./../pcu/', {
            recursive: true,
            folderLevel: true
        });
        console.log(files);
    });
    test.skip('foreach files', async () => {
        const map = await FSUtils_1.FSUtils.find('.', {
            recursive: true,
            filterFolders: [
                new FSOptions_1.FindFolderNames(['node_modules'], FSOptions_1.EFindMethod.equals, false)
            ],
        });
        const files = [];
        await FSUtils_1.FSUtils.foreachFiles(map, file => {
            files.push(file.fullPath);
        });
        console.log(files);
    });
    test.skip('foreach folders', async () => {
        const map = await FSUtils_1.FSUtils.find('.', {
            recursive: true,
            filterFolders: [
                new FSOptions_1.FindFolderNames(['node_modules'], FSOptions_1.EFindMethod.equals, false)
            ],
        });
        const folders = [];
        await FSUtils_1.FSUtils.foreachFolders(map, folder => {
            folders.push(folder.name);
        });
        console.log(folders);
    });
});
