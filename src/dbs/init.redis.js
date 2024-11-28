// const redis = require('redis')
// const { RedisErrorResponse } = require('../core/error.response')

// let client = {}, statusConnectRedis = {
//     CONNECT: 'connect',
//     END: 'end',
//     RECONNECT: 'reconnecting',
//     ERROR: 'error'
// }

// const REDIS_CONNECT_TIMEOUT = 10000, REDIS_CONNECT_MESSAGE = {
//     code: -99,
//     message: {
//         vn: 'VN Redis loi',
//         en: 'EN Redis error'
//     }
// }

// const handleTimeoutError = () => {
//     connectionTimeout = setTimeout(() => {
//         throw new RedisErrorResponse({
//             message: REDIS_CONNECT_MESSAGE.message.vn,
//             statusCode: REDIS_CONNECT_MESSAGE.code
//         })
//     }, REDIS_CONNECT_TIMEOUT)
// }

// const handleEventConnection = ({ connectionRedis }) => {
//     // check if connection is null

//     connectionRedis.on(statusConnectRedis.CONNECT, () => {
//         console.log(`Redis - Connection status: connected`)
//         clearTimeout(connectionTimeout)
//     })

//     connectionRedis.on(statusConnectRedis.END, () => {
//         console.log(`Redis - Connection status: disconnected`)

//         // connect retry
//         handleTimeoutError()
//     })

//     connectionRedis.on(statusConnectRedis.RECONNECT, () => {
//         console.log(`Redis - Connection status: reconnecting`)
//         clearTimeout(connectionTimeout)
//     })

//     connectionRedis.on(statusConnectRedis.ERROR, (error) => {
//         console.log(`Redis - Connection status: error ${error}`)

//         // connect retry
//         handleTimeoutError()
//     })
// }

// const initRedis = async () => {
//     const instanceRedis = redis.createClient()
//     {
//         url: 'redis://localhost:6379' // Adjust this URL if your Redis server is not on localhost
//     }
//     client.instanceConnect = instanceRedis
//     handleEventConnection({ connectionRedis: instanceRedis })
//     await instanceRedis.connect()
// }

// const getRedis = () => client

// const closeRedis = () => {

// }

// module.exports = {
//     initRedis,
//     getRedis,
//     closeRedis
// }

'use strict';

const redis = require('redis');
const { RedisErrorResponse } = require('../core/error.response');

const REDIS_CONFIG = {
    CONNECT_TIMEOUT: 10000,
    ERROR_MESSAGE: {
        code: -99,
        message: {
            vn: 'VN Redis lỗi',
            en: 'EN Redis error',
        },
    },
};

const CONNECTION_STATUS = {
    CONNECT: 'connect',
    END: 'end',
    RECONNECT: 'reconnecting',
    ERROR: 'error',
};

let client = null;
let connectionTimeout = null;

function handleConnectionEvent(status, error) {
    console.log(`Redis - Connection status: ${status}`);
    if ([CONNECTION_STATUS.CONNECT, CONNECTION_STATUS.RECONNECT].includes(status)) {
        clearTimeout(connectionTimeout);
    } else if ([CONNECTION_STATUS.END, CONNECTION_STATUS.ERROR].includes(status)) {
        handleTimeoutError();
    }
    if (status === CONNECTION_STATUS.ERROR) {
        console.error(`Redis - Error details: ${error}`);
    }
}

function handleTimeoutError() {
    connectionTimeout = setTimeout(() => {
        console.error('Redis connection timeout');
        throw new RedisErrorResponse({
            message: REDIS_CONFIG.ERROR_MESSAGE.message.vn,
            statusCode: REDIS_CONFIG.ERROR_MESSAGE.code,
        });
    }, REDIS_CONFIG.CONNECT_TIMEOUT);
}

function setupEventListeners(redisClient) {
    redisClient.on(CONNECTION_STATUS.CONNECT, () => handleConnectionEvent(CONNECTION_STATUS.CONNECT));
    redisClient.on(CONNECTION_STATUS.END, () => handleConnectionEvent(CONNECTION_STATUS.END));
    redisClient.on(CONNECTION_STATUS.RECONNECT, () => handleConnectionEvent(CONNECTION_STATUS.RECONNECT));
    redisClient.on(CONNECTION_STATUS.ERROR, (error) => handleConnectionEvent(CONNECTION_STATUS.ERROR, error));
}

async function initRedis() {
    client = redis.createClient();
    setupEventListeners(client);
    await client.connect();
    console.log('Redis client connected successfully.');
}

function getRedis() {
    if (!client) {
        throw new Error('Redis client is not initialized. Call initRedis() first.');
    }
    return client;
}

async function closeRedis() {
    if (client) {
        await client.quit();
        client = null;
        console.log('Redis client connection closed.');
    }
}

module.exports = {
    initRedis,
    getRedis,
    closeRedis,
};