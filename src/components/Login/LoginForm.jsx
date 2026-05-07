import "./login.css";
function LoginForm({ onUserInputChange, onPassInputChange }) {
  return (
    <section>
      <div className="login-input">
        <p>E-mail</p>
        <input
          onChange={onUserInputChange}
          type="text"
          placeholder="seuemail@email.com"
        />
        <p>Senha</p>
        <input
          onChange={onPassInputChange}
          type="password"
          placeholder="senha123"
        />
      </div>
    </section>
  );
}
export default LoginForm;
