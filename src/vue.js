
import execa from 'execa'
import Listr from 'listr'
import fs from 'fs-extra'
import path from 'path'
import ncp from 'ncp'
import { promisify } from 'util'
const copy = promisify(ncp)

/* eslint-disable consistent-return */

// 判断文件夹是否存在
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

// 从远程仓库下载文件
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

// 判断要创建的文件夹是否已存在
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

// 创建项目
const createProject = async (ctx, options) => {

    ctx.yarn = true
    // 拷贝模版文件
    await copy(`${process.cwd()}/vue2`, options.folderName, { clobber: false, })

}

// 执行yarn
const runYarn = async (ctx, task, createFolderName) => {

    await execa.command('yarn', { cwd: createFolderName, })
        .catch(() => {

            ctx.yarn = false
            task.skip('Yarn not available, install it via `npm install -g yarn`')

        })

}

// 执行npm
const runNpm = async (ctx, task, createFolderName) => {

    await execa.command('npm install', { cwd: createFolderName, })
        .catch(() => {

            ctx.npm = false
            task.skip('npm not available')

        })

}

const test1 = () => {

    console.log(1)

}

export default async function vue(options) {

    // 获取项目名称
    const createFolderName = options.folderName.replace(`${process.cwd()}/`, '')
    // 检查模板资源
    // 更新(第一次下载)模板资源到 cli工具目录下
    // 根据路径创建创建Vue项目
    // yarn
    // yarn serve
    const tasks = new Listr([{
        title: '判断是否存在模版文件',
        task: ctx => existsTemplate(ctx),
    }, {
        title: 'test1',
        enabled: ctx => ctx.isTemplate,
        task: () => test1(),
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