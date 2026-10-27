/** Estado que devuelven las Server Actions usadas con useActionState. */
export type Estado = {
  ok?: boolean;
  mensaje?: string;
  error?: string;
  campos?: Record<string, string>;
  codigos?: string[];
  codigo?: string;
  xp?: number;
} | null;

export const ERROR_LIMITE = "Demasiados intentos. Espera unos minutos y vuelve a probar.";
