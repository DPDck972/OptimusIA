import logo from "../../assets/logo-optimus.png";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { useContext } from "react";
import "./home.css";
function HomeHeader() {
  const { userEmail, logout } = useContext(UserContext);

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="header-home">
      <header>
        <img src={logo} alt="LogoOptimus" className="header-logo" />
        <div className="header-text-container">
          <h1>Optimus IA</h1>
          <p>Sistema Orçamentário - Assistente Inteligente</p>
          <p>
            {userEmail} <button onClick={handleLogout}>Sair</button>{" "}
          </p>
        </div>
      </header>
    </div>
  );
}
export default HomeHeader;
