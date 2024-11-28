// "use strict";

// const mysql = require('mysql2');

// const connection = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'passroot',
//     database: 'aliconcon'
// });

// connection.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.stack);
//         return;
//     }
//     console.log('Connection has been established successfully- MYSQL');
//     console.log('Connected to the database as id ' + connection.threadId);
// });

// // Using Promises
// // connection.promise().query('SELECT * FROM users')
// //     .then(([rows, fields]) => {
// //         console.log(rows, fields);
// //     })
// //     .catch(err => {
// //         console.error('Error querying the database:', err.stack);
// //     })
// //     .finally(() => {
// //         connection.end();
// //     });

// // connection.query('SELECT * FROM users', (error, results, fields) => {
// //     if (error) throw error;
// //     console.log('results-MÝSQL', results, fields);
// // });

// connection.end();
