
import execa from 'execa';

async function cloneFromGit(options) {
    const repo = 'https://github.com/cytool/vue-template.git'
    const result = await execa('git', ['clone', repo, 'xixi']);
    if (result.failed) {
        return Promise.reject(new Error('Failed to initialize git'));
    }
    console.log(result, 'xixixixixix')
    return;
}


export async function createProject(options) {
    cloneFromGit(options)
}