# Book Catalog - підсумковий DevOps-проєкт

Автор: Риков Дмитрій, група КН-44

## Призначення

Book Catalog - невеликий веб-застосунок на Node.js (Express) для ведення каталогу книг.
Він має REST API і просту веб-сторінку, де можна переглядати книги, шукати за назвою
або автором і додавати нові.

Мета проєкту - показати повний DevOps-ланцюжок: код, тести, Docker-образ, Docker Hub,
інфраструктура в AWS через Terraform і автоматичний деплой через GitHub Actions.

## Структура

```
students/rykov/
├── src/
│   ├── app.js            # маршрути API
│   ├── server.js         # точка входу
│   └── public/index.html # веб-сторінка
├── test/app.test.js      # тести API (node:test)
├── infra/                # Terraform: EC2, Security Group, Key Pair
├── .github/workflows/    # копія воркфлоу (див. примітку нижче)
├── Dockerfile
├── .dockerignore
├── .gitignore
└── package.json
```

Примітка: GitHub Actions запускає воркфлоу лише з `.github/workflows/` у корені репозиторію,
тому робочі файли лежать там (`rykov-ci-cd.yml`, `rykov-destroy.yml`), а в папці студента
зберігається їх копія.

## API

| Метод  | Шлях              | Опис                                     |
|--------|-------------------|------------------------------------------|
| GET    | `/health`         | перевірка стану, повертає версію         |
| GET    | `/api/books`      | список книг, пошук `?q=текст`            |
| GET    | `/api/books/:id`  | одна книга                               |
| POST   | `/api/books`      | додати книгу (`title`, `author`, `year`) |
| DELETE | `/api/books/:id`  | видалити книгу                           |

## Локальний запуск

Без Docker:

```bash
cd students/rykov
npm install
npm test
npm start            # http://localhost:3000
```

У Docker:

```bash
cd students/rykov
docker build -t book-catalog .
docker run -d -p 3000:3000 --name book-catalog book-catalog
curl http://localhost:3000/health
```

## Змінні середовища

| Змінна        | За замовчуванням      | Опис                                               |
|---------------|-----------------------|----------------------------------------------------|
| `PORT`        | `3000`                | порт, на якому слухає застосунок                   |
| `APP_VERSION` | `dev`                 | версія, яку показує `/health` (у CI це SHA коміту) |
| `NODE_ENV`    | `production` в образі | режим Node.js                                      |

## Dockerfile

- багатостадійна збірка: на етапі `deps` ставляться лише production-залежності,
  у фінальний образ копіюються тільки `node_modules`, `package.json` і `src`;
- базовий образ `node:20-alpine`, тому образ маленький;
- спочатку копіюються `package*.json`, потім код, тож кеш шару з залежностями
  не скидається при зміні коду;
- застосунок працює від користувача `node`, а не від root;
- `HEALTHCHECK` перевіряє `/health`.

## Інфраструктура (Terraform)

Папка `infra/` створює в `us-east-1`:

- `aws_key_pair` з публічного ключа (пайплайн отримує його з `EC2_SSH_KEY_B64`);
- `aws_security_group` з портами 22 (SSH) і 80 (HTTP);
- `aws_instance` t2.micro на Ubuntu 22.04, `user_data` встановлює Docker.

Стан зберігається в S3-бакеті (`TF_STATE_BUCKET`), щоб кожен запуск пайплайна бачив уже
створений сервер і не створював новий.

Локально:

```bash
cd students/rykov/infra
cp terraform.tfvars.example terraform.tfvars   # вписати свій public_key
terraform init -backend-config="bucket=<назва бакета>"
terraform plan
terraform apply
terraform output app_url
```

## CI/CD пайплайн

Файл `.github/workflows/rykov-ci-cd.yml` запускається при пуші в `main` (зміни в
`students/rykov/`) або вручну. Етапи йдуть по черзі, кожен тільки якщо попередній успішний:

1. **Tests** - `npm ci` і `npm test`.
2. **Build and push image** - збірка Docker-образу з кешем і пуш у Docker Hub з тегами
   `latest` і SHA коміту.
3. **Terraform apply** - `init`, `fmt -check`, `validate`, `plan`, `apply`, на виході IP сервера.
4. **Deploy to EC2** - очікування, поки сервер і Docker готові, потім по SSH
   `docker pull` і перезапуск контейнера на порту 80, у кінці перевірка `/health`.

```
push у main -> Tests -> Build & push (Docker Hub) -> Terraform apply (AWS) -> Deploy (EC2)
```

Після деплою застосунок доступний за `http://<instance_ip>`.

Для видалення інфраструктури є окремий воркфлоу `rykov-destroy.yml`
(Actions > Destroy infrastructure > Run workflow) або локально `terraform destroy`.

## Секрети GitHub

Settings > Secrets and variables > Actions:

| Секрет                  | Для чого                                                  |
|-------------------------|-----------------------------------------------------------|
| `DOCKER_USERNAME`       | логін Docker Hub                                          |
| `DOCKER_TOKEN`          | токен Docker Hub (Account Settings > Personal access tokens) |
| `AWS_ACCESS_KEY_ID`     | ключ IAM-користувача для Terraform                        |
| `AWS_SECRET_ACCESS_KEY` | секретний ключ IAM-користувача                            |
| `EC2_SSH_KEY_B64`       | приватний SSH-ключ у base64 (`base64 -w0 deploy-key`)     |
| `TF_STATE_BUCKET`       | назва S3-бакета для стану Terraform                       |

Ключ можна згенерувати так:

```bash
ssh-keygen -t ed25519 -f deploy-key -N ""
base64 -w0 deploy-key      # значення для EC2_SSH_KEY_B64
```

## Гілки

Розробка ведеться у feature-гілках (`feature/app`, `feature/docker`, `feature/infra`,
`feature/ci-cd`), які зливаються в `main` через merge. Пуш у `main` запускає деплой.

## Важливо

Ресурси AWS коштують грошей, тому після перевірки треба запустити destroy.
