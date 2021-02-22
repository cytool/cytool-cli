import arg from 'arg'
import chalk from 'chalk'
import inquirer from 'inquirer'
import vue from './vue'





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

    let options = parseArgumentsIntoOptions(args)
    options = await promptForMissingOptions(options)

    if (options.err) return

    await vue(options)

    console.log(options)
}