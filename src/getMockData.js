import assert from 'assert';
import {pathToRegexp} from 'path-to-regexp';
import bodyParser from 'body-parser';
import multer from 'multer';

const VALID_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const BODY_PARSED_METHODS = ['post', 'put', 'patch', 'delete'];


/**
 * 创建 Mock 的处理器
 * @param method
 * @param path
 * @param handler
 * @returns {Function}
 */
function createHandler(method, path, handler) {
    return function (req, res, next) {
        if (BODY_PARSED_METHODS.includes(method)) {
            bodyParser.json({strict: false})(req, res, () => {
                bodyParser.urlencoded({extended: true})(
                    req,
                    res,
                    () => {
                        sendData();
                    },
                );
            });
        } else {
            sendData();
        }

        function sendData() {
            if (typeof handler === 'function') {
                multer().any()(req, res, () => {
                    handler(req, res, next);
                });
            } else {
                res.json(handler);
            }
        }
    };
}

/**
 * 解析Key
 * @param key
 * @returns {{path: *, method: string}}
 */
function parseKey(key) {
    let method = 'get';
    let path = key;

    if (/\s+/.test(key)) {
        const splited = key.split(/\s+/);
        method = splited[0].toLowerCase();
        path = splited[1]; // eslint-disable-line
    }
    assert(
        VALID_METHODS.includes(method),
        `Invalid method ${method} for path ${path}, please check your mock files.`,
    );
    return {
        method,
        path,
    };
}

/**
 * 格式化
 * @param config
 * @returns {Array}
 */
export function normalizeConfig(config) {
    return Object.keys(config).reduce((memo, key) => {
        const handler = config[key];
        const type = typeof handler;
        assert(
            type === 'function' || type === 'object',
            `mock value of ${key} should be function or object, but got ${type}`,
        );
        const {method, path} = parseKey(key);
        const keys = [];
        const re = pathToRegexp(path, keys);
        memo.push({
            method,
            path,
            re,
            keys,
            handler: createHandler(method, path, handler),
        });
        return memo;
    }, []);
}

/**
 * 获取 Mock 数据
 * @param array mockDataConfig
 * @returns {Array}
 */
export function getMockData(mockDataConfig) {
    try {
        return normalizeConfig(mockDataConfig);
    } catch (e) {
        console.error(`Mock files parse failed`);
        throw e;
    }
}