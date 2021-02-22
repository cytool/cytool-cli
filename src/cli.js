import arg from 'arg'
import chalk from 'chalk'
import execa from 'execa'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import Listr from 'listr'
import path from 'path'

async function cloneVue2TemplateFromGit() {
    const repo = 'https://github.com/cytool/vue-template.git'

    try {
        const result = await execa('git', ['clone', repo, 'vue2'])

        console.log(result, 'xixix')

        if (result.failed) {
            return {
                err: -1
            }
            // return Promise.reject(new Error('Failed to git clone repo'))
        }


    } catch (error) {
        console.log(error.shortMessage, 'error')
        return {
            err: -1
        }
    }


}

function parseArgumentsIntoOptions(rawArgs) {
    try {
        const args = arg(
            {
                '--help': Boolean,
                '--ver': Number,

                '-h': '--help',
                '-v': '--ver',
            },
            {
                argv: rawArgs.slice(2),
            }
        )
        return {
            folderName: args._[0],
            help: args['--help'] || false,
            ver: args['--ver'] || 2,
        }
    } catch (error) {
        return {
            err: 1,
        }
    }
}



async function promptForMissingOptions(options) {

    if (options.err || options.help) {

        console.log(`\n===================================================================================        
        快速创建Vue模板工程
        通过命令 ${chalk.green('cytool 目录名')} (默认Vue2) / ${chalk.green('cytool 目录名 --ver=3')} 来快速创建Vue项目

        ${chalk.green('cytool --help')} : 查看帮助
        ${chalk.green('cytool --ver')} : 指定Vue版本
        ${chalk.green('cytool -h')} : --help的简写
        ${chalk.green('cytool -v')} : --ver的简写

        命令可以通过全称 ${chalk.green('cytool -v 3')} / 别名 ${chalk.green('cytool -ver 3')} 传递
        \r===================================================================================\n`)

        return {
            ...options
        }
    }

    let folderName = options.folderName ? process.cwd() + '/' + options.folderName : process.cwd()

    const questions = []
    if (!options.folderName) {
        questions.push({
            type: 'input',
            name: 'folderName',
            message: `请输入文件夹名：`,
            validate: function (input) {
                const done = this.async()
                if (/^(\d|\.|[\u4e00-\u9fa5]){1,}/igu.test(input)) {
                    done('文件夹名称不能以数字或者.开头且不能是中文！')
                    return
                }
                done(null, true)
                return
            },
        })

        const answers = await inquirer.prompt(questions)
        if (answers.folderName.trim()) folderName = process.cwd() + '/' + answers.folderName
    }



    return {
        ...options,
        folderName
    }
}

export async function cli(args) {

    console.log(fs.ensureDirSync(process.cwd() + '/vue2'), '返回值')

    var stat = fs.stat(path.join(__dirname, '../v1ue2')).then((err, stats) => {
        console.log(stats.isDirectory(), '看不懂')
    }).catch(err => console.log('what。。。什么鬼'))


    // 检查模板资源
    // 更新(第一次下载)模板资源到 cli工具目录下
    // 根据路径创建创建Vue项目
    // yarn
    // yarn serve


    if (!fs.ensureDirSync(process.cwd() + '/vue2')) {
        const tasks = new Listr([
            {
                title: '正在从Github下载Vue2模板文件',
                task: () => cloneVue2TemplateFromGit().then(result => {
                    console.log(result, '结果')
                }),
            },
            {

            },
        ])

        await tasks.run()

    }

    let options = parseArgumentsIntoOptions(args)
    options = await promptForMissingOptions(options)

    if (options.err) return
    console.log(options)
}