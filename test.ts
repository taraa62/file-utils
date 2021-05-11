import {FSUtils} from "./FSUtils";
import {EFindMethod, FindExtension, FindFileNames, FindFolderNames, FindOptions} from "./FSOptions";

describe('init', () => {

    test.skip('extension', () => {
        FSUtils.find('.', <FindOptions>{
            filterExts: [
                // new FindExtension(['*']),
                // new FindExtension(['json']),
                // new FindExtension(['json']),
                new FindExtension(['on'], EFindMethod.endsWith),
                {extensions: ['js'], include: false, method: EFindMethod.equals},
                {extensions: ['md'], include: true, method: EFindMethod.startsWith},
            ]
        })
    });
    test.skip('file name', () => {
        FSUtils.find('.', <FindOptions>{
            filterNames: [
                // new FindFileNames(['*'], EFindMethod.startsWith,  true),
                // new FindFileNames(['pa', 'fs', 'fi'], EFindMethod.startsWith,  false),
                new FindFileNames(['pa'], EFindMethod.startsWith, true),
                // new FindFileNames(['pa', 'je', 'fs'], EFindMethod.startsWith,  true)
                new FindFileNames(['config'], EFindMethod.endsWith, true),
                new FindFileNames(['ign'], EFindMethod.indexOf, true),
                new FindFileNames(['tsconfig'], EFindMethod.equals, false),
                new FindFileNames(['pti'], EFindMethod.match, true),
                new FindFileNames(['lock', 'util'], EFindMethod.match, false),
            ]
        })
    });
    test.skip('folder name', () => {
        FSUtils.find('.', <FindOptions>{
            filterNames: [
                new FindFileNames(['*'], EFindMethod.equals, false),
            ],
            filterFolders: [
                new FindFolderNames(['coverage'], EFindMethod.startsWith, true)
            ]
        })
    })
    test.skip('recursion', async () => {
        const files = await FSUtils.find('./../pcu/', <FindOptions>{
            recursive: true,
            maxSlave: 1
        })
        console.log(files);
    })
    test.skip('filter', async () => {
        const files = await FSUtils.find('./../pcu/', <FindOptions>{
            recursive: true,
            maxSlave: 3,
            filter: (item => {
                return Promise.resolve(item.dirent.isFile());
            })
        })
        console.log(files);
    })
    test.skip('folder level', async () => {
        const files = await FSUtils.find('./../pcu/', <FindOptions>{
            recursive: true,
            folderLevel: true
        })
        console.log(files);
    });
    test.skip('foreach files', async () => {
        const map = await FSUtils.find('.', <FindOptions>{
            recursive: true,
            filterFolders: [
                new FindFolderNames(['node_modules'], EFindMethod.equals, false)
            ],
        });
        const files: string[] = [];
        await FSUtils.foreachFiles(map, file => {
            files.push(file.fullPath)
        })
        console.log(files);
    });
    test.skip('foreach folders', async () => {
        const map = await FSUtils.find('.', <FindOptions>{
            recursive: true,
            filterFolders: [
                new FindFolderNames(['node_modules'], EFindMethod.equals, false)
            ],
        });
        const folders: string[] = [];
        await FSUtils.foreachFolders(map, folder => {
            folders.push(folder.name)
        })
        console.log(folders);
    });
    test.skip('foreach folders', async () => {
        const map = FSUtils.findFileDuplicates(['.'], <FindOptions>{
            recursive: true,
            filterFolders: [
                new FindFolderNames(['node_modules'], EFindMethod.equals, false)
            ],
        }, false);


        console.log(map);
    });
})
