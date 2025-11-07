// import { createNewUser, login, refreshToken } from '../controllers/authController.js'
// import { users } from '../db/users';
// import jwt from 'jsonwebtoken';
// import pool from '../db.js';
// import { checkMockResponseCalledWith, checkMockResponseSendStatusCalledWith, resetCalledTimes, setup } from './mock_helpers.js';

// // mocks
// jest.mock('jsonwebtoken', () => ({
//     sign: jest.fn((payload, secret, options) => `${secret}_jwt`),
//     verify: jest.fn((token, secret, callback) => {
//         callback(new Error(), undefined)
//     })
// }));

// jest.mock('../db.js', () => ({
//     query: jest.fn((query, values) => ({
//         rows: []
//     })),
// }));

// jest.mock('bcrypt', () => ({
//     compare: (a, b) => `${a}-crypt` === b,
//     hash: (password, _) => `${password}-crypt`,
// }));

// const mockRequest = {
//     body:  {}
// };

// const mockResponse = {
//     status: jest.fn().mockReturnThis(),
//     sendStatus: jest.fn(),
//     json: jest.fn(),
// };

// setup(mockRequest, mockResponse);

// // settings functiongs
// const OLD_ENV = process.env;
// let accessTokenSecret;
// let refreshTokenSecret;
// const doBeforeEach = () => {
//     jest.resetModules();
//     resetCalledTimes();
//     resetCalledTimesLocal();
//     process.env = { ...OLD_ENV, ACCESS_TOKEN_SECRET:'access_token_super_secret', REFRESH_TOKEN_SECRET:'refresh_token_super_secret' }; // Make a copy
//     users.length = 0;
//     accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
//     refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
// }
// const doAfterAll = () => {
//     process.env = OLD_ENV;
// }

// // tests
// describe('tokens tests', () => {
//     beforeEach(() => {
//         doBeforeEach();
//     });

//     afterAll(() => {
//          doAfterAll();
//     });

//     it('login() and get refreshToken', async () => {
//         // login
//         mockRequest.body = {email: 'aaa', password: 'bbb'};
//         pool.query.mockReturnValueOnce({rows: [{email: 'aaa', password: 'bbb-crypt', refreshToken: null}]});
//         await login(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(2);
//         expect(pool.query.mock.calls[0]).toEqual([expect.anything(), ['aaa']]);
//         expect(pool.query.mock.calls[1]).toEqual([expect.anything(), [`${refreshTokenSecret}_jwt`, 'aaa']]);
//         checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`, refreshToken: `${refreshTokenSecret}_jwt`});
//         expect(jwt.sign.mock.calls[0]).toEqual([{email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'}]);
//         expect(jwt.sign.mock.calls[1]).toEqual([{email: 'aaa'}, refreshTokenSecret, {expiresIn: '1d'}]);
//         expect(jwt.sign).toHaveBeenCalledTimes(2);
//     });

//     it('refreshToken()', async () => {
//         // no token
//         mockRequest.body = {};
//         await refreshToken(mockRequest, mockResponse);
//         checkMockResponseSendStatusCalledWith(401);

//         // incorrect token (user not found)
//         var token = `${refreshTokenSecret}_jwt123`;
//         mockRequest.body = {refreshToken: token};
//         await refreshToken(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(1);
//         expect(pool.query.mock.calls[0]).toEqual([expect.anything(), [token]]);
//         checkMockResponseSendStatusCalledWith(403);

//         // correct token with error
//         token = `${refreshTokenSecret}_jwt`;
//         pool.query.mockReturnValueOnce({rows: [{email: 'aaa', password: 'bbb-crypt', refreshToken: null}]});
//         mockRequest.body = {refreshToken: token};
//         await refreshToken(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(2);
//         expect(pool.query.mock.calls[1]).toEqual([expect.anything(), [token]]);
//         checkJwtVerifyCalledWith(token, refreshTokenSecret, expect.anything());
//         checkMockResponseSendStatusCalledWith(403);

//         // correct token with success
//         jest.spyOn(jwt, 'verify').mockImplementationOnce((token, secret, callback) => {
//             callback(undefined, {email: 'aaa'})  
//         });
//         pool.query.mockReturnValueOnce({rows: [{email: 'aaa', password: 'bbb-crypt', refreshToken: null}]});
//         await refreshToken(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(3);
//         expect(pool.query.mock.calls[2]).toEqual([expect.anything(), [token]]);
//         checkJwtVerifyCalledWith(token, refreshTokenSecret, expect.anything());
//         checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`});
//         expect(jwt.sign).toHaveBeenLastCalledWith({email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'});
//         expect(jwt.sign).toHaveBeenCalledTimes(1);
//     });
// })

// describe('auth tests', () => {
//     beforeEach(() => {
//         doBeforeEach();
//     });

//     afterAll(() => {
//          doAfterAll();
//     });

//     it('register: fields validation, success, duplicate email, success', async () => {
//         // check fields validation
//         mockRequest.body = {};
//         await createNewUser(mockRequest, mockResponse);
//         checkMockResponseCalledWith(400, {message: 'Email and password are required'});
   
//         mockRequest.body = {email: 'aaa'};
//         await createNewUser(mockRequest, mockResponse);
//         checkMockResponseCalledWith(400, {message: 'Email and password are required'});

//         mockRequest.body = {password: 'aaa'};
//         await createNewUser(mockRequest, mockResponse);
//         checkMockResponseCalledWith(400, {message: 'Email and password are required'});

//         // success
//         mockRequest.body = {email: 'aaa', password: 'bbb'};
//         await createNewUser(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(2);
//         expect(pool.query.mock.calls[0]).toEqual([expect.anything(), ['aaa']]);
//         expect(pool.query.mock.calls[1]).toEqual([expect.anything(), ['aaa', 'bbb-crypt', null]]);
//         checkMockResponseCalledWith(201, {success: 'New user aaa created'});

//         // create a new user with the same email
//         pool.query.mockReturnValueOnce({rows: [{email: 'aaa', password: 'bbb-crypt', refreshToken: null}]});
//         await createNewUser(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(3);
//         expect(pool.query.mock.calls[2]).toEqual([expect.anything(), ['aaa']]);
//         checkMockResponseCalledWith(409, {message: 'User with email aaa is alredy exists'});

//         // one more success
//         mockRequest.body = {email: 'aaa2', password: 'bbb'};
//         await createNewUser(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(5);
//         expect(pool.query.mock.calls[3]).toEqual([expect.anything(), ['aaa2']]);
//         expect(pool.query.mock.calls[4]).toEqual([expect.anything(), ['aaa2', 'bbb-crypt', null]]);
//         checkMockResponseCalledWith(201, {success: 'New user aaa2 created'});
//     });

//     it('login: fields validation, login with unregistered email, register, incorrect password, success', async () => {
//         // check fields validation
//         mockRequest.body = {};
//         await login(mockRequest, mockResponse);
//         checkMockResponseCalledWith(400, {message: 'Email and password are required'});

//         mockRequest.body = {email: 'aaa'};
//         await login(mockRequest, mockResponse);
//         checkMockResponseCalledWith(400, {message: 'Email and password are required'});

//         mockRequest.body = {password: 'bbb'};
//         await login(mockRequest, mockResponse);
//         checkMockResponseCalledWith(400, {message: 'Email and password are required'});

//         // login as unregistered user
//         mockRequest.body = {email: 'aaa', password: 'bbb'};
//         await login(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(1);
//         expect(pool.query.mock.calls[0]).toEqual([expect.anything(), ['aaa']]);
//         checkMockResponseCalledWith(401, {message: 'User with email aaa was not found'});

//         // password is incorrect
//         pool.query.mockReturnValueOnce({rows: [{email: 'aaa', password: 'bbb-crypt', refreshToken: null}]});
//         mockRequest.body = {email: 'aaa', password: 'bbb1'};
//         await login(mockRequest, mockResponse);
//         expect(pool.query).toHaveBeenCalledTimes(2);
//         expect(pool.query.mock.calls[1]).toEqual([expect.anything(), ['aaa']]);
//         checkMockResponseCalledWith(401, {message: 'Password is incorrect'});

//         // success
//         pool.query.mockReturnValueOnce({rows: [{email: 'aaa', password: 'bbb-crypt', refreshToken: null}]});
//         mockRequest.body = {email: 'aaa', password: 'bbb'};
//         await login(mockRequest, mockResponse);
//         checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`, refreshToken: `${refreshTokenSecret}_jwt`});
//         expect(pool.query).toHaveBeenCalledTimes(4);
//         expect(pool.query.mock.calls[2]).toEqual([expect.anything(), ['aaa']]);
//         expect(pool.query.mock.calls[3]).toEqual([expect.anything(), [`${refreshTokenSecret}_jwt`, 'aaa']]);
//         expect(jwt.sign.mock.calls[0]).toEqual([{email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'}]);
//         expect(jwt.sign.mock.calls[1]).toEqual([{email: 'aaa'}, refreshTokenSecret, {expiresIn: '1d'}]);
//         expect(jwt.sign).toHaveBeenCalledTimes(2);
//     });
// })

// // mock helpers
// const resetCalledTimesLocal = () => {
//     jwtVerifyCalledTimes = 0;
//     poolQueryCalledTimes = 0;
// }

// let jwtVerifyCalledTimes = 0;
// export const checkJwtVerifyCalledWith = (...params) => {
//     jwtVerifyCalledTimes++;
//     expect(jwt.verify).toHaveBeenLastCalledWith(...params);
//     expect(jwt.verify).toHaveBeenCalledTimes(jwtVerifyCalledTimes);
// }
// let poolQueryCalledTimes = 0;
// export const checkPoolQueryCalledWith = (...params) => {
//     poolQueryCalledTimes++;
//     expect(pool.query).toHaveBeenLastCalledWith(...params);
//     expect(pool.query).toHaveBeenCalledTimes(poolQueryCalledTimes);
// }