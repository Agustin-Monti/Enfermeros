import { Roboto } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image'; // Importar el componente Image para el logo

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
});

export default async function Index() {
  return (
    <>
      <main
        className={`${roboto.className} min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600`}
      >
        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/logo.png" // Ruta de tu logo (debe estar en la carpeta public)
            alt="Logo de OLEM"
            width={150} // Ancho del logo
            height={150} // Alto del logo
            className="" // Estilos adicionales para el logo
          />
        </div>

        {/* Título y descripción */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 hover:underline">
            Bienvenido a OLEM
          </h1>
          <p className="text-lg text-gray-200">
            Organizador Laboral Enfermeros Mansilla
          </p>
        </div>

        {/* Botón de Iniciar Sesión */}
        <div className="mt-4">
          <Link
            href="/sign-in"
            className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-gray-100 transition duration-300"
          >
            Iniciar Sesión
          </Link>
        </div>
      </main>
    </>
  );
}