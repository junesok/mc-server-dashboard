import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'mc-session';
const cookieOptions = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
};

// 세션 유효 여부 확인
export async function GET(request: NextRequest) {
  const session = request.cookies.get(COOKIE);
  if (session?.value === '1') {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}

// 로그인
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password || password !== process.env.AUTH_PASSWORD) {
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, '1', { ...cookieOptions, maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch {
    return NextResponse.json({ error: '요청 처리 실패' }, { status: 400 });
  }
}

// 로그아웃
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
