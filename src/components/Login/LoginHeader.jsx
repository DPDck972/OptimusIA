import "./login.css";
import logo from "../../assets/logo-optimus.png";

function LoginHeader() {
  return (
    <header className="login-header-main">
      <img src={logo} alt="LogoOptimus" className="login-header-logo" />
      <div className="login-header-text">
        <h1>Optimus IA</h1>
        <p>Sistema Orçamentário</p>
      </div>
    </header>
  );
}

export default LoginHeader;
