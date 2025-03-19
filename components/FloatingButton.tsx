import Link from "next/link";

export default function FloatingButton() {
  return (
    <Link
      href="/demandas/new"
      className="bg-blue-500 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 border-2 border-transparent animate-border-pulse"
    >
      Publica gratis tu Necesidad

      {/* Líneas animadas que sobresalen */}
      <div className="line top-left"></div>
      <div className="line top-right"></div>
      <div className="line bottom-left"></div>
      <div className="line bottom-right"></div>
    </Link>
  );
}