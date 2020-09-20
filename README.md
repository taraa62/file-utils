# file-utils

Utilities for working with files.

* Find files 
```ts
    const res = await FileUtils.findFiles(testPath, {
            extension: ['.sql'],
            notExtension: ['.ts'],
            isFolderLevel: false,
            folderHierarchy: true,
            recursive: true,
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
            iFind: ((path, file) => path.name.startsWith('sql'))

        })
```
* Resolve path
* Exist file 
* StatFile/StatFileSync