import { NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  let updateMode = 'none';
  try {
    const body = await request.json();
    updateMode = body.updateMode ?? 'none';
  } catch { /* no body */ }

  try {
    if (updateMode === 'update') {
      const manifestRes = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
      if (!manifestRes.ok) throw new Error('Mojang API 연결 실패');
      const manifest = await manifestRes.json();
      const latestVersion: string = manifest.latest.release;

      const versionEntry = manifest.versions.find(
        (v: { id: string; url: string }) => v.id === latestVersion
      );
      if (!versionEntry) throw new Error(`버전 정보 없음: ${latestVersion}`);

      const metaRes = await fetch(versionEntry.url);
      if (!metaRes.ok) throw new Error('버전 메타데이터 조회 실패');
      const meta = await metaRes.json();
      const downloadUrl: string = meta.downloads.server.url;

      await execAsync(
        `wget -q --timeout=120 -O /home/ubuntu/minecraft/server.jar.tmp "${downloadUrl}" && mv /home/ubuntu/minecraft/server.jar.tmp /home/ubuntu/minecraft/server.jar`,
        { timeout: 180000 }
      );

      fs.writeFileSync('/home/ubuntu/minecraft/mc-version.txt', latestVersion);
    }

    await executeSSH('/home/ubuntu/minecraft/start.sh');
    return NextResponse.json({ success: true, message: '서버 시작 명령을 전송했습니다.' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '서버 시작 실패: ' + errMsg }, { status: 500 });
  }
}
