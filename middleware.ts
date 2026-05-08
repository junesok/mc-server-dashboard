import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 인증 엔드포인트 자체는 항상 허용
  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  const session = request.cookies.get('mc-session');
  if (!session || session.value !== '1') {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
