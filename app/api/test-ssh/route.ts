import { NextResponse } from 'next/server';
import { executeSSH } from '@/lib/ssh';

export async function GET() {
  const start = Date.now();
  try {
    const output = await executeSSH('echo "SSH connection OK" && hostname && uptime');
    const elapsed = Date.now() - start;
    return NextResponse.json({
      success: true,
      message: 'SSH 연결 성공',
      output: output.trim(),
      latencyMs: elapsed,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: 'SSH 연결 실패: ' + errMsg },
      { status: 500 }
    );
  }
}
