import { Transicion } from "@/components/Transicion";

// Solo se anima el contenido: la navegación (fija) queda fuera del transform
export default function Template({ children }: { children: React.ReactNode }) {
  return <Transicion>{children}</Transicion>;
}
