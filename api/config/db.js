import mysql from 'mysql2/promise';

let pool;

export async function connectToDatabase(app) {
  try {
    // Configurações para db4free.net
    const dbConfig = {
      host: process.env.MYSQL_HOST || 'db4free.net',
      user: process.env.MYSQL_USER || 'seu_usuario', // Substitua pelo seu usuário
      password: process.env.MYSQL_PASSWORD || 'sua_senha', // Substitua pela sua senha
      database: process.env.MYSQL_DATABASE || 'seu_banco', // Substitua pelo nome do seu banco
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    // Criar pool de conexões
    pool = mysql.createPool(dbConfig);
    
    // Testar conexão
    const connection = await pool.getConnection();
    console.log('Conectado ao MySQL!');
    connection.release();
    
    // Disponibiliza o pool globalmente no Express
    app.locals.db = pool;
    
    return pool;
  } catch (error) {
    console.error('Falha ao conectar ao MySQL', error);
    process.exit(1);
  }
}

export { pool as db };