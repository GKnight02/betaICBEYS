import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar } from "@/components/pixel/Sprite";
import { Ventana } from "@/components/pixel/Ventana";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { CATEGORIAS, CATEGORIAS_GUSTOS, type Categoria } from "@/lib/config";
import { usuarioPorNombre } from "@/lib/consultas";
import type { Item } from "@/lib/db/schema";
import { itemsVisibles } from "@/lib/items";
import { puedeVer, relacion } from "@/lib/permisos";
import { Quiz, type Pregunta } from "./Quiz";

export const metadata: Metadata = { title: "¿Cuánto le conoces?" };

// Respuestas de relleno cuando la ficha no tiene suficientes opciones
const RELLENO: Record<Categoria, string[]> = {
  food: ["Brócoli hervido", "Sushi", "Pizza hawaiana", "Hígado encebollado", "Paella", "Ensalada César", "Chilaquiles", "Tofu"],
  music: ["Reguetón", "Ópera", "K-pop", "Heavy metal", "Jazz", "Cumbia", "Lo-fi"],
  series: ["The Office", "Friends", "Breaking Bad", "Stranger Things", "La casa de papel", "Dark"],
  movie: ["Titanic", "Shrek", "Interstellar", "Coco", "El Padrino", "Mamma Mia"],
  game: ["Minecraft", "Tetris", "FIFA", "Zelda", "Among Us", "Stardew Valley"],
  book: ["Don Quijote", "Harry Potter", "Cien años de soledad", "El Principito", "1984"],
  anime: ["Naruto", "One Piece", "Ghibli", "Death Note", "Sailor Moon"],
  place: ["La playa", "La montaña", "Un museo", "Un centro comercial", "Un karaoke"],
  hobby: ["Hacer yoga", "Coleccionar sellos", "Escalar", "Tejer", "Correr maratones"],
  other: ["Los lunes", "Madrugar", "Los gatos", "Los perros", "El frío"],
};

function barajar<T>(lista: T[]) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function generarPreguntas(nombre: string, lista: Item[]): Pregunta[] {
  const confirmados = lista.filter((i) => i.status === "confirmed");
  const gustan = confirmados.filter((i) => i.mode !== "disliked" && (i.intensity === "love" || i.intensity === "like"));
  const noGustan = confirmados.filter((i) => i.mode === "disliked" || i.intensity === "no_longer");
  const nombres = new Set(confirmados.map((i) => i.name.toLowerCase()));
  const preguntas: Pregunta[] = [];

  function opciones(correcta: string, categoria: Categoria, distractores: string[]) {
    const relleno = RELLENO[categoria].filter((r) => !nombres.has(r.toLowerCase()));
    const otras = barajar([...new Set([...distractores, ...barajar(relleno)])]).filter((o) => o !== correcta).slice(0, 3);
    const todas = barajar([correcta, ...otras]);
    return { opciones: todas, correcta: todas.indexOf(correcta) };
  }

  for (const item of barajar(gustan).slice(0, 6)) {
    const distractores = noGustan.filter((n) => n.category === item.category).map((n) => n.name);
    preguntas.push({
      texto: `¿Cuál de estas ${item.category === "food" ? "comidas" : `cosas (${CATEGORIAS[item.category].toLowerCase()})`} le ${item.intensity === "love" ? "encanta" : "gusta"} a ${nombre}?`,
      ...opciones(item.name, item.category, distractores),
    });
  }
  for (const item of barajar(noGustan).slice(0, 3)) {
    const distractores = gustan.filter((g) => g.category === item.category).map((g) => g.name);
    if (distractores.length < 1) continue;
    preguntas.push({
      texto: `¿Qué de esto NO le gusta (o ya no) a ${nombre}?`,
      ...opciones(item.name, item.category, distractores),
    });
  }
  const conDetalle = confirmados.filter((i) => i.category === "food" && i.detail);
  for (const item of barajar(conDetalle).slice(0, 2)) {
    const otros = conDetalle.filter((o) => o.id !== item.id).map((o) => o.detail!);
    const relleno = ["Sin nada, tal cual", "Extra picante", "Con mucho queso", "Bien frío", "Doble ración"];
    const todas = barajar([item.detail!, ...barajar([...otros, ...relleno]).slice(0, 3)]);
    preguntas.push({ texto: `¿Cómo pide ${nombre} «${item.name}»?`, opciones: todas, correcta: todas.indexOf(item.detail!) });
  }
  return barajar(preguntas).slice(0, 10);
}

export default async function PaginaQuiz({ params }: { params: Promise<{ usuario: string }> }) {
  const yo = await requerirUsuario();
  const { usuario } = await params;
  const otro = await usuarioPorNombre(decodeURIComponent(usuario));
  if (!otro || otro.bannedAt || otro.id === yo.id) notFound();
  if ((await relacion(yo.id, otro.id)).bloqueado) notFound();

  const [comidas, gustos] = await Promise.all([puedeVer(yo.id, otro.id, "food"), puedeVer(yo.id, otro.id, "likes")]);
  const categorias = [...(comidas ? (["food"] as const) : []), ...(gustos ? CATEGORIAS_GUSTOS : [])];
  if (categorias.length === 0) notFound();

  const lista = await itemsVisibles(yo.id, otro.id, categorias);
  const preguntas = generarPreguntas(otro.displayName, lista);

  return (
    <>
      <Encabezado
        antetitulo="Quiz"
        titulo={`¿Cuánto conoces a ${otro.displayName}?`}
        descripcion="Preguntas sacadas de lo que ha confirmado en su ficha."
        icono={<Avatar id={otro.avatar} escala={4} />}
        acciones={
          <Link href={`/u/${otro.username}`} className="boton-pixel boton-mini">
            ◀ Volver a su ficha
          </Link>
        }
      />
      <Ventana className="aparecer mx-auto max-w-4xl">
        {preguntas.length < 3 ? (
          <p>Su ficha aún tiene pocos gustos confirmados para armar un quiz. ¡Vuelve más tarde o propón suposiciones!</p>
        ) : (
          <Quiz preguntas={preguntas} />
        )}
      </Ventana>
    </>
  );
}
