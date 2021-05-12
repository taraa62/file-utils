# file-utils

Utilities for working with files.

Files search:

- extension

```ts
FSUtils.find('.', <FindOptions>{
    filterExts: [
        // new FindExtension(['*']),                // include all files, defauld method=equals
        // new FindExtension(['json']),             // include all json files
        new FindExtension(['on'], EFindMethod.endsWith),
        {extensions: ['js', 'ts'], include: false, method: EFindMethod.equals},
        {extensions: ['md'], include: true, method: EFindMethod.startsWith},
    ]
})
```

- filter by file name

```ts
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
```

- filter by path folder

```ts
FSUtils.find('.', <FindOptions>{
    filterNames: [
        new FindFileNames(['*'], EFindMethod.equals, false),
    ],
    filterFolders: [
        new FindFolderNames(['coverage'], EFindMethod.equals, true)
    ]
})
```

- recursion/slave/structure

```ts
await FSUtils.find('./../pcu/', <FindOptions>{
    recursive: true,
    maxSlave: 1,  // max slave, start from folder pcu/src/
    folderLevel: true  // result will be only as structure of folders
})
```

- manual filter file or folder

```ts
await FSUtils.find('./../pcu/', <FindOptions>{
    recursive: true,
    maxSlave: 3,
    filter: (item => {
        return Promise.resolve(item.dirent.isFile()); // filter only if it is a file.
    })
})
```

- foreach/files/folder

```ts
const map = await FSUtils.find('.', <FindOptions>{
    recursive: true,
    filterFolders: [
        new FindFolderNames(['node_modules'], EFindMethod.equals, false)
    ],
});
const files: string[] = [];
await FSUtils.foreachFiles(map, file => {
    files.push(file.fullPath)
});
const folders: string[] = [];
await FSUtils.foreachFolders(map, folder => {
    folders.push(folder.name)
})
```

- duplicate files or folreds by name

```ts
FSUtils.findFileDuplicates(['.'], <FindOptions>{
    recursive: true,
    filterFolders: [
        new FindFolderNames(['node_modules'], EFindMethod.equals, false)
    ],
}, false /*(file / folder)*/);
```

