import { exec } from 'child_process';

/**
 * 서버에서 직접 shell 명령어를 실행합니다.
 * (대시보드가 마인크래프트 서버와 동일 머신에서 실행될 때 사용)
 */
export function executeSSH(command: string, timeout = 15000): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, { timeout }, (err, stdout, stderr) => {
      if (err && !stdout) {
        return reject(new Error(stderr || err.message));
      }
      resolve(stdout);
    });
  });
}
