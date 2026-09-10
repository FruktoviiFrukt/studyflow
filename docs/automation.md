# Проверки и развёртывание

Используйте Node.js 22 (LTS) из `.node-version` и устанавливайте зависимости командой `npm ci`.

## CI

Для PR с целевой веткой `develop` или `main` и для push в эти ветки запускаются три проверки:

- **Quality**: формат всего репозитория, ESLint, TypeScript, unit-тесты и production-сборка.
- **Database**: проверка Prisma-схемы, миграции и интеграционный тест на отдельном PostgreSQL 16.
- **Browser**: отдельный PostgreSQL 16, миграции и сид (`admin@utm.md`), production-сборка и сценарии Playwright в Chromium. Проект `setup` один раз входит под сид-пользователем и сохраняет сессию для остальных тестов; тесты в `tests/e2e/auth.spec.ts` проверяют защиту страниц без сессии.

Локальный запуск:

```sh
npm ci
npm run format:check
npm run lint -- --max-warnings=0
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run db:up && npx prisma migrate deploy && npx prisma db seed
npm run test:e2e
```

Для e2e нужны переменные `DATABASE_URL` и `AUTH_SECRET` (любое значение для локального запуска). Тесты входят под сид-пользователем `admin@utm.md`; другой аккаунт задаётся через `E2E_EMAIL` и `E2E_PASSWORD`.

В Windows PowerShell можно использовать `npm.cmd`. Проверка формата (`npm run format:check`) охватывает весь репозиторий; исправить всё разом можно командой `npm run format`.

Тест БД запускается командой `npm run test:db` с отдельной тестовой `DATABASE_URL` и `ALLOW_DB_TESTS=1`. В CI PostgreSQL доступен на порту `5433`, как и локальный контейнер из `docker-compose.yml`. Он создаёт и удаляет только собственную тестовую запись. Не используйте production-базу.

## Интеграция веток

`npm run integration:plan` составляет план входящих PR в `imurd` без изменения исходных веток. Автоматическое слияние выключено по умолчанию.

Текущий прототип требует разрешённого GitHub Auto-merge, merge-коммитов и строгих обязательных проверок Quality, Database и Browser на `imurd`, включая администраторов. Для включения используются переменная `AUTO_INTEGRATE_ENABLED=true` и секрет `INTEGRATION_TOKEN`. Не включайте режим до настройки этих требований.

Отстающая исходная ветка может блокироваться строгими правилами актуальности. Скрипт не выполняет обратные слияния и не обновляет исходные ветки. Это ограничение прототипа; он не гарантирует автоматическую обработку всех веток.

Расписание Actions и событие `workflow_run` требуют наличия workflow в default branch. Публикация файлов только в `imurd` не включает расписание автоматически.

## Vercel

Сайт: https://studyflow-imurd.vercel.app.

Для ручной публикации связанного проекта используйте `vercel deploy --prod`. Перед публикацией должны пройти CI-проверки. Git-интеграция пока не подключена, поэтому автоматического деплоя по push нет.

Подготовленный workflow требует `VERCEL_ENABLED=true` и секреты `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Он допускает только текущий коммит `imurd` с успешными Quality, Database и Browser. Наличие файла workflow само по себе не включает этот процесс.

`.vercelignore` исключает локальные переменные окружения и служебные файлы из загрузки. Не храните токены в репозитории.
