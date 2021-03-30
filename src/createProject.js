import chalk from 'chalk'
import execa from 'execa'
import fs from 'fs-extra'
import Listr from 'listr'
import { tipErr, tipSuc } from './help'

/**
 * 检查是否已经存在此文件夹
 * @param { Listr } ctx Listr上下文对象
 * @param { Object } options options.force => 是否覆盖同名文件夹 、 options.folderName => 文件夹名
 * @returns Void
 */
const checkFolder = (ctx, options) => {

    const { folderName, force, } = options
    const projectFolderPath = `${process.cwd()}/${folderName}`
    const existVue2 = fs.existsSync(projectFolderPath)

    if (existVue2) {

        if (!force) {

            tipErr(`文件夹已存在，可以使用${chalk.inverse(' --force ')}参数强制重置当前目录`)
            ctx.noExistFolder = false
            return

        }

        fs.removeSync(projectFolderPath)

    }

    ctx.noExistFolder = true

}

/**
 * 创建项目
 * @param {Listr} ctx Listr上下文
 * @param { Object } options options.force => 是否覆盖同名文件夹 、 options.folderName => 文件夹名
 * @returns void
 */
const cloneAndCreateVue2TemplateFromGit = async (ctx, options) => {

    const { folderName, } = options
    const repo = options.vue ? 'https://github.com/cytool/vue-template.git' : 'https://github.com/cytool/html-template.git'

    try {

        const result = await execa('git', ['clone', repo, folderName])
        // if (result.failed) console.log('这个好像不会走，直接走 catch')

        // eslint-disable-next-line no-invalid-this

        ctx.createDone = true

    } catch (error) {

        console.log(error)

        let msg = 'git clone失败，请检查仓库地址 / 网络连接是否正常'

        ctx.createDone = false

        if (error.code === 'ENOENT') {

            msg = 'Git命令不存在，请检查'

        }

        tipErr(msg)

        return {
            err: -1,
            msg,
        }

    }

}

/**
 * 删除git Clone后的.git目录
 * @param {Object} ctx 上下文
 * @param {Object} options 参数
 */
const removeDotGit = async (ctx, options) => {

    const { folderName, } = options

    await execa('rm', ['-rf', `${process.cwd()}/${folderName}/.git`])

}

/**
 * 执行yarn命令
 * @param {Object} ctx 命令行上下文
 * @param {Object} task 列表任务对象
 * @param {Object} options 参数
 * @return {void}
 */
const runYarn = async (ctx, task, options) => {

    const cwd = options.vue ? options.folderName : `${options.folderName}/_`

    await execa.command('yarn', { cwd, })
        .catch(() => {

            ctx.yarn = false
            task.skip('Yarn not available, install it via `npm install -g yarn`')

        })

    const command = options.vue ? 'yarn serve' : 'gulp'

    tipSuc(`项目创建完成，运行${chalk.inverse(` cd ${options.folderName} & ${command} `)}开始愉快写代码`)

}

/**
 * 执行NPM命令
 * @param {Object} ctx 命令行上下文
 * @param {Object} task 列表任务对象
 * @param {String} options 项目名
 * @return {void}
 */
const runNpm = async (ctx, task, options) => {

    const cwd = options.vue ? options.folderName : `${options.folderName}/_`

    await execa.command('npm i', { cwd, })
        .catch(() => {

            ctx.npm = false
            task.skip('npm not available')

        })

    const command = options.vue ? 'yarn serve' : 'gulp'

    tipSuc(`项目创建完成，运行${chalk.inverse(` cd ${options.folderName} & ${command} `)}开始愉快写代码`)

}

export default async function createProject(options) {

    const tasks = new Listr([{
        title: '检查当前路径是否已存在文件夹',
        task: ctx => checkFolder(ctx, options),
    }, {
        title: '正在从Github下载最新Vue模板工程文件',
        enabled: ctx => ctx.noExistFolder === true,
        task: ctx => cloneAndCreateVue2TemplateFromGit(ctx, options),
    }, {
        title: '其他一些事情',
        task: ctx => removeDotGit(ctx, options),
    }, {
        title: '执行Yarn',
        task: (ctx, task) => runYarn(ctx, task, options),
    }, {
        title: '执行Npm',
        enabled: ctx => ctx.yarn === false,
        task: (ctx, task) => runNpm(ctx, task, options),
    }])

    await tasks.run()

}