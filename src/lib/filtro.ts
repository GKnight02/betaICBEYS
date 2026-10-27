// Filtro básico de palabras ofensivas. Es deliberadamente simple: amplía la lista según tu comunidad.
const PALABRAS = [
  "puta", "puto", "putita", "pendejo", "pendeja", "idiota", "imbecil", "estupido", "estupida",
  "marica", "maricon", "zorra", "perra", "cabron", "cabrona", "mierda", "verga", "culero", "culera",
  "gilipollas", "subnormal", "retrasado", "retrasada", "malparido", "malparida", "hijueputa",
  "hijodeputa", "mamon", "mamona", "chinga", "chingada", "chingate",
  "fuck", "bitch", "whore", "slut", "retard", "asshole",
];

const SUSTITUCIONES: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[013457@$]/g, (c) => SUSTITUCIONES[c] ?? c)
    .replace(/(.)\1{2,}/g, "$1");
}

const PATRON = new RegExp(`(^|[^a-z])(${PALABRAS.join("|")})(s|es)?($|[^a-z])`);

export function contieneOfensas(texto: string) {
  return PATRON.test(normalizar(texto));
}
