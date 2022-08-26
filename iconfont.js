const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const fextra = require('fs-extra')
const SVGTOFONT = require("svgicons2svgfont");
const SVGTOTTF = require('svg2ttf')
const SVGTOWOFF = require('ttf2woff')
const SVGTOWOFFTWO = require('ttf2woff2')
const SVGTOEOT = require('ttf2eot')

const DIST_TTF = path.resolve(process.cwd(), "./font/iconfont.ttf")
const DIST_WOFF = path.resolve(process.cwd(), "./font/iconfont.woff")
const DIST_WOFF_TWO = path.resolve(process.cwd(), "./font/iconfont.woff2")
const DIST_EOT = path.resolve(process.cwd(), "./font/iconfont.eot")
let unicodeObj = {}

const generateIconfont = () => {
    return new Promise(resolve => {
        const iconFontStream = new SVGTOFONT({
            fontName: 'iconfont',
            fontHeight: 1024,
            metadata: 'TOM',
            normalize: true     //  元数据标签的内容，很重要，不设置则会导致图标大小不一
        })

        //  设置字体目标
        iconFontStream.pipe(fs.createWriteStream('./font/iconfont.svg'))
            .on('finish', () => { console.log('font create success'); })
            .on('error', (error) => { console.log('error',error); })

        //  获取图标文件路径
        const svgDir = path.resolve(process.cwd(), "./svg/");
        //  读取.svg文件
        setTimeout(() => {
            const svgFiles = fs.readdirSync(svgDir, 'utf-8')
            console.log('svgFiles',svgFiles)
            //  格式化svg文件对象
            let svgFileList = []
            //  设置默认Unicode码
            let startUnicode = 0xea01
            svgFiles.forEach(item => {
                svgFileList.push({ file: item })
            })
            svgFileList = [...new Set(svgFileList)]
            //  写入glyphs
            svgFileList.map((item, index) => {
                const [svgFileName] = item['file'].split('.')
                item.iconName = svgFileName
                item[svgFileName] = fs.createReadStream(svgDir + '/' + item['file'])
                item[svgFileName].metadata = {
                    unicode: [String.fromCharCode(startUnicode++)],
                    name: svgFileName,
                };
                const [iconUnicode] = item[svgFileName]['metadata']['unicode']
                unicodeObj[svgFileName] = iconUnicode
                unicodeObj['name'] = svgFileName
                unicodeObj['unicode'] = `&#${iconUnicode.charCodeAt(0)};`
                return item
            })

            //  写入流
            svgFileList.forEach(item => {
                iconFontStream.write(item[item['iconName']])
            })
            //  关闭流
            iconFontStream.end()
            resolve(true)
        }, 1000)
    })
}

/** 生成TTF文件 **/
const generateIconTTF = async () => {
    return new Promise(async (resolve, reject) => {
        let iconttf = SVGTOTTF(await fextra.readFileSync(path.join(__dirname, "font/iconfont.svg"), 'utf-8'), {})
        fextra.writeFileSync(DIST_TTF, new Buffer.from(iconttf.buffer), error => {
            if (error) {
                reject(error)
                return
            }
            console.log('is create TTF success')
            resolve(true)
        })
    })
}

/** 生成WOFF文件 **/
const generateIconWoff = () => {
    return new Promise(async (resolve, reject) => {
        let iconwoff = SVGTOWOFF(await fextra.readFileSync(DIST_TTF))
        fextra.writeFileSync(DIST_WOFF, new Buffer.from(iconwoff.buffer), (error, res) => {
            if (error) {
                reject(error)
                return
            }
            console.log('is create ttf success')
            resolve(true)
        })
    })
}

/** 生成WOFF2文件 **/
const generateIconWoffTwo = () => {
    return new Promise(resolve => {
        let iconwoff2 = SVGTOWOFFTWO(fextra.readFileSync(DIST_TTF))
        fextra.writeFileSync(DIST_WOFF_TWO, new Buffer.from(iconwoff2.buffer), (error, res) => {
            if (error) return
            console.log('is create ttf success')
        })
        resolve()
    })
}

/** 生成EOT文件 **/
const generateIconEot = () => {
    // const DIST_EOT = path.resolve(process.cwd(), "./font/iconfont.eot")
    return new Promise(resolve => {
        let iconeot = SVGTOEOT(fextra.readFileSync(DIST_TTF))
        fextra.writeFileSync(DIST_EOT, new Buffer.from(iconeot.buffer), (error, res) => {
            if (error) return
            console.log('is create eot success')
        })
        resolve()
    })
}

/** 生成可视文件 **/
const generatePage = () => {
    return new Promise(async resolve => {
        const tempPath = path.join(__dirname, "/template/index.ejs")
        const savePath = path.join(__dirname, "/font/index.html")
        const temp = await generateHtml(tempPath, { icons: JSON.stringify(unicodeObj) })
        fextra.outputFileSync(savePath, temp)
    })
}

/** 生成HTML文本 **/
const generateHtml = (savePath, options) => {
    return new Promise((resolve, reject) => {
        ejs.renderFile(savePath, options, (error, str) => {
            if (error) reject(error);
            resolve(str);
        });
    })
}

const generateInit = async () => {
    const is_ok = await generateIconfont()
    if (is_ok) {
        setTimeout(() => {
            generateIconTTF()
            generateIconWoff()
            generateIconWoffTwo()
            generateIconEot()
            generatePage()
        }, 500)
    }
}

generateInit()
