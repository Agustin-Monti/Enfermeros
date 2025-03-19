"use client"

import { useRouter } from 'next/navigation';
import "./pending.css";


const SuccessPage = () => {
  const router = useRouter();

  const goToHome = () => {
    router.push('/');  // Redirige al inicio de la aplicación
  };

  return (
    <div className="status-container">
      <div className="status-card pending">
        <div className="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-help-circle"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 1 1 5.91 1c0 1.8-2 2-2 3" />
            <line x1="12" y1="17" x2="12" y2="17" />
          </svg>
        </div>
        <h1>¡Pago Pendiente!</h1>
        <p className="color">
          Estamos procesando tu pago. Recibirás una notificación cuando se confirme, o prueba reiniciar la pagina e intenta de nuevo.
        </p>
        <button onClick={goToHome} className="go-home-btn">
          Ir al Inicio
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;

