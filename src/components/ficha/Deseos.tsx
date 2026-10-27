import { BotonPixel } from "@/components/pixel/BotonPixel";
import { borrarDeseo, reservarDeseo } from "@/lib/acciones/deseos";
import type { Wish } from "@/lib/db/schema";
import { FormDeseo } from "./FormDeseo";

type DeseoVista = Pick<Wish, "id" | "name" | "link" | "note" | "addedBy" | "claimedBy"> & { autor?: string | null };

/**
 * Lista de deseos. El dueño solo ve sus propios deseos y nunca quién los reserva.
 * Los amigos ven además las ideas secretas y las reservas («modo sorpresa»).
 */
export function ListaDeseos({
  deseos,
  propio,
  viewerId,
  ownerId,
}: {
  deseos: DeseoVista[];
  propio: boolean;
  viewerId: string;
  ownerId: string;
}) {
  return (
    <div>
      {deseos.length === 0 && <p className="text-tenue">La lista está vacía.</p>}
      <ul className="space-y-2.5">
        {deseos.map((d, i) => (
          <li key={d.id} className="tarjeta entra-rebote flex flex-wrap items-center gap-2 py-2.5!" style={{ ["--i" as string]: i }}>
            <span className="font-bold">🎁 {d.name}</span>
            {d.addedBy && <span className="chip chip-aviso">Idea secreta{d.autor ? ` de @${d.autor}` : ""}</span>}
            {d.note && <span className="text-tenue">· {d.note}</span>}
            {d.link && (
              <a href={d.link} target="_blank" rel="noopener noreferrer nofollow">
                enlace
              </a>
            )}
            {!propio && d.claimedBy && (
              <span className="chip chip-exito">{d.claimedBy === viewerId ? "Lo regalas tú" : "Ya lo regala alguien"}</span>
            )}
            {!propio && !d.claimedBy && (
              <form action={reservarDeseo.bind(null, d.id, true)}>
                <BotonPixel mini>Lo regalo yo</BotonPixel>
              </form>
            )}
            {!propio && d.claimedBy === viewerId && (
              <form action={reservarDeseo.bind(null, d.id, false)}>
                <BotonPixel mini>Ya no</BotonPixel>
              </form>
            )}
            {((propio && !d.addedBy) || d.addedBy === viewerId) && (
              <form action={borrarDeseo.bind(null, d.id)}>
                <BotonPixel mini variante="peligro">Quitar</BotonPixel>
              </form>
            )}
          </li>
        ))}
      </ul>
      <details className="mt-4">
        <summary className="cursor-pointer text-enlace">+ {propio ? "Añadir deseo" : "Añadir idea secreta (no la verá)"}</summary>
        <div className="mt-2">
          <FormDeseo ownerId={ownerId} />
        </div>
      </details>
    </div>
  );
}
