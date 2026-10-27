"use client";

import { useActionState, useState } from "react";
import { Area, Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Avatar } from "@/components/pixel/Sprite";
import { AVATARES } from "@/components/pixel/sprites";
import { guardarPerfil } from "@/lib/acciones/ficha";
import type { UsuarioSesion } from "@/lib/auth/sesiones";

type Perfil = Pick<
  UsuarioSesion,
  "displayName" | "nickname" | "avatar" | "birthday" | "bio" | "allergies" | "giftSizes" | "giftColors"
>;

export function FormPerfil({ perfil }: { perfil: Perfil }) {
  const [estado, accion] = useActionState(guardarPerfil, null);
  const [avatar, setAvatar] = useState(perfil.avatar);
  const c = estado?.campos ?? {};
  return (
    <form action={accion}>
      <fieldset className="mb-4">
        <legend className="etiqueta">Avatar</legend>
        <div className="-mx-1 flex flex-wrap">
          {Object.entries(AVATARES).map(([id, a]) => (
            <label key={id} className="opcion-pixel" title={a.nombre}>
              <input type="radio" name="avatar" value={id} checked={avatar === id} onChange={() => setAvatar(id)} />
              <span className="p-1!">
                <Avatar id={id} escala={3} />
                <span className="sr-only-pixel">{a.nombre}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-x-4 @md:grid-cols-2">
        <Campo etiqueta="Nombre visible" name="displayName" defaultValue={perfil.displayName} required maxLength={40} error={c.displayName} />
        <Campo etiqueta="Apodo" name="nickname" defaultValue={perfil.nickname ?? ""} maxLength={30} error={c.nickname} />
        <Campo etiqueta="Cumpleaños" name="birthday" type="date" defaultValue={perfil.birthday ?? ""} error={c.birthday} />
        <Campo etiqueta="Frase corta" name="bio" defaultValue={perfil.bio ?? ""} maxLength={140} error={c.bio} placeholder="Siempre con hambre" />
      </div>
      <Area etiqueta="Alergias y restricciones alimentarias" name="allergies" defaultValue={perfil.allergies ?? ""} maxLength={300} error={c.allergies} />
      <h3 className="mt-5 mb-3">Datos para regalos (solo amigos)</h3>
      <div className="grid gap-x-4 @md:grid-cols-2">
        <Campo etiqueta="Tallas" name="giftSizes" defaultValue={perfil.giftSizes ?? ""} maxLength={200} error={c.giftSizes} placeholder="Camiseta M, zapato 25…" />
        <Campo etiqueta="Colores favoritos" name="giftColors" defaultValue={perfil.giftColors ?? ""} maxLength={200} error={c.giftColors} placeholder="Verde menta, negro" />
      </div>
      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Guardando…" className="mt-3">
        Guardar perfil
      </BotonPixel>
    </form>
  );
}
