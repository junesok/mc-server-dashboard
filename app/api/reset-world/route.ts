import { NextRequest, NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const seed: string = body?.seed ?? '';

    // 1. 서버 중지
    await executeSSH('/home/ubuntu/minecraft/stop.sh');
    await new Promise((res) => setTimeout(res, 3000));

    // 2. 월드 삭제
    await executeSSH(
      'cd /home/ubuntu/minecraft && rm -rf world world_nether world_the_end'
    );

    // 3. 시드 설정 (제공된 경우)
    if (seed) {
      const sanitizedSeed = seed.replace(/[^a-zA-Z0-9_\-]/g, '');
      await executeSSH(
        `sed -i 's/^level-seed=.*/level-seed=${sanitizedSeed}/' /home/ubuntu/minecraft/server.properties`
      );
    }

    // 4. 서버 시작
    await executeSSH('/home/ubuntu/minecraft/start.sh');

    return NextResponse.json({
      success: true,
      message: seed
        ? `맵을 시드 "${seed}"로 초기화하고 서버를 재시작했습니다.`
        : '맵을 초기화하고 서버를 재시작했습니다.',
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '맵 초기화 실패: ' + errMsg }, { status: 500 });
  }
}
