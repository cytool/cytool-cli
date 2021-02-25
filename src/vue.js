import execa from 'execa'
import Listr from 'listr'
import fs from 'fs-extra'
import path from 'path'
import ncp from 'ncp'
import { promisify } from 'util'
import fetch from 'node-fetch'

const copy = promisify(ncp)

/* eslint-disable consistent-return */

/**
 * 判断文件夹是否存在
 * @param {Object} ctx 命令行上下文
 * @return {void}
 */
const existsTemplate = async ctx => {

    await fs.stat(path.join(__dirname, '../vue2')).then(() => {

        console.log('模版已存在')
        ctx.isTemplate = true

    })
        .catch(() => {

            console.log('模版不存在')
            ctx.isTemplate = false

        })

}

/**
 * 判断版本号
 * @param {Object} ctx 命令行上下文
 * @return {void}
 */
const getPackageVersion = async ctx => {

    // 获取本地模版版本号
    const pkgPath = path.join(__dirname, '../vue2/package.json')
    const pkgData = JSON.parse(fs.readFileSync(pkgPath))

    console.log('当前版本号：', pkgData.version)

    // 获取远程模版版本号
    await fetch('https://github.com/cytool/vue-template/blob/master/package.json')
        .then(res => res.text())
        .then(res => {

            const versionLine = res.split('version<span class="pl-pds">&quot;</span></span>: <span class="pl-s"><span class="pl-pds">&quot;</span>')[1]
                .split('<span class="pl-pds">&quot;</span></span>')[0]
            
            console.log('线上版本：', versionLine)

            const versionArrLocal = pkgData.version.split('.')
            const versionArrLine = versionLine.split('.')
            let isOld = true
            
            if (versionArrLocal[0] >= versionArrLine[0]) {

                if (versionArrLocal[1] >= versionArrLine[1]) {

                    if (versionArrLocal[2] >= versionArrLine[2]) {

                        isOld = false

                    }

                }
                
            }

            if (isOld) {

                console.log('本地版本小于线上版本')

                ctx.isTemplate = false
                ctx.del = true

            } else {

                console.log('当前最新版本')
                ctx.del = false

            }

        })

}

/**
 * 删除文件夹
 * @return {void}
 */
const delDir = paths => {

    let files = []

    if (fs.existsSync(paths)) {

        files = fs.readdirSync(paths)

        files.forEach(file => {

            const curPath = `${paths }/${ file}`

            if(fs.statSync(curPath).isDirectory()) {

                delDir(curPath) //递归删除文件夹
            
            } else {

                fs.unlinkSync(curPath) //删除文件
            
            }
        
        })
        fs.rmdirSync(paths) // 删除文件夹自身
    
    }

}

/**
 * 删除旧的模版文件夹
 * @return {void}
 */
const delTemplate = async () => {

    await delDir(path.join(__dirname, '../vue2'))

}

/**
 * 从远程仓库下载文件
 * @return {void}
 */
const cloneVue2TemplateFromGit = async () => {

    const repo = 'https://github.com/cytool/vue-template.git'

    try {

        const result = await execa('git', ['clone', repo, 'vue2'])

        if (result.failed) {

            return { err: -1, }

        }

    } catch (error) {

        return { err: -1, }

    }

}

/**
 * 判断要创建的文件夹是否已存在
 * @param {Object} ctx 命令行上下文
 * @param {Object} options 用户输入对象，用于获取文件路径
 * @return {void}
 */
const existsProjectName = async (ctx, options) => {

    await fs.stat(options.folderName).then(() => {

        console.log('文件夹名称重复， 终止运行')
        ctx.isNoRepeat = false

    })
        .catch(() => {

            console.log('项目名不重复， 继续执行')
            ctx.isNoRepeat = true

        })

}

/**
 * 创建项目
 * @param {Object} ctx 命令行上下文
 * @param {Object} options 用户输入对象，用于获取文件路径
 * @return {void}
 */
const createProject = async (ctx, options) => {

    ctx.yarn = true
    // 拷贝模版文件
    await copy(`${process.cwd()}/vue2`, options.folderName, { clobber: false, })

}

/**
 * 执行yarn命令
 * @param {Object} ctx 命令行上下文
 * @param {Object} task 列表任务对象
 * @param {String} createFolderName 项目名
 * @return {void}
 */
const runYarn = async (ctx, task, createFolderName) => {

    await execa.command('yarn', { cwd: createFolderName, })
        .catch(() => {

            ctx.yarn = false
            task.skip('Yarn not available, install it via `npm install -g yarn`')

        })

}

/**
 * 执行NPM命令
 * @param {Object} ctx 命令行上下文
 * @param {Object} task 列表任务对象
 * @param {String} createFolderName 项目名
 * @return {void}
 */
const runNpm = async (ctx, task, createFolderName) => {

    await execa.command('npm install', { cwd: createFolderName, })
        .catch(() => {

            ctx.npm = false
            task.skip('npm not available')

        })

}

export default async function vue(options) {

    // 获取项目名称
    const createFolderName = options.folderName.replace(`${process.cwd()}/`, '')
    const tasks = new Listr([{
        title: '判断是否存在模版文件',
        task: ctx => existsTemplate(ctx),
    }, {
        title: '判断本地模版的版本是否最新',
        enabled: ctx => ctx.isTemplate,
        task: ctx => getPackageVersion(ctx),
    }, {
        title: '删除旧的模版文件',
        enabled: ctx => ctx.del,
        task: ctx => delTemplate(ctx),
    }, {
        title: '正在从Github下载Vue模板文件',
        enabled: ctx => !ctx.isTemplate,
        task: () => cloneVue2TemplateFromGit(),
    }, {
        title: '判断要创建的文件夹是否已存在',
        task: ctx => existsProjectName(ctx, options),
    }, {
        title: '根据路径创建创建Vue项目',
        enabled: ctx => ctx.isNoRepeat === true,
        task: ctx => createProject(ctx, options),
    }, {
        title: '执行yarn',
        enabled: ctx => ctx.yarn === true,
        task: (ctx, task) => runYarn(ctx, task, createFolderName),
    }, {
        title: '执行npm',
        enabled: ctx => ctx.yarn === false,
        task: (ctx, task) => runNpm(ctx, task, createFolderName),
    }])

    await tasks.run()

}