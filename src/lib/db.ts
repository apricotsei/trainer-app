// lib/db.ts

import mysql from 'mysql2/promise';

// 本番環境(Vercel)用の設定
const productionConfig = {
    host: process.env.HOST,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    port: parseInt(process.env.PORT || '4000', 10),
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// 開発環境(ローカル)用の設定
const localConfig = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
};

declare global {
    var mysqlPool: mysql.Pool | undefined;
}

let pool: mysql.Pool;

// NODE_ENVに応じて設定を切り替え
if (process.env.NODE_ENV === 'production') {
    pool = mysql.createPool(productionConfig);
} else {
    if (!global.mysqlPool) {
        global.mysqlPool = mysql.createPool(localConfig);
    }
    pool = global.mysqlPool;
}

export const db = pool;


// import mysql from 'mysql2/promise';

// // 以下でコネクションプール格納のための変数を定義
// // TypeScriptのグローバル空間にプロパティを拡張
// declare global {
//     var mysqlPool: mysql.Pool | undefined;
// }
// let pool: mysql.Pool;

// // process.envオブジェクトを通じてenv.localからデータベース接続情報を取得
// const dbConfig = {
//     host: process.env.MYSQL_HOST,
//     user: process.env.MYSQL_USER,
//     password: process.env.MYSQL_PASSWORD,
//     database: process.env.MYSQL_DATABASE,
//     port: parseInt(process.env.MYSQL_PORT || '3306', 10),
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
// };

// if (process.env.NODE_ENV === 'production') {
//     // 本番環境では常に新しいプールを作成
//     pool = mysql.createPool(dbConfig);
// } else {
//      // 開発環境では、グローバルオブジェクトにプールがなければ作成(コードを修正する度にプログラムが再起動)
//     if (!global.mysqlPool) {
//         global.mysqlPool = mysql.createPool(dbConfig);
//     }
//     pool = global.mysqlPool;
// }

// export const db = pool;