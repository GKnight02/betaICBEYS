/** Batería de energía en 3 niveles. */
export function Bateria({ nivel, escala = 3 }: { nivel: number; escala?: number }) {
  const color = nivel <= 1 ? "var(--rojo)" : nivel === 2 ? "var(--amarillo)" : "var(--verde)";
  const px = escala;
  return (
    <span
      role="img"
      aria-label={`Energía ${nivel} de 3`}
      className="inline-flex items-center align-middle"
      style={{ gap: 0 }}
    >
      <span
        className="inline-flex"
        style={{
          padding: px * 2,
          gap: px,
          background: "var(--negro)",
          boxShadow: `0 0 0 ${px}px var(--blanco) inset`,
        }}
      >
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{ width: px * 3, height: px * 5, background: i <= nivel ? color : "var(--noche)" }}
          />
        ))}
      </span>
      <span style={{ width: px, height: px * 3, background: "var(--blanco)" }} />
    </span>
  );
}
