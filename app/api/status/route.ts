import { NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function GET() {
  try {
    const output = await executeSSH('screen -list');
    const isRunning = output.toLowerCase().includes('mc');
    return NextResponse.json({ running: isRunning, output });
  } catch (error) {
    // screen -list returns exit code 1 when no sessions exist
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('No Sockets') || errMsg.includes('no screen')) {
      return NextResponse.json({ running: false, output: '' });
    }
    return NextResponse.json(
      { error: 'SSH 연결 실패: ' + errMsg },
      { status: 500 }
    );
  }
}
