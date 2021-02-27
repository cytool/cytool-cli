import chalk from 'chalk'
import execa from 'execa'
import fs from 'fs-extra'
import Listr from 'listr'
import ncp from 'ncp'
import { promisify } from 'util'
import { tipErr, tipSuc } from './help'

const copy = promisify(ncp)

/* eslint-disable consistent-return */

/**
 * 从远程仓库下载文件
 * @return {void}
 */
const cloneVue2TemplateFromGit = async ctx => {

    const vue2Path = `${process.cwd()}/vue2`
    const existVue2 = fs.existsSync(vue2Path)

    if (existVue2) {

        fs.removeSync(vue2Path)

    }

    const repo = 'https://github.com/cytool/vue-template.git'

    try {

        const result = await execa('git', ['clone', repo, 'vue2'])

        if (result.failed) {
            // 这个好像不会走，直接走 catch
        }

        ctx.cloneTemplate = true

    } catch (error) {

        console.log(error)

        let msg = 'git clone失败，请检查仓库地址 / 网络连接是否正常'

        ctx.cloneTemplate = false

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
 * 创建项目
 * @param {Object} ctx 命令行上下文
 * @param {Object} options 用户输入对象，用于获取文件路径
 * @return {void}
 */
const createProject = async (ctx, options) => {

    const { folderName, force, } = options
    const projectFolderPath = `${process.cwd()}/${folderName}`
    const existVue2 = fs.existsSync(projectFolderPath)

    if (existVue2) {

        if (!force) {

            tipErr(`文件夹已存在，可以使用${chalk.inverse(' --force ')}参数强制重置当前目录`)

            ctx.copySuc = false

            return

        }

        fs.removeSync(projectFolderPath)

    }

    // 拷贝模版文件
    await copy(`${process.cwd()}/vue2`, options.folderName, { clobber: false, })

    ctx.copySuc = true

}

/**
 * 执行yarn命令
 * @param {Object} ctx 命令行上下文
 * @param {Object} task 列表任务对象
 * @param {Object} options 参数
 * @return {void}
 */
const runYarn = async (ctx, task, options) => {

    await execa.command('yarn', { cwd: options.folderName, })
        .catch(() => {

            ctx.yarn = false
            task.skip('Yarn not available, install it via `npm install -g yarn`')

        })

    tipSuc(`项目创建完成，运行${chalk.inverse(` cd ${options.folderName} & yarn serve `)}开始愉快写代码`)

}

/**
 * 执行NPM命令
 * @param {Object} ctx 命令行上下文
 * @param {Object} task 列表任务对象
 * @param {String} options 项目名
 * @return {void}
 */
const runNpm = async (ctx, task, options) => {

    await execa.command('npm install', { cwd: options.folderName, })
        .catch(() => {

            ctx.npm = false
            task.skip('npm not available')

        })

}

export default async function vue(options) {

    // 获取项目名称
    const tasks = new Listr([{
        title: '正在从Github下载最新Vue模板工程文件',
        task: ctx => cloneVue2TemplateFromGit(ctx),
    }, {
        title: '创建Vue项目',
        task: ctx => createProject(ctx, options),
    }, {
        title: '执行Yarn',
        enabled: ctx => ctx.copySuc === true,
        task: (ctx, task) => runYarn(ctx, task, options),
    }, {
        title: '执行Npm',
        enabled: ctx => ctx.yarn === false,
        task: (ctx, task) => runNpm(ctx, task, options),
    }])

    await tasks.run()

}