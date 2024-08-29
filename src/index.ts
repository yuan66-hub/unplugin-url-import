import type { UnpluginFactory } from 'unplugin'
import { createUnplugin } from 'unplugin'
import { normalizePath } from 'vite'
import { createHash } from 'crypto'
import fs from 'fs'
import path from "path";

type KeyType = string;
type ValueType = {
    fileName: string,
    contentType: string
};

type ObjectWithTypedKeysAndValues<K extends KeyType, V> = {
    [key in K]: V;
};


const esmReg = /(import|export)(?!s)/g
const idMapUrls: ObjectWithTypedKeysAndValues<KeyType, { url: string }> = {}
const urls: ObjectWithTypedKeysAndValues<KeyType, ValueType> = {}

function checkhash(content: string) {
    const hash = createHash('md5');
    hash.update(content);
    const checksum = hash.digest('hex');
    return checksum // hash value
}
const unpluginFactory: UnpluginFactory<undefined> = options => ({
    name: 'url-import',
    vite: {
        resolveId(id: string) {
            if (id.includes('virtual') && id) {
                const url = id.match(/https:.+/) as RegExpMatchArray;
                const resolvedVirtualModuleId = '\0' + id
                if (!idMapUrls[normalizePath(resolvedVirtualModuleId)]) {
                    idMapUrls[normalizePath(resolvedVirtualModuleId)] = {
                        url: url[0]
                    }
                }
                return resolvedVirtualModuleId
            }
        },
        async load(id) {
            if (idMapUrls[id]) {
                const { url } = idMapUrls[id]
                let script: string = ''
                if (fs.existsSync('remoteLibs/lock.json')) {
                    const data: ObjectWithTypedKeysAndValues<KeyType, ValueType> = JSON.parse(fs.readFileSync('remoteLibs/lock.json', 'utf-8'))
                    if (Object.keys(data).includes(url)) {
                        script = fs.readFileSync(`remoteLibs/data/${data[url]['fileName']}`, 'utf-8')
                    } else {
                        const res = await fetch(url)
                        script = await res.text()
                        const hash = checkhash(script)
                        const fileName = `${hash}.js`
                        if (!urls[url]) {
                            urls[url] = {
                                fileName: '',
                                contentType: ''
                            }
                        }
                        urls[url]['fileName'] = fileName
                        urls[url]['contentType'] = res.headers.get('content-type') as string
                        const filePath = path.join(__dirname, 'remoteLibs/data', fileName);
                        const jsonFilePath = path.join(__dirname, 'remoteLibs', 'lock.json');
                        fs.mkdirSync(path.dirname(filePath), { recursive: true })
                        fs.writeFileSync(filePath, script, 'utf-8')
                        fs.writeFileSync(jsonFilePath, JSON.stringify(urls), 'utf-8')
                    }
                }
                const isESM = esmReg.test(script);
                esmReg.lastIndex = 0
                if (isESM) {
                    return `${script}`
                } else {
                    // commonjs
                    /**
                     * 
                     * ?创建沙箱环境，执行commonjs代码
                     * ?commonjs to esm
                     */
                    return `export default {}`;
                }
            }
        },
    }
})
const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin

export const vitePlugin = unplugin.vite

