# BackendGeo

Backend do sistema de geolocalização para o projeto da disciplina de Banco de Dados Não Relacional da Fatec Votorantim.

## Sobre o Projeto

Este projeto é o backend de um sistema de geolocalização desenvolvido para os ensinamentos da disciplina. 

## Tecnologias Utilizadas

Este projeto foi desenvolvido utilizando as seguintes tecnologias:

- Node.js
- Express
- MongoDB

## Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 14.x ou superior)
- [npm](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)
- [MongoDB](https://cloud.mongodb.com/) 

## Instalação

1. Clone o repositório
   ```bash
   git clone https://github.com/fatec-votorantim/backendGeo.git
   cd backendGeo
   ```

2. Instale as dependências
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configure as variáveis de ambiente
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com as configurações do seu ambiente
   ```

4. Inicie o servidor
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

## Dependências do Projeto

| Dependência | Versão | Descrição |
|-------------|--------|-----------|
| express | ^4.17.x | Framework web para Node.js |
| cors | ^2.x.x | Middleware para habilitar CORS |
| dotenv | ^10.x.x | Carrega variáveis de ambiente de arquivos .env |
| nodemon | ^2.x.x | Ferramenta que reinicia automaticamente o servidor após alterações |

## Criação do frontend com V0
Acesse uma IA Generativa como o [V0](https://v0.dev)

>> Sugestão de um prompt
```
Meu backend no Vercel é: https://backend-geo-kappa.vercel.app
Existem os seguintes endpoints:
api/municipios?page=1&limit=10&sort=_id&order=asc&nome= - GET (Os dados são retornados conforme exemplo: {"data":[{"_id":"67ed97841ce64dc6575f0bf1","codigo_ibge":3557006,"nome":"Votorantim","capital":false,"codigo_uf":35,"local":{"type":"Point","coordinates":[-47.4388,-23.5446]}}],"pagination":{"total":1,"page":1,"limit":10,"pages":1}})
api/municipios/nearby?latitude=-16.7573&longitude=-45.4412&distance=10 - GET
api/municipios/:id
Além dos endpoints para o PUT, POST e DELETE

A minha collection municipios no MongoDB está assim:
{
  "_id": {
    "$oid": "67ed97841ce64dc6575ef650"
  },
  "codigo_ibge": 4100103,
  "nome": "Abatiá",
  "capital": false,
  "codigo_uf": 41,
  "local": {
    "type": "Point",
    "coordinates": [
      -50.3133,
      -23.3049
    ]
  }
}

Para as validações, foi usado o express-validator. Exemplo de erro:
{"error":true,"message":"Erro de validação","errors":[{"type":"field","msg":"O código IBGE é obrigatório","path":"codigo_ibge","location":"body"},{"type":"field","msg":"O código IBGE deve ser um número inteiro de 7 dígitos","path":"codigo_ibge","location":"body"},{"type":"field","msg":"O campo capital deve ser um valor booleano","path":"capital","location":"body"},{"type":"field","msg":"O código UF é obrigatório","path":"codigo_uf","location":"body"},{"type":"field","msg":"O código UF deve ser um número inteiro entre 1 e 99","path":"codigo_uf","location":"body"},{"type":"field","msg":"O campo local é obrigatório","path":"local","location":"body"},{"type":"field","msg":"O campo local deve ser um objeto","path":"local","location":"body"},{"type":"field","msg":"O tipo do local é obrigatório","path":"local.type","location":"body"},{"type":"field","msg":"O tipo do local deve ser \"Point\"","path":"local.type","location":"body"},{"type":"field","msg":"As coordenadas são obrigatórias","path":"local.coordinates","location":"body"},{"type":"field","msg":"As coordenadas devem ser um array com exatamente 2 elementos","path":"local.coordinates","location":"body"},{"type":"field","msg":"A longitude deve estar entre -180 e 180","path":"local.coordinates[0]","location":"body"},{"type":"field","msg":"A latitude deve estar entre -90 e 90","path":"local.coordinates[1]","location":"body"}]}

Utilizando apenas HTML, CSS e JS com estilização em dark e roxo com o Tailwind, crie uma landing page e nela insira um link para permitir ao usuário fazer um CRUD dos municipios. 

Crie um filtro onde o usuário poderá obter a localização do navegador e digitar a distância desejada. Toda a interface deverá estar em pt-br
```

## Estrutura do Projeto

```
backendGeo/
│
├── src/
│   ├── config/          # Configurações do aplicativo
│   ├── controllers/     # Controladores da aplicação
│   ├── database/        # Configurações do banco de dados
│   ├── middlewares/     # Middlewares do Express
│   ├── models/          # Modelos do Sequelize
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços da aplicação
│   ├── utils/           # Funções utilitárias
│   └── app.js           # Aplicação Express
│
├── tests/               # Testes automatizados
├── .env                 # Variáveis de ambiente
├── .env.example         # Exemplo de variáveis de ambiente
├── .eslintrc.js         # Configuração do ESLint
├── .gitignore           # Arquivos ignorados pelo Git
├── .prettierrc          # Configuração do Prettier
├── jest.config.js       # Configuração do Jest
├── package.json         # Dependências e scripts do projeto
└── README.md            # Documentação do projeto
```

## API Endpoints


- `GET /api/municipios` - Lista todos os municipios
- `POST /api/municipios` - Cria um novo municipio
- `GET /api/municipios/:id` - Obtém um municipio específico
- `PUT /api/municipios/:id` - Atualiza um municipio especifico
- `DELETE /api/municipios/:id` - Remove um municipio específico

Para mais detalhes sobre os endpoints, consulte a documentação da API.

## Scripts

- `npm run dev` - Inicia o servidor em modo de desenvolvimento
- `npm run start` - Inicia o servidor em modo de produção

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add some amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.

## Contato

Equipe Fatec Votorantim 
Prof. Ms. Ricardo Leme

Link do projeto: [https://github.com/fatec-votorantim/backendGeo](https://github.com/fatec-votorantim/backendGeo)