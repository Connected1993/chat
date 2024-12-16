const URL = "https://nordic-api-default-rtdb.firebaseio.com";
const TABLE = "messages.json";
const MESSAGE = document.querySelector(".chat__message");
const CHAT_BODY = document.querySelector(".chat__body");
const PANEL = document.querySelector(".chat__panel");
const USER_MESSAGE = document.getElementById("message-1").content.children[0];
const OTHER_MESSAGE = document.getElementById("message-2").content.children[0];
const MIN_LENGTH = 1;
let JOURNAL_MESSAGES = {};

window._chat = {}
window._chat.JOURNAL_MESSAGES = JOURNAL_MESSAGES;
window._chat.addEmodji = addEmodji;
window._chat.sendMessage = sendMessage;

MESSAGE.addEventListener("keyup", (e) => {
  const text = e.target.textContent.trim();

  if (text.length === MIN_LENGTH){
    PANEL.querySelector('.error').textContent=`Длина должна быть > ${MIN_LENGTH}`;
    PANEL.querySelector('.error').classList.remove('d-none');
    return false;
  }
  else
  {
    PANEL.querySelector('.error').classList.add('d-none');
  }

  // Win + Mac + Linux
  if (e.ctrlKey && e.code === 'Enter') {
    // если длина сообщения
    if (text.length >= MIN_LENGTH) {
      sendMessage(text);
    } 
  }
});

function addEmodji(emodji){
  MESSAGE.textContent += emodji;
}

function sendMessage(text) {
  // получаем сообщение на прямую
  if (!text) text = MESSAGE.textContent;

  axios
    .post(`${URL}/${TABLE}`, {
      text: text,
      user: getUserId(),
      date: Date.now(),
      login: getUserName(),
    })
    .then((response) => console.log(response))
    .catch((error) => console.log(error));

    // clear 
    MESSAGE.textContent = '';
}
// получаем все сообщения
export function getMessages() {
  // https://nordic-api-default-rtdb.firebaseio.com/messages.json?orderBy=%22date%22&limitToLast=10
  //console.log(`${URL}/${TABLE}?orderBy="date"`)
  axios
  .get(`${URL}/${TABLE}?orderBy="date"`)
  .then(response=> {
      // если есть хоть 1 сообщение в массиве
      if ( Object.keys(response.data).length > 0 && response.status === 200 ) {
         renderMessages(response.data)
      }
  })
  .catch(error=>console.log(error))
}

window.getMessages = getMessages;

export function renderMessages(data = {}) {
    Object.keys(data).forEach(id => {
      data[id].id = id;
    });

    Object.values(data).forEach(message=>{
      if (!JOURNAL_MESSAGES[message.id]) {
        let clone = null;
        // если login текущего сообщения === getUserName() 
        if (message.login === getUserName()){
            // клонируем шаблон сообщения
            clone = USER_MESSAGE.cloneNode(true);
        }
        else
        {
            // клонируем шаблон сообщения
            clone = OTHER_MESSAGE.cloneNode(true);
        }
          // меняем содержимое текста в блоке
          clone.querySelector('.chat__login').textContent = message.login;
          clone.querySelector('.chat__text').textContent = message.text;
          clone.querySelector('.chat__time').textContent = formatUnixTime(message.date);
          // вставляем клон в верстку
          CHAT_BODY.append(clone);
          // записываем id сообщение в журнал
          JOURNAL_MESSAGES[message.id] = 1;
      }  
    })
}
function formatUnixTime(unixTime) {
  const date = new Date(unixTime); // Преобразуем Unix timestamp в объект Date
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat('ru', options); // Форматируем в российском стиле
  return formatter.format(date);
}


setInterval(getMessages,1000);