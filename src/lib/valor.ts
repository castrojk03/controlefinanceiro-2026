/**
 * Leitura de valores digitados em formulário.
 *
 * O mesmo campo recebe dois formatos: o que a pessoa escreve, à
 * brasileira ("1.234,56"), e o que o formulário coloca lá sozinho ao
 * abrir um registro para editar, que é o número cru do banco ("309.4").
 *
 * Havia uma versão desta função copiada em cinco arquivos, e todas
 * apagavam qualquer ponto antes de converter. Isso lia o primeiro
 * formato certo e destruía o segundo: 309.4 virava 3094. Bastava abrir
 * um lançamento e salvar sem tocar em nada para ele ficar dez vezes
 * maior — foi assim que o parcelamento do condomínio de R$ 309,40 virou
 * R$ 3.094,00 na base do John.
 *
 * Agora existe uma só, e a regra é a vírgula: se houver, o formato é
 * brasileiro e o ponto separa milhar; se não houver, um ponto é o
 * decimal do próprio JavaScript e tem de ser preservado.
 */
export function paraNumero(valor: FormDataEntryValue | null | undefined): number {
  if (valor === null || valor === undefined) return 0;

  const bruto = String(valor).trim();
  if (!bruto) return 0;

  const texto = bruto.includes(',')
    ? bruto.replace(/\./g, '').replace(',', '.')
    : bruto;

  const n = Number(texto);
  return Number.isFinite(n) ? n : 0;
}
