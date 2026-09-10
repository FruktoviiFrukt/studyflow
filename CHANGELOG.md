# Changelog

Формат: [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/). Версии по [SemVer](https://semver.org/lang/ru/).

## [Unreleased]

### Added

- `.node-version`, `engines` в `package.json`: единая версия Node.js 22 для локальной разработки, CI и деплоя.
- Скрипты `format`, `db:reset`; в `develop` перенесены `test`, `typecheck`, `format:check`, `test:db`, `test:e2e`.
- Конфигурация редакторов и форматирования: `.prettierrc.json`, `.editorconfig`, `.gitattributes`, `.vscode/`.
- Healthcheck PostgreSQL в `docker-compose.yml`; `npm run db:up` ждёт готовности базы.
- `CHANGELOG.md`, `CONTRIBUTING.md`, README с описанием модулей и процесса.

### Changed

- CI запускается для PR и push в `develop` и `main`; порт PostgreSQL в CI приведён к `5433`, как в локальной среде.
- Workflow-файлы читают версию Node из `.node-version`.

### Состояние до этого раздела

- Прототип интерфейса: dashboard, tasks, schedule, gpa, materials, ai-coach, auth; аутентификация через Auth.js.
