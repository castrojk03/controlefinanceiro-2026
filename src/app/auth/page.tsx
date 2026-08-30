'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { entrar, criarConta, recuperarSenha } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PaginaAuth() {
  const [pendente, startTransition] = useTransition();
  const [esqueciSenha, setEsqueciSenha] = useState(false);

  function enviar(
    acao: (fd: FormData) => Promise<{ erro: string } | void>,
    sucesso?: string
  ) {
    return (formData: FormData) => {
      startTransition(async () => {
        const resultado = await acao(formData);
        if (resultado?.erro) {
          toast.error(resultado.erro);
          return;
        }
        if (sucesso) toast.success(sucesso);
      });
    };
  }

  if (esqueciSenha) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              Enviamos um link de redefinição para o seu e-mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={enviar(
                recuperarSenha,
                'Link enviado. Confira sua caixa de entrada.'
              )}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email-recuperar">E-mail</Label>
                <Input
                  id="email-recuperar"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="voce@exemplo.com"
                />
              </div>
              <Button type="submit" className="w-full" disabled={pendente}>
                {pendente ? 'Enviando…' : 'Enviar link'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setEsqueciSenha(false)}
              >
                Voltar
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Controle Financeiro</CardTitle>
          <CardDescription>
            Entre para ver suas contas, gastos e faturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form action={enviar(entrar)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-entrar">E-mail</Label>
                  <Input
                    id="email-entrar"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-entrar">Senha</Label>
                  <Input
                    id="senha-entrar"
                    name="senha"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={pendente}>
                  {pendente ? 'Entrando…' : 'Entrar'}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setEsqueciSenha(true)}
                >
                  Esqueci minha senha
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form action={enviar(criarConta)} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email-criar">E-mail</Label>
                  <Input
                    id="email-criar"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-criar">Senha</Label>
                  <Input
                    id="senha-criar"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    Pelo menos 6 caracteres.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={pendente}>
                  {pendente ? 'Criando…' : 'Criar conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
