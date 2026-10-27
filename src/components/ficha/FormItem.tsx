"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Campo, MensajeEstado, Selector } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import type { Estado } from "@/lib/acciones/estado";
import { CATEGORIAS, CATEGORIAS_GUSTOS, INTENSIDADES, MESES, MODOS, type Categoria } from "@/lib/config";
import type { Item } from "@/lib/db/schema";

type Props = {
  accion: (estado: Estado, fd: FormData) => Promise<Estado>;
  /** "food" fija la categoría; "likes" deja elegir entre los demás; "todas" muestra todas */
  tipo: "food" | "likes" | "todas";
  item?: Item;
  textoBoton?: string;
  /** Al proponer una suposición no tiene sentido fijar fechas de inicio */
  suposicion?: boolean;
};

export function FormItem({ accion, tipo, item, textoBoton = "Guardar", suposicion }: Props) {
  const [estado, enviar] = useActionState(accion, null);
  const [modo, setModo] = useState<string>(item?.mode ?? "always");
  const [categoria, setCategoria] = useState<string>(item?.category ?? (tipo === "food" ? "food" : tipo === "likes" ? "music" : "food"));
  const form = useRef<HTMLFormElement>(null);

  // Tras añadir algo nuevo, se limpia el formulario
  useEffect(() => {
    if (estado?.ok && !item) {
      form.current?.reset();
      setModo("always");
    }
  }, [estado, item]);

  const c = estado?.campos ?? {};
  const categorias =
    tipo === "likes"
      ? Object.fromEntries(CATEGORIAS_GUSTOS.map((k) => [k, CATEGORIAS[k]]))
      : (CATEGORIAS as Record<Categoria, string>);
  const esComida = categoria === "food";

  return (
    <form ref={form} action={enviar} className="grid gap-x-4 @md:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      {tipo === "food" ? (
        <input type="hidden" name="category" value="food" />
      ) : (
        <Selector etiqueta="Categoría" name="category" opciones={categorias} defaultValue={categoria} onChange={setCategoria} error={c.category} />
      )}
      <Campo etiqueta="Nombre" name="name" defaultValue={item?.name} required maxLength={80} error={c.name}
        placeholder={esComida ? "Ramen, chocolate caliente…" : "Una serie, canción, lugar…"} />
      <Campo
        etiqueta={esComida ? "Mi pedido exacto / detalle" : "Detalle"}
        name="detail"
        defaultValue={item?.detail ?? ""}
        maxLength={300}
        error={c.detail}
        placeholder={esComida ? "Con leche de avena, sin azúcar…" : "Temporada 2, la versión acústica…"}
      />
      <Campo etiqueta="Enlace (opcional)" name="link" type="url" defaultValue={item?.link ?? ""} error={c.link}
        placeholder="https://open.spotify.com/…" />
      <Selector etiqueta="Modo" name="mode" opciones={MODOS} defaultValue={modo} onChange={setModo} error={c.mode} />
      {modo !== "disliked" && (
        <Selector etiqueta="Intensidad" name="intensity" opciones={INTENSIDADES} defaultValue={item?.intensity ?? "like"} />
      )}
      {modo === "disliked" && <input type="hidden" name="intensity" value="no_longer" />}

      {modo === "season" && !suposicion && (
        <>
          <Campo etiqueta="Empezó" name="startDate" type="date" defaultValue={item?.startDate ?? ""} error={c.startDate}
            ayuda="Si lo dejas vacío, empieza hoy" />
          <Campo etiqueta="Fin previsto (opcional)" name="expectedEnd" type="date" defaultValue={item?.expectedEnd ?? ""}
            error={c.expectedEnd} ayuda="Por ejemplo, «hasta diciembre»" />
        </>
      )}

      {modo === "recurring" && (
        <fieldset className="mb-3 @md:col-span-2">
          <legend className="etiqueta">Vuelve cada año en…</legend>
          <div className="flex flex-wrap">
            {MESES.map((m, i) => (
              <label key={m} className="opcion-pixel">
                <input type="checkbox" name="recurringMonths" value={i + 1} defaultChecked={item?.recurringMonths.includes(i + 1)} />
                <span>{m.slice(0, 3)}</span>
              </label>
            ))}
          </div>
          {c.recurringMonths && <p className="error-campo">{c.recurringMonths}</p>}
        </fieldset>
      )}

      <div className="@md:col-span-2">
        <MensajeEstado estado={estado} />
        <BotonPixel variante="primario" cargando="Guardando…" className="mt-2">
          {textoBoton}
        </BotonPixel>
      </div>
    </form>
  );
}
