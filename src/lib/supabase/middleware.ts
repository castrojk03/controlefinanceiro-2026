import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieParaDefinir = { name: string; value: string; options: CookieOptions };

/** Rotas acessíveis sem login. */
const ROTAS_PUBLICAS = ['/auth', '/convite'];

/**
 * Renova a sessão a cada request e barra acesso não autenticado.
 * Substitui o componente ProtectedRoute da versão anterior: a proteção
 * passa a acontecer no servidor, antes de qualquer render.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieParaDefinir[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Não colocar lógica entre createServerClient e getUser(): a sessão
  // precisa ser resolvida primeiro, ou o usuário pode ser deslogado sem motivo.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const ehPublica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota));

  if (!user && !ehPublica) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/auth') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}
