import { NextRequest, NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: '유저명이 필요합니다.' }, { status: 400 });
    }

    const sanitized = username.replace(/[^a-zA-Z0-9_]/g, '');
    if (!sanitized) {
      return NextResponse.json({ error: '유효하지 않은 유저명입니다.' }, { status: 400 });
    }

    await executeSSH(
      `screen -S mc -p 0 -X stuff "whitelist add ${sanitized}\\r"`
    );
    return NextResponse.json({ success: true, message: `${sanitized} 을(를) 화이트리스트에 추가했습니다.` });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: '화이트리스트 추가 실패: ' + errMsg }, { status: 500 });
  }
}
