require("dotenv").config();
const compression = require("compression");
const express = require("express");
const { default: helmet } = require("helmet");
const morgan = require("morgan");
const app = express();
const { v4: uuidv4 } = require('uuid');
const myLogger = require('./logger/mylogger.log');
const cors = require("cors");

// remove log file start application
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);

const clearLogsFolder = async () => {
    const folderPath = path.join(__dirname, '../logs'); // Path to the logs folder
    try {
        const files = await readdir(folderPath);
        const unlinkPromises = files.map(file => unlink(path.join(folderPath, file)));
        await Promise.all(unlinkPromises);
        console.log(`Cleared all files from folder: ${folderPath}`);
    } catch (err) {
        console.error(`Error while clearing folder: ${folderPath}`, err);
    }
};

// Clear the logs folder before starting the server
clearLogsFolder();

// console.log("process", process.env);

// init middlewares
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
    origin: true, //=> chỉ cho phép kết nổi từ cùng origin với server //'*' => cho phép kết nối từ bất cứ nơi đâu, //http://localhost:3000 => specific
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    // optionsSuccessStatus: 204,
    credentials: true,
}));



// tracking log
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'];
    req.requestId = requestId ? requestId : uuidv4();
    myLogger.log(`input params::${req.method}::`, [
        req.path,
        { requestId: req.requestId },
        req.method === 'POST' ? req.body : req.query
    ])
    next();
})


// test pub.sub redis 
// const inventoryTest = require('./tests/inventory.test');
// const productTest = require('./tests/product.test');

// productTest.purchaseProduct('product:001', 10)

// init mongo db
require("./dbs/init.mongodb");

// init mongo redis
const initRedis = require("./dbs/init.redis")
initRedis.initRedis()

// init mysql
// require("./dbs/init.mysql");

// init routes
app.use('/', require('./routes'))

// handle errors
app.use((req, res, next) => {
    const error = new Error('Not found')
    error.status = 404,
        next(error)
})

app.use((error, req, res, next) => {
    const statusCode = error.status || 500;
    const resMessage = `${error.status} - ${Date.now() - error.now}ms - Response: ${JSON.stringify(error)}`
    myLogger.error(resMessage, [
        req.path,
        { requestId: req.requestId },
        {
            message: error.message
        }
    ])
    return res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        // stack: error.stack,
        message: error.message || 'Internal Server Error'
    })
})

module.exports = app;
