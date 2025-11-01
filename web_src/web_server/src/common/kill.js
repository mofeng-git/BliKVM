import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const sh = promisify(exec);

/**
 * 结束指定名称/关键字的进程
 * @param {string} name 可执行程序名 (例如 'janus') 或匹配关键字
 * @param {object} [opts]
 * @param {boolean} [opts.fullMatch=true] 仅匹配命令名 (pgrep -x)，false 时使用 -f (匹配整行命令)
 * @param {number} [opts.termTimeout=2000] 发送 SIGTERM 后等待毫秒数再强制 SIGKILL
 * @param {boolean} [opts.requireRoot=false] 如果需要 root 而当前不是 root，则自动使用 sudo
 * @returns {Promise<{killed:number[], forceKilled:number[], notFound:boolean}>}
 */
export async function killProcessByName(name, opts = {}) {
  const {
    fullMatch = true,
    termTimeout = 2000,
    requireRoot = false,
  } = opts;

  if (!name || /\s/.test(name) && fullMatch) {
    throw new Error('fullMatch 模式下 name 不能包含空白；如需匹配整行使用 fullMatch:false');
  }

  // 1. 获取 PIDs
  let cmd = `pgrep ${fullMatch ? '-x' : '-f'} -- '${name.replace(/'/g, `'\\''`)}' || true`;
  const { stdout } = await sh(cmd);
  const pids = stdout
    .split(/\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter(n => Number.isInteger(n) && n > 1); // 排除 PID 1 / 无效

  if (pids.length === 0) {
    return { killed: [], forceKilled: [], notFound: true };
  }

  const sudo = requireRoot && process.getuid && process.getuid() !== 0 ? 'sudo ' : '';

  // 2. 发送 SIGTERM
  await sh(`${sudo}kill -TERM ${pids.join(' ')} || true`);

  // 3. 等待 termTimeout
  await new Promise(r => setTimeout(r, termTimeout));

  // 4. 检查哪些仍存活
  const stillAlive = [];
  for (const pid of pids) {
    try {
      process.kill(pid, 0); // 检测存活
      stillAlive.push(pid);
    } catch (_) {}
  }

  const forceKilled = [];
  if (stillAlive.length) {
    await sh(`${sudo}kill -KILL ${stillAlive.join(' ')} || true`);
    // 再次确认
    for (const pid of stillAlive) {
      try {
        process.kill(pid, 0);
      } catch {
        forceKilled.push(pid);
      }
    }
  }

  const killed = pids.filter(pid => !stillAlive.includes(pid) || forceKilled.includes(pid));

  return { killed, forceKilled, notFound: false };
}