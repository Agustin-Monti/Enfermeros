"use client"

import { useRouter } from 'next/navigation';
import "./fail.css";


const SuccessPage = () => {
  const router = useRouter();

  const goToHome = () => {
    router.push('/');  // Redirige al inicio de la aplicación
  };

  return (
    <div className="status-container">
      <div className="status-card failure">
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
            className="feather feather-x-circle"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1>¡Pago Fallido!</h1>
        <p className="color">
          Algo salió mal al procesar tu pago. Por favor, inténtalo nuevamente o contáctanos para obtener ayuda.
        </p>
        <button onClick={goToHome} className="go-home-btn">
          Ir al Inicio
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;

