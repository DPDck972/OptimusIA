import "./LoginNavBar.css";

function LoginNavBar({ isLogging, setIsLogging }) {
  return (
    <div className="nav-bar-container">
      <button 
        className={`nav-button ${isLogging ? "active" : ""}`}
        onClick={() => setIsLogging(true)}
      >
        Login
      </button>
      <button 
        className={`nav-button ${!isLogging ? "active" : ""}`}
        onClick={() => setIsLogging(false)}
      >
        Cadastro
      </button>
    </div>
  );
}

export default LoginNavBar;