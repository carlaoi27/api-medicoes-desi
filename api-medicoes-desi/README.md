# API de Medições Térmicas (Node.js + Express + MySQL)

API RESTful para cadastro de leituras de sensores de temperatura de hardware. O servidor converte °C → °F, classifica cada medição e persiste tudo no MySQL.

## Requisitos
- Node.js 18+
- MySQL Server 8.0+ (ou Docker)
- Cliente HTTP (Postman, Insomnia ou extensão REST Client do VS Code)

## Como executar
```bash
# 1. Clonar e instalar
git clone <URL-DO-SEU-REPOSITORIO>
cd api-medicoes-desi
npm install

# 2. Criar o banco e a tabela
mysql -u root -p < schema.sql
#   (ou abra schema.sql no MySQL Workbench e execute)

# 3. Configurar variáveis de ambiente
cp .env.example .env      # Windows: copy .env.example .env
#   edite o .env com seu usuário/senha do MySQL

# 4. Iniciar
npm run dev               # com nodemon
# ou: npm start
```
A API sobe em `http://localhost:3000`.

### Docker (opcional)
```bash
docker run --name mysql-medicoes -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8
docker exec -i mysql-medicoes mysql -uroot -proot < schema.sql
# .env: DB_HOST=127.0.0.1  DB_USER=root  DB_PASS=root  DB_NAME=monitoramento_db
```

## Variáveis de ambiente (`.env`)
| Variável | Exemplo |
|---|---|
| DB_HOST | localhost |
| DB_USER | root |
| DB_PASS | (sua senha) |
| DB_NAME | monitoramento_db |

## Regras de negócio
- Conversão: `F = (C * 9 / 5) + 32`, arredondada a 2 casas.
- Unidade original `°C`, convertida `°F`.
- Classificação:

| Temperatura (°C) | Classificação |
|---|---|
| < 80 | Temperatura ideal |
| 80 a 94.99 | Atencao / Intermediario |
| 95 a 105 (inclusive) | Acima da temperatura ideal |
| > 105 | Limite crítico |

## Endpoints
| Método | Rota | Descrição | Status |
|---|---|---|---|
| GET | `/` | API ativa | 200 |
| GET | `/medicoes` | Lista todas | 200 |
| GET | `/medicao/:id` | Busca por ID | 200 / 404 |
| POST | `/medicao` | Cria medição | 201 / 400 |
| PUT | `/medicao/:id` | Atualiza e recalcula | 200 / 400 / 404 |
| DELETE | `/medicao/:id` | Remove | 200 / 404 |

Erros de banco retornam **500**.

### Exemplo: POST /medicao
Requisição:
```json
{ "descricao": "CPU sob stress test", "tipo": "temperatura", "valor": 100 }
```
Resposta `201`:
```json
{
  "id": 1,
  "descricao": "CPU sob stress test",
  "tipo": "temperatura",
  "valor_original": 100,
  "unidade_original": "°C",
  "valor_convertido": 212,
  "unidade_convertida": "°F",
  "classificacao": "Acima da temperatura ideal"
}
```

### Exemplo de erro 400
```json
{ "mensagem": "Tipo inválido. O único valor aceito para 'tipo' é 'temperatura'." }
```

## Testes
- Manuais: abra `requests.http` no VS Code (extensão REST Client) e clique em *Send Request*.
- Automatizados (não precisam de MySQL, usam banco simulado): `npm test`

## Estrutura
```
index.js         rotas e validações
temperatura.js   conversão e classificação
db.js            pool mysql2/promise + dotenv
schema.sql       DDL do banco
.env.example     modelo de variáveis
requests.http    requisições de teste
test/            testes automatizados
```
