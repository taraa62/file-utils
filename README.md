# file-utils

Utilities for working with files.

* Remove and create files
```ts
 await FileUtils.rmDirRecursive('/home/user/...')
 await FileUtils.mkDirRecursive(['home/user1', 'home/user2']);
```

* Options
```ts
interface IFindOptions {
    recursive?: boolean;
    isFolderLevel?: boolean; // what files are we looking for? folder or file
    extension?: string[];
    notExtension?: string[];
    folderHierarchy?: boolean;
    includeName?: IFilterConsist;
    excludeName?: IFilterConsist;
    indexOfPath?: string;
    inFolders?: string[];
    IFind?: (parsedPath: ParsedPath, type: 1 | 2) => Promise<boolean>;
}
```

* Find files 
```ts
    const findResult:Map<string, IFindRes> = await FileUtils.findFiles(testPath, {
            recursive: true,
            isFolderLevel: false,
            extension: ['sql', 'js'],
            notExtension: ['ts'],
            folderHierarchy: true,
            includeName: {
                indexOf: {
                    'aa': 1,
                    'SQLFile': 1
                },
                endsWith: {
                    'form': 1
                }
            },
            excludeName: {
                startsWith: {
                    'sql_table': 1
                },
                indexOf: {
                    "table": 2
                },
            },
            iFind: ((path, file) => path.name.startsWith('sql')),
            indexOfPath: 'my/super/folder',
            inFolders?: ['my', 'super', 'foler']

        })
```
* Find duplicates
```ts
FileUtils.findFileDuplicates(['/home'], {includeName:{startsWith:{user:1}, true}
```
** Iterate result
 ```ts
 
FileUtils.forEachFiles(findResult, (file=> console.log(file)))
FileUtils.forEachFolders(findResult, (folder=> console.log(folder)))
 ```

* Read file
```ts
const path = FileUtils.resolve(['test.txt']) // by default we do fs.resolve(process.pwd, 'test.txt)
FileUtils.read(path)

FileUtils.readLine(path, (er: Error | null, line: string | null) => console.log(line));
```

* Write file
```ts
FileUtils.write(FileUtils.resolve(['test.txt']) , 'hello world')

FileUtils.writeStreamToFile(path, request);

const {writeTo, writeEnd, error} = FileUtils.writeChunkToFileSync(FileUtils.resolve(['test.txt']))
if(!error){
    error = writeTo('line1');                 
    error = writeTo(['line2', 'line3']);                 
    error = writeTo('line4');
    error= writeEnd()
    if(error)  console.error(error);
} else console.error(error);  
```


