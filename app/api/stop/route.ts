import { NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function POST() {
  try {
    await executeSSH('nohup /home/ubuntu/minecraft/stop.sh > /tmp/mc-stop.log 2>&1 &');
    return NextResponse.json({ success: true, message: '서버 중지 명령을 전송했습니다.' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '서버 중지 실패: ' + errMsg }, { status: 500 });
  }
}
