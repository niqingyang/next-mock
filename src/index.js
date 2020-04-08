import matchMock from './matchMock';
import {getMockData} from './getMockData';

/**
 *
 * @param mockDataConfig
 * @param next
 * @returns {function(...[*]=)}
 */
export default function (mockDataConfig, next) {
    const mockData = getMockData(mockDataConfig);

    return (req, res) => {
        const match = matchMock(req, mockData);

        if (match) {

            if (typeof next !== 'function') {
                next = (req, res) => {
                }
            }

            return match.handler(req, res, next);
        } else {

            if (typeof next !== 'function') {
                next = (req, res) => {
                    res.status(404).send({
                        status: 404,
                        error: 'Page Not Found',
                        message: 'No message available',
                        path: req.url,
                    });
                }
            }

            return next(req, res);
        }
    }
}