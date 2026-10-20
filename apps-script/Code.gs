/*
 * КОД ДЛЯ GOOGLE APPS SCRIPT — заявки только в таблицу
 *
 * Скрипт привязан к таблице (создан через Расширения → Apps Script),
 * поэтому ID таблицы указывать НЕ нужно — скрипт знает её сам.
 *
 * КУДА ВСТАВЛЯТЬ:
 *   Откройте ТАБЛИЦУ с заявками → Расширения → Apps Script → файл «Код»
 *   Выделите всё (Ctrl+A), удалите, вставьте этот файл целиком.
 *
 * ВАЖНО: сюда нельзя вставлять js/config.js и js/script.js — это код сайта,
 * он работает в браузере, а в Apps Script падает с ошибкой
 * «window is not defined».
 *
 * ПОСЛЕ ВСТАВКИ:
 *   1) Сохранить (Ctrl+S)
 *   2) В списке функций выбрать doPost → «Запустить» → разрешить доступ
 *   3) Развернуть → Новое развертывание → Веб-приложение
 *      → Выполнять от моего имени → Доступ: Любой
 *   4) Скопировать URL развёртывания в config.js → form.endpoint
 */


/**
 * Обрабатывает заявку с сайта.
 * Тело приходит как JSON-строка: сайт шлёт Content-Type: text/plain,
 * чтобы браузеру не нужно было делать CORS-preflight.
 */
function doPost(e) {
  var data = JSON.parse(e.postData.contents || '{}');

  // Honeypot: скрытое поле, которое заполняют только боты. Молча выходим.
  if (data.website) return ContentService.createTextOutput('ok');

  // Скрипт привязан к таблице, поэтому берём её напрямую.
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // При первом запуске таблица пустая — добавляем заголовки.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Дата', 'Имя', 'Фамилия', 'Email', 'Откуда пришли', 'Страница']);
  }

  sheet.appendRow([
    new Date().toLocaleString('ru-RU'),
    data.firstName || '',
    data.lastName  || '',
    data.email     || '',
    data.source    || '',
    data.page      || ''
  ]);

  return ContentService.createTextOutput('ok');
}


/**
 * Открывается при переходе на адрес скрипта.
 * Служит проверкой: если видно «Форма работает» — скрипт не падает.
 */
function doGet() {
  return ContentService.createTextOutput('Форма работает');
}
