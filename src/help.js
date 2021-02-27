import chalk from 'chalk'

const tipOptErr = msg => {

    console.log(`\n
    ${chalk.green('---------------------------------------------')}
    ❎❎❎ ${chalk.green(msg)} ❎❎❎
    ${chalk.green('---------------------------------------------')}

    必填的参数: ${chalk.inverse(' cytool -g ')} / ${chalk.inverse(' cytool -v ')} 👈 二选一  
    
    更多用法请通过${chalk.inverse(' cytool -h ')}查看
    \n`)

}

const tipErr = msg => {

    const len = Math.ceil(msg.length * 1.5) + 12
    const line = Array(len).fill('-')
        .join('')

    console.log(`\n
    ${chalk.green(line)}
    ❎❎❎ ${chalk.green(msg)} ❎❎❎
    ${chalk.green(line)}
    \n`)

}

const tipSuc = msg => {

    const len = Math.ceil(msg.length * 1.5) + 12
    const line = Array(len).fill('-')
        .join('')

    console.log(`\n
    ${chalk.green(line)}
    🌈🌈🌈 ${chalk.green(msg)} 🌈🌈🌈
    ${chalk.green(line)}
    \n`)

}

export {
    tipOptErr, tipErr, tipSuc
}
