import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
  try {
    let currentVersion = '';
    try {
      currentVersion = fs.readFileSync('/home/ubuntu/minecraft/mc-version.txt', 'utf-8').trim();
    } catch { /* 파일 없으면 빈 문자열 */ }

    const manifestRes = await fetch('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    if (!manifestRes.ok) throw new Error('Mojang API 연결 실패');
    const manifest = await manifestRes.json();
    const latestVersion: string = manifest.latest.release;

    return NextResponse.json({
      currentVersion,
      latestVersion,
      hasUpdate: latestVersion !== currentVersion,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
