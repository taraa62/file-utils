import {FileUtils} from "./FileUtils";

const testPath = './testSource/AGNLIST'

const run = async () => {
    const res = await FileUtils.findFiles(testPath, {
            extension: ['.sql'],
            // notExtension: ['.ts'],
            isFolderLevel: false,
            folderHierarchy: true,
            recursive: true,
            /*includeName: {
                indexOf: {
                    'l10n': 1,
                    'AGNLIST': 1
                },
                endsWith: {
                    'form': 1
                }
            },*/
            /*excludeName: {
                startsWith: {
                    'V_': 1
                },
                indexOf: {
                    "AgentAddresses": 2
                },
            }*/
            // iFind: ((path, file) => path.name.startsWith('V_'))

        })
    ;
    console.log(res);
}
run().then(v => console.log(v)).catch(er => console.error(er))