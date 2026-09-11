# StudyFlow

Личный кабинет студента Технического университета Молдовы: расписание, дедлайны, оценки, материалы, подготовка к экзаменам.

Статус: alpha, разработка ведётся в ветке `develop`.

## Модули

| Модуль                    | Код                                                                  | Владелец           | Состояние                 |
| ------------------------- | -------------------------------------------------------------------- | ------------------ | ------------------------- |
| Задания                   | `app/(main)/tasks`, `components/tasks`, `lib/tasks.ts`               | AlinaKernus, vlr404 | UI готов, данные в памяти |
| Расписание                | `app/(main)/schedule`, `components/schedule`, `lib/schedule.ts`      | AlinaKernus        | демо-данные               |
| Средний балл              | `app/(main)/gpa`, `components/grades`, `lib/grades.ts`               | AlinaKernus        | UI готов, данные в памяти |
| Материалы                 | `app/(main)/materials`, `components/materials`                       | Alshok27           | файлы в памяти            |
| AI Exam Coach             | `app/(main)/ai-coach`, `components/ai-coach`, `lib/ai-coach.ts`      | hellomumu, vlr404   | генерация из демо-банка   |
| Аутентификация            | `app/auth`, `app/api/auth`, `auth.ts`, `proxy.ts`                    | tolyati            | Auth.js, в develop        |
| Каркас и дашборд          | `app/(main)/layout.tsx`, `app/(main)/dashboard`, `components/layout` | FruktoviiFrukt     | статические данные        |
| Инфраструктура, CI, тесты | `.github`, `docker-compose.yml`, `prisma`, `tests`, `scripts`        | Imurd              |                           |

Если владелец указан неверно, поправьте таблицу PR-ом.

## Быстрый старт

Требования: Node.js 22 (версия из `.node-version`, ставится через nvm или fnm) и Docker.

```sh
npm ci
cp .env.example .env
npm run db:up
npx prisma migrate dev
npm run dev
```

Приложение откроется на http://localhost:3000. Установка зависимостей генерирует Prisma-клиент через `postinstall`; после изменения `prisma/schema.prisma` выполните `npx prisma generate`.

Полезные команды:

- `npm run db:down` — остановить контейнер базы данных.
- `npm run db:reset` — пересоздать базу с нуля и применить миграции.
- `npm run db:studio` — открыть Prisma Studio.

## Проверка перед PR

```sh
npm run format:check
npm run lint -- --max-warnings=0
npm run typecheck
npm test
npm run build
```

Тот же набор выполняет CI. Подробности о проверках, тестах базы данных и e2e: [docs/automation.md](docs/automation.md).

## Windows

Установите Node.js 22 через [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) (`nvm install 22`, `nvm use 22`). Docker Desktop нужен с backend WSL2:

1. Windows 10 (сборка 19041+) или Windows 11.
2. В PowerShell от администратора выполните `wsl --install` и перезагрузитесь. При ошибке виртуализации включите Intel VT-x / AMD SVM в BIOS/UEFI.
3. Проверьте `wsl -l -v`: дистрибутив должен быть версии 2 (`wsl --set-default-version 2`).
4. Установите [Docker Desktop](https://www.docker.com/products/docker-desktop/) с включённым «Use WSL 2 instead of Hyper-V» и перезагрузитесь.
5. Дождитесь зелёного значка Docker в трее и проверьте `docker compose version` и `docker run hello-world`.

На macOS и Linux достаточно установить Docker Desktop или Docker Engine.

## Troubleshooting

- **Порт 5432 занят.** Локальный PostgreSQL слушает порт по умолчанию, поэтому контейнер проекта наружу открыт на `5433`. Если меняете порт, обновите `docker-compose.yml`, `.env` и `.env.example` одновременно.
- **Команды Docker зависают или падают.** Убедитесь, что Docker Desktop запущен, прежде чем выполнять `npm run db:up` или `prisma migrate`.
- **`P1001: Can't reach database server`.** База ещё не готова. `npm run db:up` ждёт готовности контейнера; если запускали `docker compose up` вручную, подождите несколько секунд и повторите.

## Документы

- [docs/automation.md](docs/automation.md) — CI, тесты, развёртывание.
- [CHANGELOG.md](CHANGELOG.md) — история изменений.
- [CONTRIBUTING.md](CONTRIBUTING.md) — правила работы с репозиторием.

## Процесс

Ветки `feature/*` → PR в `develop` → релизы в `main` тегами. Для слияния обязательны одно ревью и зелёный CI. Сообщения коммитов в формате conventional commits.

После слияния PR ветка больше не нужна: удаляйте её сразу (кнопка «Delete branch» в PR или `git push origin --delete <ветка>`). Всё уже в `develop`, история сохраняется в merge-коммите. Влитые ветки без удаления копятся и мешают понять, над чем идёт работа.
