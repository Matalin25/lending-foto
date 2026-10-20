/* ==========================================================================
   ЛЕНДИНГ ФОТОГРАФА — логика
   Зависит от js/config.js (window.SITE). Без зависимостей и сборки.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE || {};
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------
     1. Подстановка данных из конфига
     ------------------------------------------------------------------ */
  function telegramLink() {
    return 'https://t.me/' + String(CFG.telegram || '').replace(/^@/, '');
  }

  function whatsappLink() {
    var n = String(CFG.whatsapp || '').replace(/\D/g, '');
    return 'https://wa.me/' + n;
  }

  /* Месяц в предложном падеже — «на октябре» */
  var MONTHS = ['январе','феврале','марте','апреле','мае','июне',
                'июле','августе','сентябре','октябре','ноябре','декабре'];

  function currentMonth() {
    return MONTHS[new Date().getMonth()];
  }

  /* Согласование слова: 1 окно / 2 окна / 5 окон */
  function plural(n, one, few, many) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
    return many;
  }

  function slotsText() {
    var n = CFG.freeSlots || 2;
    var base = 'Осталось ' + n + ' ' + plural(n, 'окно', 'окна', 'окон') + ' на ' + currentMonth();
    return CFG.freeSlotsNote ? base + ', ' + CFG.freeSlotsNote : base;
  }

  function fillConfig() {
    // Ссылки
    $$('[data-cfg-telegram]').forEach(function (el) { el.href = telegramLink(); });
    $$('[data-cfg-whatsapp]').forEach(function (el) { el.href = whatsappLink(); });
    $$('[data-cfg-calendar]').forEach(function (el) {
      if (CFG.calendarUrl) el.href = CFG.calendarUrl;
    });

    // Простые текстовые поля
    $$('[data-cfg="name"]').forEach(function (el) { el.textContent = CFG.name || ''; });
    $$('[data-cfg="role"]').forEach(function (el) { el.textContent = CFG.role || ''; });
    $$('[data-cfg-name]').forEach(function (el) { el.textContent = CFG.name || ''; });
    $$('[data-cfg-city]').forEach(function (el) {
      el.textContent = (CFG.city || '') + ' ' + (CFG.area || '');
    });
    $$('[data-cfg-cityonly]').forEach(function (el) { el.textContent = CFG.city || ''; });
    $$('[data-cfg-month]').forEach(function (el) { el.textContent = currentMonth(); });
    $$('[data-cfg-slots]').forEach(function (el) { el.textContent = slotsText(); });
    $$('[data-cfg-price-note]').forEach(function (el) { el.textContent = CFG.currencyNote || ''; });

    // Кнопка в шапке: короче, чем в hero. Текст в hero не трогаем.
    $$('.nav__cta').forEach(function (el) {
      var t = el.querySelector('span');
      if (t) t.textContent = 'Забронировать созвон';
      el.setAttribute('aria-label', CFG.callButtonText || 'Забронировать созвон');
    });

    // Метаданные
    if (CFG.seo) {
      if (CFG.seo.title) document.title = CFG.seo.title;
      var desc = $('meta[name="description"]');
      if (desc && CFG.seo.description) desc.setAttribute('content', CFG.seo.description);
    }

    // Год в подвале
    var year = $('#year');
    if (year) year.textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------
     2. Галерея: before / after
     Наведение мыши — на десктопе, удержание — на тач-устройствах.
     ------------------------------------------------------------------ */
  function buildGallery() {
    var grid = $('#gallery-grid');
    var photos = CFG.photos || [];
    if (!grid || !photos.length) return;

    var html = photos.map(function (p, i) {
      var after =
        '<img src="' + p.src + '" alt="' + (p.alt || '') + '" width="1200" height="1500"' +
        (p.srcset ? ' srcset="' + p.srcset + '" sizes="(max-width:640px) 100vw, (max-width:1080px) 50vw, 33vw"' : '') +
        ' loading="lazy" decoding="async">';

      // «До»: отдельный файл, если он есть; иначе — тот же кадр с нейтральной обработкой
      var before = p.before
        ? '<img src="' + p.before + '" alt="" aria-hidden="true" width="1200" height="1500" loading="lazy" decoding="async">'
        : '<img src="' + p.src + '" alt="" aria-hidden="true" width="1200" height="1500" loading="lazy" decoding="async">';

      return (
        '<button class="shot reveal" type="button" data-index="' + i + '" data-delay="' + (i % 3) + '"' +
        ' aria-label="Показать кадр до цветокоррекции: ' + (p.alt || 'фото') + '">' +
          '<span class="shot__before">' + before + '</span>' +
          after +
          '<span class="shot__tag">До / после</span>' +
          '<span class="shot__caption">' + (p.alt || '') + '</span>' +
        '</button>'
      );
    }).join('');

    grid.innerHTML = html;
    grid.setAttribute('data-loaded', 'true');

    // Наведение мышью
    $$('.shot', grid).forEach(function (shot) {
      shot.addEventListener('mouseenter', function () { shot.classList.add('is-before'); });
      shot.addEventListener('mouseleave', function () { shot.classList.remove('is-before'); });
      shot.addEventListener('focus',      function () { shot.classList.add('is-before'); });
      shot.addEventListener('blur',       function () { shot.classList.remove('is-before'); });
    });

    // Удержание пальцем
    var pressTimer = null;
    function releaseAll() {
      $$('.shot.is-before', grid).forEach(function (s) { s.classList.remove('is-before'); });
    }

    grid.addEventListener('touchstart', function (e) {
      var shot = e.target.closest ? e.target.closest('.shot') : null;
      if (!shot) return;
      releaseAll();
      shot.classList.add('is-before');
      clearTimeout(pressTimer);
    }, { passive: true });

    ['touchend', 'touchcancel', 'scroll'].forEach(function (evt) {
      window.addEventListener(evt, function () {
        clearTimeout(pressTimer);
        pressTimer = setTimeout(releaseAll, evt === 'scroll' ? 0 : 120);
      }, { passive: true });
    });

    // Клик/Enter переключает состояние
    grid.addEventListener('click', function (e) {
      var shot = e.target.closest ? e.target.closest('.shot') : null;
      if (!shot) return;
      if (matchMedia('(hover: hover)').matches) return; // на десктопе работает наведение
      shot.classList.toggle('is-before');
    });

    observeReveal(grid);
  }

  /* ------------------------------------------------------------------
     3. Таблица цен на тегах <table>
     ------------------------------------------------------------------ */
  function buildPrices() {
    var table = $('#prices-table');
    var prices = CFG.prices || [];
    if (!table) return;
    var tbody = table.querySelector('tbody');

    tbody.innerHTML = prices.map(function (p) {
      var features = (p.features || []).map(function (f) {
        return '<li>' + f + '</li>';
      }).join('');

      return (
        '<tr>' +
          '<th scope="row">' +
            '<span class="prices__name">' + p.name + '</span>' +
            (p.badge ? '<span class="prices__badge">' + p.badge + '</span>' : '') +
          '</th>' +
          '<td data-label="Длительность">' + p.duration + '</td>' +
          '<td data-label="Что входит">' +
            '<ul class="prices__features">' + features + '</ul>' +
            (p.note ? '<span class="prices__note-cell">' + p.note + '</span>' : '') +
          '</td>' +
          '<td data-label="Стоимость"><span class="prices__value">' + p.price + '</span></td>' +
          '<td class="prices__cell--cta">' +
            '<a class="btn btn--outline" href="' + telegramLink() + '" target="_blank" rel="noopener">' +
              'Забронировать' +
            '</a>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  /* ------------------------------------------------------------------
     4. Отзывы с микроразметкой Schema.org (Review)
     ------------------------------------------------------------------ */
  function buildReviews() {
    var grid = $('#reviews-grid');
    var reviews = CFG.reviews || [];
    if (!grid) return;

    var stars = function (n) {
      var out = '';
      for (var i = 0; i < 5; i++) {
        out += i < n
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.7-5.3 4.7 1.5 7L12 17.3 5.8 21l1.5-7L2 9.3l7.1-.7L12 2z"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true" style="opacity:.25"><path d="M12 2l2.9 6.6 7.1.7-5.3 4.7 1.5 7L12 17.3 5.8 21l1.5-7L2 9.3l7.1-.7L12 2z"/></svg>';
      }
      return '<div class="review__stars" aria-hidden="true">' + out + '</div>';
    };

    grid.innerHTML = reviews.map(function (r) {
      var initial = (r.author || '?').trim().charAt(0).toUpperCase();
      var date = r.date || new Date().toISOString().slice(0, 10);
      return (
        '<figure class="review reveal" ' +
             'itemscope itemtype="https://schema.org/Review" itemid="review-' + slug(r.author) + '">' +
          '<meta itemprop="datePublished" content="' + date + '">' +
          '<meta itemprop="itemReviewed" itemtype="https://schema.org/Person" content="' + (CFG.name || 'Фотограф') + '">' +
          '<div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">' +
            '<meta itemprop="worstRating" content="1">' +
            '<meta itemprop="bestRating" content="5">' +
            '<meta itemprop="ratingValue" content="' + (r.rating || 5) + '">' +
            stars(r.rating || 5) +
          '</div>' +
          '<blockquote class="review__text" itemprop="reviewBody">' + r.text + '</blockquote>' +
          '<figcaption class="review__author">' +
            '<span class="review__avatar" aria-hidden="true">' + initial + '</span>' +
            '<span>' +
              '<span class="review__name" itemprop="author" itemscope itemtype="https://schema.org/Person">' +
                '<span itemprop="name">' + r.author + '</span>' +
              '</span>' +
              '<span class="review__meta">' + (r.meta || '') + '</span>' +
            '</span>' +
          '</figcaption>' +
        '</figure>'
      );
    }).join('');

    observeReveal(grid);
  }

  function slug(s) {
    return String(s || 'a').toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-|-$/g, '');
  }

  /* ------------------------------------------------------------------
     5. Появление блоков при скролле
     ------------------------------------------------------------------ */
  var revealObserver = null;

  function observeReveal(root) {
    var items = $$('.reveal:not(.is-in)', root || document);
    if (!items.length) return;

    items.forEach(function (el) {
      if (el.dataset.delay) el.style.setProperty('--d', el.dataset.delay);
    });

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }

    items.forEach(function (el) { revealObserver.observe(el); });
  }

  /* Страховка: если по какой-то причине IntersectionObserver не сработал
     (старый браузер, отключённый скрипт, экзотика), блоки всё равно появятся.
     Проверяем только те элементы, до которых дошла прокрутка. */
  var revealTicking = false;

  function manualReveal() {
    revealTicking = false;
    var limit = window.innerHeight * 0.92;
    $$('.reveal:not(.is-in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < limit && r.bottom > 0) {
        el.classList.add('is-in');
        if (revealObserver) revealObserver.unobserve(el);
      }
    });
  }

  function onScrollReveal() {
    if (revealTicking) return;
    revealTicking = true;
    window.requestAnimationFrame(manualReveal);
  }

  /* ------------------------------------------------------------------
     6. Шапка, меню, «вверх»
     ------------------------------------------------------------------ */
  function initChrome() {
    var header = $('#header');
    var toTop  = $('#to-top');
    var burger = $('#burger');
    var nav    = $('#nav');

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('is-stuck', y > 24);
      if (toTop)  toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // страховка для появления блоков
    window.addEventListener('scroll', onScrollReveal, { passive: true });
    window.addEventListener('resize', onScrollReveal, { passive: true });
    window.addEventListener('load', onScrollReveal);
    manualReveal();

    function closeNav() {
      if (!nav || !burger) return;
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
    }

    if (burger) {
      burger.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        document.body.classList.toggle('nav-open', open);
      });
    }

    $$('#nav a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ------------------------------------------------------------------
     7. Плавный переход к форме идёт по CSS (scroll-behavior).
        Дополнительно подставляем utm-метку в ссылки мессенджеров,
        чтобы видеть, откуда пришёл клиент.
     ------------------------------------------------------------------ */
  function initTracking() {
    var params = new URLSearchParams(window.location.search);

    // Метки рекламы — приклеиваем к заявке, чтобы видеть канал
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid', 'src'].forEach(function (k) {
      var v = params.get(k);
      if (v) utm[k] = v;
    });

    var src = params.get('utm_source') || params.get('src');
    if (!src) return;

    $$('[data-cfg-telegram], [data-cfg-whatsapp]').forEach(function (el) {
      try {
        var u = new URL(el.href);
        u.searchParams.set('src', src);
        el.href = u.toString();
      } catch (err) { /* невалидная ссылка — оставляем как есть */ }
    });
  }

  /* ------------------------------------------------------------------
     8. Форма заявки: открытие, валидация, отправка
     ------------------------------------------------------------------ */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Zа-яА-Я]{2,}$/;

  var LEAD_COPY = {
    call: {
      eyebrow: 'Запись на созвон',
      title: 'Забронировать созвон на 15 минут',
      sub: 'Оставьте имя и email — ссылку пришлю в течение 2 минут. Без спама и обязательств.',
      submit: 'Получить ссылку на созвон',
      successTitle: 'Ссылка уже в почте',
      successSub: 'Проверьте входящие — письмо могло попасть в «Спам». На созвоне разберём вашу идею и подберём дату.',
      actions: 'messengers'
    },
    date: {
      eyebrow: 'Свободные окна',
      title: 'Забронировать дату съёмки',
      sub: 'Оставьте имя и email — покажу календарь и подтвержу бронь в течение 2 часов.',
      submit: 'Показать календарь',
      successTitle: 'Заявка принята',
      successSub: 'Выберите удобное время — после выбора я подтвержу бронь в течение 2 часов.',
      actions: 'calendar'
    }
  };

  var leadMode = 'call';
  var utm = {};

  function initLead() {
    var modal = $('#lead-modal');
    var form = $('#lead-form');
    if (!modal || !form) return;

    var cfg = CFG.form || {};

    if (cfg.consentText) {
      var consent = $('[data-consent]');
      if (consent) consent.textContent = cfg.consentText;
    }

    // Открытие по кнопкам. Без JS это обычная ссылка на #contacts.
    $$('[data-modal]').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        openModal(trigger.getAttribute('data-modal') || 'call');
      });
    });

    $('[data-close]', modal).addEventListener('click', closeModal);

    // Клик по затемнению вокруг окна тоже закрывает его
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // Убираем ошибки, как только пользователь начал исправлять
    form.addEventListener('input', function (e) {
      var field = e.target.name;
      if (!field) return;
      setError(field, '');
      var status = $('#lead-status');
      if (status) status.textContent = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitLead();
    });

    function setError(name, message) {
      var box = $('[data-error-for="' + name + '"]');
      var input = form.elements[name];
      if (box) {
        box.textContent = message || '';
        box.classList.toggle('is-shown', !!message);
      }
      if (input) {
        if (message) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    function validate() {
      var data = readForm();
      var errors = {};

      if (!data.firstName) errors.firstName = 'Как к вам обращаться?';
      if (!data.lastName)  errors.lastName = 'Введите фамилию';
      if (!data.email)     errors.email = 'Нужен email — на него придёт ссылка';
      else if (!EMAIL_RE.test(data.email)) errors.email = 'Проверьте адрес: похоже на опечатку';

      if (!form.elements.consent.checked) errors.consent = 'Без согласия не смогу принять заявку';

      return errors;
    }

    function readForm() {
      return {
        firstName: form.elements.firstName.value.trim(),
        lastName:  form.elements.lastName.value.trim(),
        email:     form.elements.email.value.trim(),
        consent:   form.elements.consent.checked ? 'yes' : '',
        website:   form.elements.website.value.trim(),   // honeypot
        source:    leadMode,
        page:      window.location.pathname + window.location.hash
      };
    }

    function submitLead() {
      var errors = validate();

      // Проходим по всем полям, а не только по ошибочным: иначе текст ошибки
      // у поля, которое человек уже исправил, остался бы на экране.
      Array.prototype.forEach.call(form.querySelectorAll('[data-error-for]'), function (box) {
        var name = box.getAttribute('data-error-for');
        setError(name, errors[name] || '');
      });

      var keys = Object.keys(errors);
      if (keys.length) {
        var first = form.elements[keys[0]];
        if (first && first.focus) first.focus();
        return;
      }

      var data = readForm();

      // Бот заполнил скрытое поле — показываем успех, но ничего не отправляем
      if (data.website) {
        showSuccess(data);
        return;
      }

      var button = $('#lead-submit');
      var status = $('#lead-status');
      var original = button.querySelector('span').textContent;

      button.disabled = true;
      button.querySelector('span').textContent = 'Отправляю…';
      if (status) status.textContent = '';

      sendLead(data)
        .then(function () { showSuccess(data); })
        .catch(function () {
          if (status) status.textContent = 'Не получилось отправить. Попробуйте ещё раз или напишите в мессенджер.';
        })
        .then(function () {
          button.disabled = false;
          button.querySelector('span').textContent = original;
        });
    }

    function openModal(mode) {
      leadMode = LEAD_COPY[mode] ? mode : 'call';

      var copy = LEAD_COPY[leadMode];
      var pane = $('#lead-pane');
      var success = $('#lead-success');

      $('[data-lead="eyebrow"]').textContent = copy.eyebrow;
      $('[data-lead="title"]').textContent = copy.title;
      $('[data-lead="sub"]').textContent = copy.sub;
      $('[data-lead="submit"]').textContent = copy.submit;

      form.hidden = false;
      if (pane) pane.hidden = false;
      success.hidden = true;
      var status = $('#lead-status');
      if (status) status.textContent = '';

      if (typeof modal.showModal === 'function') modal.showModal();
      else modal.setAttribute('open', '');

      document.body.classList.add('modal-open');

      setTimeout(function () {
        var first = form.elements.firstName;
        if (first && first.focus) first.focus();
      }, 60);
    }

    function closeModal() {
      if (modal.open && typeof modal.close === 'function') modal.close();
      else modal.removeAttribute('open');
      document.body.classList.remove('modal-open');
      form.reset();
      $$('[data-error-for]').forEach(function (box) { box.classList.remove('is-shown'); });
    }

    function showSuccess(data) {
      var copy = LEAD_COPY[leadMode];
      var success = $('#lead-success');
      var status = $('#lead-status');
      var connected = !!(CFG.form && CFG.form.endpoint);
      if (status) status.textContent = '';

      $('[data-success="title"]').textContent = copy.successTitle;
      $('[data-success="sub"]').textContent = copy.successSub;

      var actions = $('#success-actions');
      actions.innerHTML = successActions(copy.actions, data);

      // Пока endpoint не задан — честно предупреждаем, что заявка никуда не ушла
      var hint = $('#success-fallback');
      if (hint) {
        hint.textContent = connected
          ? 'Если письмо не пришло — напишите мне в мессенджер, отвечу в течение 2 часов.'
          : 'Это демо-режим: заявка сохранена только в этом браузере. Подключите таблицу или бота — инструкция в файле js/config.js.';
        hint.hidden = connected;
      }

      form.hidden = true;
      var pane = $('#lead-pane');
      if (pane) pane.hidden = true;
      success.hidden = false;
    }

    function successActions(kind) {
      var esc = escapeHtml;
      var telegram = '<a class="btn btn--outline" href="' + telegramLink() + '" target="_blank" rel="noopener">' +
                     '<svg viewBox="0 0 24 24" aria-hidden="true" class="btn__icon"><path d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.3-.5.5-.9.5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.7 13.2 2.2 11.7c-1-.3-1-1 .2-1.5l18-7c.8-.3 1.5.2 1.3 1.1z"/></svg>' +
                     '<span>Написать в Telegram</span></a>';
      var whatsapp = '<a class="btn btn--outline" href="' + whatsappLink() + '" target="_blank" rel="noopener">' +
                     '<svg viewBox="0 0 24 24" aria-hidden="true" class="btn__icon"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.5-.6-2.7-1.2-4.4-3.9-4.5-4-.1-.2-1-1.4-1-2.6 0-1.3.6-1.9.9-2.2.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.4 1.8 2.2 1.2 1.1 2.2 1.4 2.5 1.6.2.2.4.2.5.1l.7-.8c.2-.2.3-.2.6-.1l2 .9c.3.2.4.2.5.4 0 .1 0 .6-.2 1.1z"/></svg>' +
                     '<span>Написать в WhatsApp</span></a>';

      if (kind === 'calendar') {
        return '<a class="btn btn--primary btn--xl" href="' + esc(CFG.calendarUrl || '#') + '" data-open-calendar target="_blank" rel="noopener">' +
                 '<span>Открыть календарь</span></a>' + telegram;
      }
      return telegram + whatsapp;
    }
  }

  /* Отправка заявки на endpoint из конфига */
  function sendLead(data) {
    var cfg = CFG.form || {};

    if (!cfg.endpoint) {
      // Демо-режим: показываем всё как будто отправили, но данные никуда не уходят.
      // Полезно, чтобы проверить форму до подключения таблицы или бота.
      try {
        var saved = JSON.parse(localStorage.getItem('lead-demo') || '[]');
        saved.push(Object.assign({ at: new Date().toISOString() }, data));
        localStorage.setItem('lead-demo', JSON.stringify(saved));
      } catch (err) { /* приватный режим — молча пропускаем */ }
      return Promise.resolve();
    }

    var payload = {
      firstName: data.firstName,
      lastName:  data.lastName,
      email:     data.email,
      consent:   data.consent,
      source:    data.source,
      page:      data.page,
      website:   data.website,          // honeypot: у ботов не пусто, у людей пусто
      _subject:  'Новая заявка с сайта: ' + data.firstName + ' ' + data.lastName
    };

    // метки рекламы, если клиент пришёл с них
    Object.keys(utm).forEach(function (k) { payload[k] = utm[k]; });

    if (cfg.accessKey) payload.access_key = cfg.accessKey;

    // Google Apps Script не отдаёт заголовки Access-Control-Allow-Origin, поэтому
    // обычный fetch с других доменов упирается в CORS. Запрос при этом уходит,
    // но прочитать ответ браузер не может — отправляем в режиме no-cors
    // и считаем успехом любой ответ, который не упал по сети.
    var isGoogleScript = /script\.google\.com/.test(cfg.endpoint);

    var opts = {
      method: cfg.method || 'POST',
      headers: isGoogleScript
        ? { 'Content-Type': 'text/plain;charset=utf-8' }
        : { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    };

    if (isGoogleScript) opts.mode = 'no-cors';

    return fetch(cfg.endpoint, opts).then(function (res) {
      if (isGoogleScript) return res;   // ответ непрозрачный, проверить его нельзя
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  /* ------------------------------------------------------------------
     Старт
     ------------------------------------------------------------------ */
  function init() {
    fillConfig();
    buildPrices();
    buildGallery();
    buildReviews();
    initChrome();
    initLead();
    initTracking();
    observeReveal(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();