
import execa from 'execa'
import Listr from 'listr'

/* eslint-disable consistent-return */
const cloneVue2TemplateFromGit = async () => {

    const repo = 'https://github.com/cytool/vue-template.git'

    try {

        const result = await execa('git', ['clone', repo, 'vue2'])

        console.log(result, 'xixix')

        if (result.failed) {

            return { err: -1, }
            // return Promise.reject(new Error('Failed to git clone repo'))

        }

    } catch (error) {

        // console.log(error.shortMessage, 'error')
        return { err: -1, }

    }

}

export default async function vue(options) {

    // console.log(fs.ensureDirSync(process.cwd() + '/vue2'), '返回值')

    // var stat = fs.stat(path.join(__dirname, '../v1ue2')).then((err, stats) => {
    //     console.log(stats.isDirectory(), '看不懂')
    // }).catch(err => console.log('what。。。什么鬼'))

    // 检查模板资源
    // 更新(第一次下载)模板资源到 cli工具目录下
    // 根据路径创建创建Vue项目
    // yarn
    // yarn serve

    const tasks = new Listr([{
        title: '正在从Github下载Vue模板文件',
        task: () => cloneVue2TemplateFromGit(),
    }])

    await tasks.run()

}