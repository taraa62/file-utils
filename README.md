# file-utils

Utilities for working with files.

Methods:
    // generate random string from string
- randomString(size: number = 7, source?: string)
    // find file(s) /folder(s)
- find(path: string, options: FindOptions): Promise<Map<string, IFindResult>>
    // iterate files /folders
- foreachFiles(map: Map<string, IFindResult>, callback: (file: IItemFindFile) => void | Promise<void>): Promise<void>
- foreachFolders(map: Map<string, IFindResult>, callback: (file: IItemFindFile) => void | Promise<void>): Promise<void>
    //find duplicate files/folders (duplicate names)
- findFileDuplicates(paths: string[],options: FindOptions,checkDuplicateFolder = false): Promise<Map<string, string[]>>
    // generate uuid
- getUUID(version: 1 | 4): string
    // generate name from original and check exist file
- genFileName(fileName: string, opt: IGenerateOpt = {}): string
    // converting an interval from time to a string (ex: '2s 232ms')
- timeConverter(startTime: number, endTime: number = Date.now()): string | number

----
Files search:
```ts
FindOptions
interface IFindOptions {
    recursive: boolean;
    maxSlave: number; // default = -1 - all child folders
    folderLevel: boolean; //return result only folders

    filterExts: FindExtension[];
    filterNames: FindFileNames[];
    filterFolders: FindFolderNames[];

    filter?: (item: IItemFindFile) => Promise<boolean>; // You can tell whether to add an item to the result or not
}

```
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

- duplicate

```ts
FSUtils.findFileDuplicates(['.'], <FindOptions>{
    recursive: true,
    filterFolders: [
        new FindFolderNames(['node_modules'], EFindMethod.equals, false)
    ],
}, false /*(file / folder)*/);
```

- genFileName
```ts
interface IGenerateOpt {
    checkExistFile?: boolean;         // if true, there is resolved with process.cwd()
    rootDir?: string;                 // if checkExistFile=true && !rootDir, rootDir=process.cwd()

    type?: 'uuid' | 'date' | 'random' | 'val' // default 'uuid'
    offOriginName?: boolean;          //default false
    tmpVal?: string;

    randLength?: number;              //default 6
    uuidVersion?: 1 | 4;              //default 4

    separator?: string;               //default '_'
    side?: 'r' | 'l';                 //right|left default 'r'
}
FSUtils.genFileName('example.txt', {
    type:"uuid",
    uuidVersion:4,
    side:"l",
    separator:'===',
})
// console.log
//4aa642a0-6a94-4bfb-a2d6-de3050d8c309===example.txt
```


