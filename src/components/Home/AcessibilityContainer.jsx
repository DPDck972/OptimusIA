import { useContext, useState } from "react";
import { UserContext } from "../../context/UserContext";
import "./home.css";

function AcessibilityContainer() {
  const { isHighContrast, toggleHighContrast } = useContext(UserContext);
  const [_, setFontSize] = useState(100);

  const changeFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.min(Math.max(prev + delta, 80), 150);
      document.documentElement.style.fontSize = `${next}%`;
      return next;
    });
  };

  return (
    <div className="acessibility-container">
      <p>
        Acessibilidade:
        <button onClick={() => changeFontSize(10)} aria-label="Aumentar fonte">A+</button>
        <button onClick={() => changeFontSize(-10)} aria-label="Diminuir fonte">A-</button>
        <button onClick={toggleHighContrast} aria-label="Alternar alto contraste">
          {isHighContrast ? "Contraste: ON" : "Contraste"}
        </button>
        <button onClick={() => window.speechSynthesis?.cancel()} aria-label="Parar voz">Voz</button>
        <button aria-label="Libras">Libras</button>
      </p>
    </div>
  );
}

export default AcessibilityContainer;
