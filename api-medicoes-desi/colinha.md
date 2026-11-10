### Status da API
GET http://localhost:3000/

### Listar todas
GET http://localhost:3000/medicoes

### Buscar por ID
GET http://localhost:3000/medicao/1

### Criar (70 °C -> 158 °F, Temperatura ideal)
POST http://localhost:3000/medicao
Content-Type: application/json

{ "descricao": "CPU Intel i7 em repouso", "tipo": "temperatura", "valor": 70 }

### Criar (100 °C -> 212 °F, Acima da temperatura ideal)
POST http://localhost:3000/medicao
Content-Type: application/json

{ "descricao": "CPU sob stress test", "tipo": "temperatura", "valor": 100 }

### Atualizar
PUT http://localhost:3000/medicao/1
Content-Type: application/json

{ "descricao": "CPU em carga", "tipo": "temperatura", "valor": 110 }

### Apagar
DELETE http://localhost:3000/medicao/1

### ERRO 400 - campo ausente
POST http://localhost:3000/medicao
Content-Type: application/json

{ "descricao": "Sem valor", "tipo": "temperatura" }

### ERRO 400 - tipo inválido
POST http://localhost:3000/medicao
Content-Type: application/json

{ "descricao": "Tipo errado", "tipo": "umidade", "valor": 50 }

### ERRO 404 - ID inexistente
GET http://localhost:3000/medicao/99999
