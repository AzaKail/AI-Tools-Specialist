# GBC Analytics Dashboard

## Структура проекта

```
gbc-dashboard/
├── scripts/                  # Шаги 2-3
│   ├── mock_orders.json      # 50 тестовых заказов
│   ├── 1_upload_to_retailcrm.js
│   ├── 2_sync_to_supabase.js
│   ├── supabase_schema.sql
│   └── package.json
├── dashboard/
│   └── index.html            # Шаг 4 — дашборд
├── telegram-bot/             # Шаг 5
│   ├── bot.js
│   └── package.json
└── .env.example
```

---

## Пошаговый гайд

### Шаг 1 — Создай аккаунты

| Сервис | Ссылка | Что делать |
|---|---|---|
| RetailCRM | retailcrm.ru | Демо-аккаунт → запиши URL и сгенерируй API-ключ в Настройки → Ключи |
| Supabase | supabase.com | Новый проект → скопируй URL и `service_role` ключ из Settings → API |
| Vercel | vercel.com | Просто создай аккаунт, пригодится в шаге 4 |
| Telegram | t.me/BotFather | `/newbot` → получи токен бота |

Скопируй `.env.example` в `.env` и заполни все значения.

---

### Шаг 2 — Загрузи заказы в RetailCRM

```bash
cd scripts
npm install
node 1_upload_to_retailcrm.js 
```

Скрипт загрузит все 50 заказов через API RetailCRM. Должно занять ~20 секунд.

---

### Шаг 3 — Настрой Supabase

**3а. Создай таблицу:**

Зайди в Supabase → SQL Editor → вставь содержимое `supabase_schema.sql` → Run.

**3б. Синхронизируй заказы:**

```bash
node --env-file=../.env 2_sync_to_supabase.js
```

---

### Шаг 4 — Дашборд на Vercel

**4а. Вставь ключи в index.html:**

Открой `dashboard/index.html`, найди строки:
```js
const SUPABASE_URL = 'ТВОЙ_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'ТВОЙ_SUPABASE_ANON_KEY';
```
Замени на свои значения. Используй **anon** ключ (не service_role!).

**4б. Задеплой на Vercel:**

```bash
npm install -g vercel

node --env-file=../.env 2_sync_to_supabase.js - синхронизация с супабэйз

cd dashboard
vercel --prod
```

Vercel спросит несколько вопросов → жми Enter на все. В конце даст ссылку. https://gbc-dashboard-flax.vercel.app

---

### Шаг 5 — Telegram бот

**5а. Узнай свой Telegram ID:**

Напиши боту [@userinfobot](https://t.me/userinfobot) → он пришлёт твой ID.

**5б. Задеплой бота на Railway:**

1. Зайди на [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Загрузи папку `telegram-bot` в GitHub
3. В Railway добавь переменные окружения из `.env`
4. Получи публичный URL сервиса (Settings → Networking → Generate Domain)

**5в. Настрой вебхук в RetailCRM:**

Настройки → Вебхуки → Добавить:
- URL: `https://твой-railway-url/webhook`
- Событие: Изменение заказа / Создание заказа

Теперь при каждом новом заказе > 50 000 ₸ — придёт уведомление в Telegram.

---

## Что рассказать в README репо (для оценки)

```markdown
## Промпты которые использовал

1. "Напиши скрипт для загрузки JSON заказов в RetailCRM через API v5"
2. "Создай синхронизацию RetailCRM → Supabase с upsert по crm_id"  
3. "Сделай дашборд с графиками UTM, городов и распределения сумм из Supabase"
4. "Настрой Telegram бот который принимает вебхуки от RetailCRM"

## Где застрял

- RetailCRM требует параметр `site` при создании заказа — не было в документации
- Supabase RLS нужно включить иначе анон-ключ не читает данные

## Как решил

- Нашёл в docs RetailCRM раздел про обязательные поля
- Добавил policy `Public read` в SQL схему
```
