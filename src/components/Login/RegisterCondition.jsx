import bcrypt from "bcryptjs";

function RegisterCondition(username, email, password) {
  const dataBase = JSON.parse(
    localStorage.getItem("meus_usuarios_json") || "[]",
  );

  if (!username.trim() || !email.trim() || !password.trim()) {
    return { success: false, error: "Por favor, preencha todos os campos." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Por favor, insira um e-mail válido." };
  }

  const userFound = dataBase.find((user) => user.email === email);
  if (userFound) {
    return { success: false, error: "E-mail já cadastrado." };
  }

  if (password.length < 6) {
    return { success: false, error: "Sua senha deve conter no mínimo 6 dígitos." };
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  return { success: true, hashPassword };
}

export default RegisterCondition;
