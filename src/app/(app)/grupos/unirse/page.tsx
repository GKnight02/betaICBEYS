import type { Metadata } from "next";
import { Sprite } from "@/components/pixel/Sprite";
import { COFRE } from "@/components/pixel/sprites";
import { Ventana } from "@/components/pixel/Ventana";
import { FormUnirse } from "../FormsGrupo";

export const metadata: Metadata = { title: "Unirse a un grupo" };

// El enlace solo rellena el código: unirse siempre requiere pulsar el botón (POST)
export default async function Unirse({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const { codigo } = await searchParams;
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <Ventana titulo="Te han invitado a un grupo" className="aparecer w-full max-w-lg">
        <div className="flotar mb-4 inline-block">
          <Sprite sprite={COFRE} escala={4} fps={1} />
        </div>
        <FormUnirse codigo={codigo?.slice(0, 20) ?? ""} />
      </Ventana>
    </div>
  );
}
