import arg from 'arg'
import chalk from 'chalk'
import inquirer from 'inquirer'
import vue from './vue'
import gulp from './gulp'

const parseArgumentsIntoOptions = rawArgs => {

    try {

        const args = arg({
            '--help': Boolean,
            '--vue': Boolean,
            '--gulp': Boolean,
            '--force': Boolean,
            '-h': '--help',
            '-v': '--vue',
            '-g': '--gulp',
            '-f': '--force',
        }, {
            permissive: false,
            argv: rawArgs.slice(2),
        })

        return {
            args: args._,
            folderName: args._.length === 1 ? args._[0] : undefined,
            help: args['--help'],
            vue: args['--vue'],
            gulp: args['--gulp'],
            force: args['--force'],
        }

    } catch (error) {

        console.log('错误信息：', error.code)

        return {
            err: 1,
            msg: `[${error.code}] 参数错误，请检查`,
        }

    }

}

const promptForMissingOptions = async options => {

    // 输入参数错误
    if (options.err) {

        console.log(`\n
    ${chalk.green('---------------------------------------------------')}
    ❎❎❎ ${chalk.green(options.msg)} ❎❎❎
    ${chalk.green('---------------------------------------------------')}

    可选的参数: ${chalk.inverse(' cytool -g ')} / ${chalk.inverse(' cytool -v ')} 
    
    更多用法请通过${chalk.inverse(' cytool -h ')}查看
    \n`)

        return { ...options, }

    }

    // 没有输入必选参数
    if (!options.help && !options.vue && !options.gulp) {

        console.log(`\n
    ${chalk.green('---------------------------------------------')}
    ❎❎❎ ${chalk.green('[缺少必要参数] 参数错误，请检查')} ❎❎❎
    ${chalk.green('---------------------------------------------')}

    必填的参数: ${chalk.inverse(' cytool -g ')} / ${chalk.inverse(' cytool -v ')} 👈 二选一  
    
    更多用法请通过${chalk.inverse(' cytool -h ')}查看
    \n`)

        return {
            ...options,
            err: 1,
            msg: '[缺少必要参数] 参数错误，请检查',
        }

    }

    // 同时输入两个参数
    if (options.vue && options.gulp) {

        console.log(`\n
    ${chalk.green('-----------------------------------------------------------')}
    ❎❎❎ ${chalk.green('[一次只能创建一种类型的项目] 参数错误，请检查')} ❎❎❎
    ${chalk.green('-----------------------------------------------------------')}

    可选的参数: ${chalk.inverse(' cytool -g ')} / ${chalk.inverse(' cytool -v ')} 👈 二选一  
    
    更多用法请通过${chalk.inverse(' cytool -h ')}查看
    \n`)

        return {
            ...options,
            err: 1,
            msg: '[一次只能创建一种类型的项目] 参数错误，请检查',
        }

    }

    // 其余参数大于1
    if (options.args.length > 1) {

        console.log(`\n
    ${chalk.green('---------------------------------------------')}
    ❎❎❎ ${chalk.green('[扩展参数过多] 参数错误，请检查')} ❎❎❎
    ${chalk.green('---------------------------------------------')}

    可选的参数: ${chalk.inverse(' cytool folderName ')} 👉 将会在 folderName/ 文件夹下创建项目
    
    更多用法请通过${chalk.inverse(' cytool -h ')}查看
    \n`)

        return {
            ...options,
            err: 1,
            msg: '[扩展参数过多] 参数错误，请检查',
        }

    }

    if (options.help) {

        console.log(`\n        
    
    ${chalk.green('--------------------------')}
    🍓🍓🍓 ${chalk.green('CYTOOL工具集')} 🍓🍓🍓
    ${chalk.green('--------------------------')}
    
    #Usage       : ${chalk.bgMagenta(' cytool <folderName> <options> ')}
    
    #FolderName  : 要创建的文件夹名称
    
    #Options:
      ${chalk.green('--help')}     : 查看帮助
      ${chalk.green('--vue')}      : 指定Vue版本,创建vue项目
      ${chalk.green('--gulp')}     : 指定Gulp版本,创建gulp项目
      ${chalk.green('--force')}    : 强制写入已存在目录
      ${chalk.green('-h')}         : --help的简写
      ${chalk.green('-v')}         : --vue的简写
      ${chalk.green('-g')}         : --gulp的简写
      ${chalk.green('-g')}         : --force的简写


    \n`)

        return {
            ...options,
            err: 1,
        }

    }

    let folderName = options.folderName ? options.folderName : ''
    const questions = []

    // 没有输入文件夹名称
    if (!options.args.length) {

        questions.push({
            type: 'input',
            name: 'folderName',
            message: '请输入文件夹名：',
            validate(input) {

                const done = this.async()

                if (/^(\d|\.|[\u4e00-\u9fa5]){1,}/igu.test(input)) {

                    done('文件夹名称不能以数字或者.开头且不能是中文！')
                    return

                }

                done(null, true)

            },
        })

        const answers = await inquirer.prompt(questions)

        if (answers.folderName.trim()) {

            // eslint-disable-next-line prefer-destructuring
            folderName = answers.folderName

        }

    }

    return {
        ...options,
        folderName,
    }

}

const cli = async args => {

    let options = parseArgumentsIntoOptions(args)

    options = await promptForMissingOptions(options)

    if (options.err) {

        return

    }

    if (options.vue) {

        await vue(options)

    }

    if (options.gulp) {

        await gulp(options)

    }

}

export { cli }
