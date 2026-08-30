'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

type Resultado = { erro: string } | void;

/** Traduz as mensagens do Supabase para algo que a pessoa entenda e resolva. */
function traduzirErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (mensagem.includes('User already registered')) {
    return 'Esse e-mail já tem conta. Entre em vez de criar.';
  }
  if (mensagem.includes('Email not confirmed')) {
    return 'Confirme o e-mail antes de entrar. Veja sua caixa de entrada.';
  }
  if (mensagem.includes('Password should be at least')) {
    return 'A senha precisa de pelo menos 6 caracteres.';
  }
  return mensagem;
}

export async function entrar(formData: FormData): Promise<Resultado> {
  const email = String(formData.get('email') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');

  if (!email || !senha) {
    return { erro: 'Preencha e-mail e senha.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: traduzirErro(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function criarConta(formData: FormData): Promise<Resultado> {
  const email = String(formData.get('email') ?? '').trim();
  const senha = String(formData.get('senha') ?? '');

  if (!email || !senha) {
    return { erro: 'Preencha e-mail e senha.' };
  }
  if (senha.length < 6) {
    return { erro: 'A senha precisa de pelo menos 6 caracteres.' };
  }

  const origem = (await headers()).get('origin');
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { emailRedirectTo: `${origem}/auth/callback` },
  });

  if (error) {
    return { erro: traduzirErro(error.message) };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function recuperarSenha(formData: FormData): Promise<Resultado> {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    return { erro: 'Informe o e-mail da conta.' };
  }

  const origem = (await headers()).get('origin');
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?next=/conta/senha`,
  });

  if (error) {
    return { erro: traduzirErro(error.message) };
  }
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/auth');
}
