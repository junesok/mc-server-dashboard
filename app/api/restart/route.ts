import { NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function POST() {
  try {
    await executeSSH('nohup /home/ubuntu/minecraft/stop.sh > /tmp/mc-stop.log 2>&1 &');
    // screen 세션이 사라질 때까지 최대 60초 대기
    await executeSSH(
      "for i in $(seq 1 60); do screen -list 2>/dev/null | grep -q mc || break; sleep 1; done",
      70000
    );
    await executeSSH('/home/ubuntu/minecraft/start.sh');
    return NextResponse.json({ success: true, message: '서버 재시작 명령을 전송했습니다.' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '서버 재시작 실패: ' + errMsg }, { status: 500 });
  }
}
