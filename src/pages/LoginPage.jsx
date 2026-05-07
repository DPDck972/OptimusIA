import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import "../components/Login/login.css";

import {
  LoginCondition,
  RegisterCondition,
  LoginHeader,
  LoginForm,
  RegisterForm,
  LoginNavBar,
} from "../components/Login";

import Footer from "../components/Footer";

function LoginPage() {
  const { login } = useContext(UserContext);
  const [username, setUsername] = useState("");
  const updateName = (e) => setUsername(e.target.value);

  const [isUserLogging, setIsUserLogging] = useState(true);

  const [password, setPassword] = useState("");
  const updatePassword = (e) => setPassword(e.target.value);

  const [email, setEmail] = useState("");
  const updateEmail = (e) => {
    setEmail(e.target.value);
    if (errorMessage) setErrorMessage("");
  };

  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");

  const handleLoginAction = async () => {
    const loggedUser = await LoginCondition(email, password);

    if (loggedUser) {
      setErrorMessage("");
      login(loggedUser.nome, loggedUser.email);
      navigate("/home");
    } else {
      setErrorMessage("E-mail ou senha incorretos.");
    }
  };

  const handleRegisterAction = async () => {
    setRegisterMessage("");
    const registration = await RegisterCondition(username, email, password);

    if (registration && registration.success) {
      setIsUserLogging(true);
      const bancoDeDadosManual = JSON.parse(
        localStorage.getItem("meus_usuarios_json") || "[]",
      );
      const newUser = {
        nome: username,
        email: email,
        senha: registration.hashPassword,
        dataCadastro: new Date().toLocaleDateString(),
      };
      bancoDeDadosManual.push(newUser);
      localStorage.setItem(
        "meus_usuarios_json",
        JSON.stringify(bancoDeDadosManual),
      );
      setUsername("");
      setEmail("");
      setPassword("");
      setErrorMessage("");
      setRegisterMessage("Usuário registrado com sucesso!");
    } else if (registration && registration.error) {
      setRegisterMessage(registration.error);
    }
  };

  return (
    <main className="login-screen-wrapper">
      <div className="login-container">
        <LoginHeader />
        <LoginNavBar
          isLogging={isUserLogging}
          setIsLogging={setIsUserLogging}
        />
        <form onSubmit={(e) => e.preventDefault()}>
          {isUserLogging ? (
            <div className="login-section">
              <LoginForm
                onUserInputChange={updateEmail}
                onPassInputChange={updatePassword}
              />
              {errorMessage && (
                <div className="error-message">{errorMessage}</div>
              )}
              <div className="button-container-login">
                <button type="button" onClick={handleLoginAction}>Entrar</button>
              </div>
            </div>
          ) : (
            <div className="register-section">
              <RegisterForm
                onUserInputRegister={updateName}
                onEmailInputRegister={updateEmail}
                onPassInputRegister={updatePassword}
              />
              {registerMessage && (
                <div className={`message ${registerMessage.includes("sucesso") ? "success" : "error"}`}>
                  {registerMessage}
                </div>
              )}
              <div className="button-container-register">
                <button type="button" onClick={handleRegisterAction}>Inscrever-se</button>
              </div>
            </div>
          )}
          <hr />
        </form>
        <Footer />
      </div>
    </main>
  );
}

export default LoginPage;
