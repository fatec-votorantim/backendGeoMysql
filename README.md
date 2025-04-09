# API de Municípios - MongoDB para MySQL

Este projeto é uma API RESTful para gerenciamento de municípios brasileiros. Originalmente desenvolvida com MongoDB, foi adaptada para utilizar um banco de dados MySQL hospedado no serviço [freesqldatabase.com/](https://www.freesqldatabase.com/) (ou similar).

## 📋 Índice

* [Requisitos](#requisitos)

* [Instalação](#instalação)

* [Configuração do Banco de Dados](#configuração-do-banco-de-dados)

* [Estrutura do Projeto](#estrutura-do-projeto)

* [Endpoints da API](#endpoints-da-api)

* [Considerações sobre a Migração](#considerações-sobre-a-migração)

* [Limitações e Observações](#limitações-e-observações)

* [Exemplos de Uso](#exemplos-de-uso)

* [Contribuição](#contribuição)

* [Licença](#licença)

## ⚙️ Requisitos

* [Node.js](https://nodejs.org/) (versão 14 ou superior)

* [npm](https://www.npmjs.com/) ou [yarn](https://yarnpkg.com/)

* Uma conta e um banco de dados MySQL configurado em um serviço como [freesqldatabase.com/](https://www.freesqldatabase.com/) ou outro provedor de sua preferência.

## 🚀 Instalação

1.  Clone o repositório do projeto:

    ```bash
    git clone https://github.com/fatec-votorantim/backendGeoMysql.git
    cd backendGeoMysql
    ```

2.  Instale as dependências do projeto utilizando npm ou yarn:

    ```bash
    npm install
    # ou
    yarn install
    ```

3.  Inicie o servidor de desenvolvimento:

    ```bash
    npm run dev
    # ou
    yarn dev
    ```

    A API estará rodando em `http://localhost:<porta_configurada>` (geralmente 3000).

## 🛠️ Configuração do Banco de Dados

Você precisará configurar as variáveis de ambiente para conectar sua API ao banco de dados MySQL. Crie um arquivo `.env` na raiz do seu projeto (se ainda não existir) e adicione as seguintes informações, substituindo os valores pelos seus dados de acesso:

```dotenv
MYSQL_HOST=seu_host_mysql
MYSQL_USER=seu_usuario_mysql
MYSQL_PASSWORD=sua_senha_mysql
MYSQL_DATABASE=nome_do_seu_banco_de_dados
PORT=3000 # Ou outra porta de sua preferência
```

Certifique-se de que as credenciais e o nome do banco de dados correspondam às configurações do seu serviço MySQL (por exemplo, freesqldatabase.com).

## 📂 Estrutura do Projeto

```
.
├── node_modules/
├── src/
│   ├── db.js             # Configuração e conexão com o banco de dados MySQL
│   ├── controllers/      # Lógica de controle das rotas
│   │   └── municipioController.js
│   ├── middlewares/      # Middlewares para validação e outras funcionalidades
│   │   └── validations.js
│   ├── routes/           # Definição das rotas da API
│   │   └── municipioRoutes.js
│   └── server.js         # Arquivo principal para iniciar o servidor Express
├── .env                  # Arquivo de configuração das variáveis de ambiente
├── package.json
├── package-lock.json     # ou yarn.lock
└── README.md
```

## 🗺️ Endpoints da API

A seguir estão os endpoints disponíveis na API de municípios:

**Municípios:**

* `GET /municipios`

    * Retorna uma lista paginada de todos os municípios.

    * Query parameters opcionais:

        * `page`: Número da página (padrão: 1).

        * `limit`: Número de itens por página (padrão: 10).

        * `nome`: Filtra municípios por nome (case-insensitive, busca parcial).

        * `sort`: Campo para ordenar os resultados (`id`, `codigo_ibge`, `nome`, `capital`, `codigo_uf`, `longitude`, `latitude`; padrão: `nome`).

        * `order`: Ordem da ordenação (`asc` ou `desc`; padrão: `asc`).

* `GET /municipios/:id`

    * Retorna um município específico pelo seu ID.

* `POST /municipios`

    * Cria um novo município.

    * Corpo da requisição (JSON):

        ```json
        {
          "codigo_ibge": 5200059,
          "nome": "Nome do Município",
          "capital": false,
          "codigo_uf": 52,
          "longitude": -45.000000,
          "latitude": -15.500000
        }
        ```

* `PUT /municipios/:id`

    * Atualiza um município existente pelo seu ID.

    * Corpo da requisição (JSON): Campos a serem atualizados (os mesmos do POST, todos opcionais).

* `DELETE /municipios/:id`

    * Exclui um município existente pelo seu ID.

## 🔄 Considerações sobre a Migração

A conversão de MongoDB para MySQL envolveu as seguintes mudanças principais:

* **Estrutura do Banco de Dados:** A estrutura de documentos flexível do MongoDB foi convertida para um esquema relacional com tabelas e colunas no MySQL. A localização (anteriormente um objeto `Point` com coordenadas) agora é armazenada em colunas separadas (`longitude` do tipo `DECIMAL(10, 6)` e `latitude` do tipo `DECIMAL(10, 6)`).

* **Consultas:** As consultas utilizando a linguagem de consulta do MongoDB foram reescritas em SQL para interagir com o MySQL.

* **Validações:** As validações de dados foram adaptadas para o contexto do Express.js e do MySQL, utilizando a biblioteca `express-validator`.

* **Dados de Localização:** A representação dos dados de localização foi alterada de um objeto GeoJSON `Point` para campos numéricos de `longitude` e `latitude` no MySQL. Se funcionalidades geoespaciais avançadas fossem necessárias, seria preciso explorar as funções `GEOMETRY` e os índices espaciais do MySQL.

## ⚠️ Limitações e Observações

* **Serviço freesqldatabase.com:** Este serviço é gratuito e para fins de teste e desenvolvimento. Ele possui limitações de performance e disponibilidade, e não é recomendado para produção.

* **Representação da Localização:** A decisão de armazenar latitude e longitude em colunas separadas simplifica o projeto, mas limita funcionalidades geoespaciais complexas que seriam nativas em bancos de dados com forte suporte espacial.

* **Migração de Dados:** A migração de dados de um formato NoSQL para SQL pode envolver perda de informações ou a necessidade de transformações significativas nos dados. O processo específico de migração para este projeto não está detalhado neste README, mas é uma etapa crucial.

## 💡 Exemplos de Uso

**Criar um novo município (usando curl):**

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "codigo_ibge": 3550308,
  "nome": "São Paulo",
  "capital": true,
  "codigo_uf": 35,
  "longitude": -46.633300,
  "latitude": -23.550500
}' http://localhost:3000/municipios
```

**Obter um município pelo ID (usando curl):**

```bash
curl http://localhost:3000/municipios/123
```

**Listar municípios (página 2, limite de 5 por página, ordenado por nome descendente):**

```bash
curl "http://localhost:3000/municipios?page=2&limit=5&sort=nome&order=desc"
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues para relatar bugs ou sugerir melhorias, e enviar pull requests com suas alterações.

## 📜 Licença

MIT

## 👨 Autor
Prof. Ms. Ricardo Leme - Fatec Votorantim

## 🖥 Demo
Uma demonstração da API está disponível em: [https://backend-geo-mysql.vercel.app/](https://backend-geo-mysql.vercel.app/).

