import { NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function GET() {
  try {
    const output = await executeSSH('cat /home/ubuntu/minecraft/whitelist.json');
    const whitelist = JSON.parse(output || '[]');
    return NextResponse.json({ whitelist });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '화이트리스트 조회 실패: ' + errMsg }, { status: 500 });
  }
}
