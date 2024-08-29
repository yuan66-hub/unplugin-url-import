
## 安装

```bash
npm add @yuanjianming/unplugin-url-import
```

## 使用

```js
// vite.config.mts
import { defineConfig } from 'vite'
import { vitePlugin } from '@yuanjianming/unplugin-url-import'
export default defineConfig({
    //....
    plugins: [vitePlugin()],
})
```

```js
// main.ts
 import { max } from 'virtual:https://cdn.bootcdn.net/ajax/libs/radash/12.1.0/radash.esm.min.js'
 console.log(max)
```

## 思考

1. 如何导入解析commonjs
- commonjs to esm ?
- 创建沙箱环境？


