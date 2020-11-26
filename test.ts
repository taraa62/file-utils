import FileUtils from "./FileUtils";

describe('test create and remove folders', ()=>{

    test('create folders', async ()=>{
        const createFolders = ['f1', 'f1/ff1', 'f1/ff2', 'f1/ff1/ff3'];
        for (const path of createFolders){
            await FileUtils.mkDirRecursive(path, false);
        }
        expect(FileUtils.exist(FileUtils.resolve(['f1', 'ff1', 'ff3']))).toBeTruthy()
    }),
    test('remove folders', async ()=>{
        const path3 = FileUtils.resolve(['f1', 'ff1', 'ff3']);
        await FileUtils.rmDir(path3);
        expect(FileUtils.exist(path3)).toBeFalsy();

        const path1 = FileUtils.resolve(['f1']);
        await FileUtils.rmDir(path1, true);
        expect(FileUtils.exist(path1)).toBeFalsy();
    })

})
