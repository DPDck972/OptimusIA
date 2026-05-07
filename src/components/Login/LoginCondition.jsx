import bcrypt from "bcryptjs";

function LoginCondition(email, password) {
  //pega os usuarios do local storage.
  const dataBase = JSON.parse(
    localStorage.getItem("meus_usuarios_json") || "[]",
  );
  const userFound = dataBase.find((user) => user.email === email);
  if (!userFound) {
    return false;
  }
  const isMatch = bcrypt.compareSync(password, userFound.senha);
  if (!isMatch) {
    return false;
  }

  return userFound;
}

export default LoginCondition;
