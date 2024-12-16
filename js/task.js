const baseUrl = "https://nordic-api-default-rtdb.firebaseio.com";

// содержит в себе элемент ul со всеми элементами
const MESSAGES = document.querySelector("#messages");
const TITLE = document.querySelector("#title");
// поле ввода задачи
const INPUT = document.querySelector("#task");
// элемент для вывода ошибки
const OUTPUT_ERROR = document.querySelector(".error");
const MAX_LENGTH = 4;

// на элемент устанавливаю событие
// будет запускаться функция test
MESSAGES.addEventListener("click", mark);
// проверка на пустоту
INPUT.addEventListener("keyup", function (Event) {
  // получаем код нажатой клавиши
  let key = Event.keyCode;

  if (INPUT.value.length < MAX_LENGTH) {
    OUTPUT_ERROR.textContent = `минимум ${MAX_LENGTH} символа`;
    INPUT.classList.remove("success");
  } else {
    OUTPUT_ERROR.textContent = "";
    INPUT.classList.add("success");
  }

  // если нажали Enter
  if (key === 13) {
    addTask();
  }
});

function mark(e) {
  // получаем элемент на который мы нажали
  let elem = e.target;
  //elem.classList.toggle("taskDone");
}

// добавить задачу в список
function addTask() {
  // получили содержимое инпута и записали в переменную text
  const title = TITLE.value;
  const text = INPUT.value;
  // если меньше MAX_LENGTH тогда выходим из функции
  if (text.length < MAX_LENGTH) {
    OUTPUT_ERROR.textContent = `минимум ${MAX_LENGTH} символа`;
    return false;
  }

  axios
    .post(baseUrl + "/tasks.json", {
      title: TITLE.value,
      text: INPUT.value,
    })
    .then((succes) => {
      // если все ок
      if (succes.status === 200 && succes.data) {
        const id = succes.data.name;
        // вызываем функцию отрисовки таска
        // формуруем объект
        // [id] это ключ  -OCZPTXvlKDeingGKTm2
        renderTasks({ [id]: { title, text } });
      }
    })
    // если не ок
    .catch((error) => console.log(error));

  // очищаем содержимое
  TITLE.value = "";
  INPUT.value = "";
  OUTPUT_ERROR.textContent = "";
}

function getTasks() {
  axios
    .get(baseUrl + "/tasks.json")
    .then((response) => {
      // если данные пришли и там что-то есть
      if (response.status === 200 && response.data) {
        // вызываем фн для отрисовки сообщений
        renderTasks(response.data);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

function renderTasks(data) {
  // перебераем объект с данными
  for (let key in data) {
    MESSAGES.insertAdjacentHTML(
      "beforeend",
      `
      <div id="${key}">
        <div style="display:flex; justify-content:space-between;">
          <div class="constructor">
            <div class="preview">
              <h1 class="title" data-default="${data[key].title}">${data[key].title}</h1>
              <p  class="text" data-default="${data[key].text}">${data[key].text}</p>
            </div>
            <div class="editable d-none">
              <input type="text" data-default="${data[key].title}" value="${data[key].title}" oninput="changeTask(this)" data-view="title">
              <div></div>
              <input type="text" data-default="${data[key].text}" value="${data[key].text}" oninput="changeTask(this)" data-view="text">  
            </div>
          </div>
          <div class="panel" style="display:flex; justify-content:end; flex-direction:column; row-gap:5px;">
            <button btn-delete style="cursor:pointer;" onclick="removeTask('${key}')">Удалить</button>
            <button btn-edit class="" style="cursor:pointer;" onclick="editTask('${key}')">Редактировать</button>
            <button btn-save class="d-none" style="cursor:pointer;" onclick="saveChangeTask('${key}')">Сохранить</button>
            <button btn-cancel class="d-none" style="cursor:pointer;" onclick="cancelChangeTask('${key}')">Отменить</button>
          </div>
        </div>
        <hr>
      </div>
    `
    );

    let elem = document.querySelector(`#${key} h1`);
  }
}

function showButtonsPanel(id) {
  document.querySelector(`#${id} .editable`).classList.toggle("d-none");

  const buttons = ["edit", "delete", "save", "cancel"];

  buttons.forEach((action) => {
    document
      .querySelector(`#${id} .panel button[btn-${action}]`)
      .classList.toggle("d-none");
  });
}

function saveChangeTask(id) {
  const newData = {};

  // инпуты в которых было изменение
  [...document.querySelectorAll(`#${id} .editable [data-new]`)].forEach(
    (input) => {
      const key = input.dataset.view;
      newData[key] = input.value;
    }
  );

  if (!newData) return false;

  axios
    .patch(baseUrl + `/tasks/${id}.json`, newData)
    .then((succes) => {
      if (succes.status === 200) {
        [...document.querySelectorAll(`#${id} .editable [data-new]`)].forEach(
          (input) => {
            input.dataset.default = input.value;
          }
        );
        // скрываем панель редактирования
        showButtonsPanel(id);
      }
    })
    .catch((error) => console.log(error));
}

function editTask(id) {
  if (!id) return false;
  showButtonsPanel(id);
}

function cancelChangeTask(id) {
  if (!id) return false;
  showButtonsPanel(id);
  // находим все элементы , достаем значение из атрибута и перезаписываем
  [...document.querySelector(`#${id} .preview`).children].forEach((child) => {
    child.textContent = child.dataset.default;
  });
  // сбрасываем инпуты
  [...document.querySelector(`#${id} .editable`).children].forEach((child) => {
    child.value = child.dataset.default;
    child.removeAttribute("data-new");
  });
}

function changeTask(input) {
  const val = input.value;
  const searchNameClass = "." + input.dataset.view;
  // перерисовываем значение у тегов
  input
    .closest(".constructor")
    .querySelector(`${searchNameClass}`).textContent = val;

  input.dataset.new = val;
}

function removeTask(id) {
  if (!id) return false;

  Swal.fire({
    title: "Вы точно хотите удалить эту запись?",
    showDenyButton: true,
    confirmButtonText: "Да",
    denyButtonText: `Отмена`,
  }).then((result) => {
    if (result.isConfirmed) {
      axios
        .delete(`${baseUrl}/tasks/${id}.json`)
        .then((response) => {
          if (response.status === 200) {
            // удаляем с верстки
            document.getElementById(id).remove();
            Swal.fire({
              position: "top-end",
              backdrop: false,
              background: "#bfeebf",
              text: "Успешно!",
              width: "auto",
              padding: "5px",
              showConfirmButton: false,
              timer: 1500,
              willOpen: () => {
                document.querySelector(
                  ".swal2-html-container"
                ).style.padding = 0;
              },
            });
          }
        })
        .catch((error) =>
          Swal.fire({
            position: "top-end",
            icon: "danger",
            title: "Ошибка!",
            showConfirmButton: false,
            timer: 1500,
          })
        );
    } else if (result.isDenied) {
      Swal.fire("Changes are not saved", "", "info");
    }
  });
}

// при загрузке страницы запускам нашу функцию
window.onload = getTasks();
