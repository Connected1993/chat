const baseUrl = "https://nordic-api-default-rtdb.firebaseio.com";

function registration(id = "registration") {
  window.event.preventDefault();

  const data = getDataForm(id);
  console.log(data);
  //   если форма прошла базовую проверку на заполненность полей, мин, макс символов и.т.д и пароли совпадают
  if (validationForm(id) && data.password === data.confirmPassword) {
    createUser(data);
  } else 
  {
    console.log('WTF');
  }
}

function getDataForm(id = null) {
  if (!id) return false;

  const data = {};

  [...document.querySelectorAll(`#${id} input[name]`)].forEach((field) => {
    // если инпут с атрибутом name=password || confirmPassword тогда мы хешируем значение в MD5
    if (field.name === "password" || field.name === "confirmPassword") {
      // хешируем пароль
      data[field.name] = MD5(field.value);
    } else {
      data[field.name] = field.value;
    }
  });

  return data;
}

function validationForm(id) {
  return true;
  const validation = [
    ...document.querySelectorAll(`#${id} input[name]`),
  ].filter((field) => {
    const length = field.value.length;
    const maxlength = +field.getAttribute("maxlength");
    const minlength = +field.getAttribute("minlength");

    field.nextElementSibling.classList.add("d-none");
    field.classList.remove("red-border");

    if (length === 0) {
      field.classList.add("red-border");
      field.nextElementSibling.classList.remove("d-none");
      field.nextElementSibling.innerText = "поле не может быть пустым";
      return true;
    }

    if (minlength && length < minlength) {
      field.classList.add("red-border");
      field.nextElementSibling.classList.remove("d-none");
      field.nextElementSibling.innerText =
        "длина поля не может быть меньше " + minlength;
      return true;
    }

    if (maxlength && length > maxlength) {
      field.classList.add("red-border");
      field.nextElementSibling.classList.remove("d-none");
      field.nextElementSibling.innerText =
        "длина поля не может быть больше " + maxlength;
      return true;
    }

    return false;
  });

  if (validation.length > 0) return false;

  return true;
}

function checkUserName(login) {
  return axios
    .get(`${baseUrl}/users.json?orderBy="login"&equalTo="${login}"`)
    .then((response) => {
      if (Object.keys(response.data).length > 0) {
        return response.data;
      } else {
        return false;
      }
    })
    .catch((error) => {
      console.log(error);
      return 1000;
    });
}

async function authorization(id = "authorization") {
  // отмена стандартного события для кнопки submit
  window.event.preventDefault();
  const data = getDataForm(id);

  if (!data) {
    console.log("ошибка сбора данных в форме " + id);
    return false;
  }

  if (data.login) {
    // ждем ответ от сервера с помощью ключевого слова await
    // await работает с функциями async
    const result = await checkUserName(data.login);
    // выводим ответ от сервера
    if (result === false) {
      Swal.fire("Нет такого пользователя!");
    } else {
      // достаем захешированный пароль из объекта result который вернул сервер
      const userId = Object.keys(result)[0];
      const password = Object.values(result)[0].password;
      const login = Object.values(result)[0].login;
      if (data.password === password) {
        Swal.fire("Вы успешно авторизовались!");
        // генерируем токен
        // если бы мы были на бекенде
        // сохраним в хранилище имя пользователя
        localStorage.setItem("user", JSON.stringify({ userId, login }));
        // скрываем формы
        hideForms();
        // отображаем чат
        document.querySelector(".chat")?.classList.remove("d-none");
      } else {
        // удаляем из хранилища юзера
        localStorage.removeItem("user");
        Swal.fire("Не верный логин или пароль!");
      }
    }
  } else {
    Swal.fire("ой ошибка =(");
    console.log("нет инпута с name=login");
  }
}

function codeStatus(code) {
  const statuses = {
    1000: "Ошибка проверки имени пользователя",
  };

  return statuses[code];
}

async function createUser(data) {
  const isUser = await checkUserName(data.login);

  if (codeStatus(isUser)) {
    Swal.fire(codeStatus(isUser));
    return false;
  }

  if (isUser) {
    Swal.fire(`пользователь ${data.login} уже существует!`);
    return false;
  }
  const isReg = await axios
    .post(`${baseUrl}/users.json`, data)
    .then((response) => {
      if (Object.keys(response.data).length > 0) return true;
      return false;
    })
    .catch((error) => false);

  if (isReg) Swal.fire(`Поздравляю вы успешно зарегистрированы!`);
}
