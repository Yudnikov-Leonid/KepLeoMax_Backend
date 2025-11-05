import { createNewUser, login, refreshToken } from '../controllers/authController.js'
import { users } from '../db/users';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn((payload, secret, options) => `${secret}_jwt`),
    verify: jest.fn((token, secret, callback) => {
        callback(new Error(), undefined)
    })
}))

const mockRequest = {
    body:  {}
};

const mockResponse = {
    status: jest.fn().mockReturnThis(),
    sendStatus: jest.fn(),
    json: jest.fn(),
};

describe('tokens tests', () => {
    beforeEach(() => {
        doBeforeEach();
    });

    afterAll(() => {
         doAfterAll();
    });

    it('login: register, login, should get both tokens', async () => {
        // register a user
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(201, {success: 'New user aaa created'});

        // login
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`, refreshToken: `${refreshTokenSecret}_jwt`});
        expect(jwt.sign.mock.calls[0]).toEqual([{email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'}]);
        expect(jwt.sign.mock.calls[1]).toEqual([{email: 'aaa'}, refreshTokenSecret, {expiresIn: '1d'}]);
        expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('refresh: register, login, refresh token', async () => {
        // register a user
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(201, {success: 'New user aaa created'});

        // login
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`, refreshToken: `${refreshTokenSecret}_jwt`});
        expect(jwt.sign.mock.calls[0]).toEqual([{email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'}]);
        expect(jwt.sign.mock.calls[1]).toEqual([{email: 'aaa'}, refreshTokenSecret, {expiresIn: '1d'}]);
        expect(jwt.sign).toHaveBeenCalledTimes(2);

        // no token
        mockRequest.body = {};
        refreshToken(mockRequest, mockResponse);
        checkMockResponseSendStatusCalledWith(401);

        // incorrect token (user not found)
        var token = `${refreshTokenSecret}_jwt123`;
        mockRequest.body = {refreshToken: token};
        refreshToken(mockRequest, mockResponse);
        checkMockResponseSendStatusCalledWith(403);

        // correct token with error
        token = `${refreshTokenSecret}_jwt`;
        mockRequest.body = {refreshToken: token};
        refreshToken(mockRequest, mockResponse);
        checkJwtVerifyCalledWith(token, refreshTokenSecret, expect.anything());
        checkMockResponseSendStatusCalledWith(403);

        // correct token with success
        jest.spyOn(jwt, 'verify').mockImplementationOnce((token, secret, callback) => {
            callback(undefined, {email: 'aaa'})  
        });
        refreshToken(mockRequest, mockResponse);
        checkJwtVerifyCalledWith(token, refreshTokenSecret, expect.anything());
        checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`});
        expect(jwt.sign).toHaveBeenLastCalledWith({email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'});
        expect(jwt.sign).toHaveBeenCalledTimes(3);
    });
})

describe('auth tests', () => {
    beforeEach(() => {
        doBeforeEach();
    });

    afterAll(() => {
         doAfterAll();
    });

    it('register: fields validation, success, duplicate email, success', async () => {
        // check fields validation
        mockRequest.body = {};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(400, {message: 'Email and password are required'});
   
        mockRequest.body = {email: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(400, {message: 'Email and password are required'});

        mockRequest.body = {password: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(400, {message: 'Email and password are required'});

        // success
        mockRequest.body = {email: 'aaa', password: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(201, {success: 'New user aaa created'});

        // create a new user with the same email
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(409, {message: 'User with email aaa is alredy exists'});

        // one more success
        mockRequest.body = {email: 'aaa2', password: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(201, {success: 'New user aaa2 created'});
    });

    it('login: fields validation, login with unregistered email, register, incorrect password, success', async () => {
        // check fields validation
        mockRequest.body = {};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(400, {message: 'Email and password are required'});

        mockRequest.body = {email: 'aaa'};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(400, {message: 'Email and password are required'});

        mockRequest.body = {password: 'bbb'};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(400, {message: 'Email and password are required'});

        // login as unregistered user
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(401, {message: 'User with email aaa was not found'});

        // register a user
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await createNewUser(mockRequest, mockResponse);
        checkMockResponseCalledWith(201, {success: 'New user aaa created'});

        // password is incorrect
        mockRequest.body = {email: 'aaa', password: 'bbb1'};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(401, {message: 'Password is incorrect'});

        // success
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await login(mockRequest, mockResponse);
        checkMockResponseCalledWith(200, {accessToken: `${accessTokenSecret}_jwt`, refreshToken: `${refreshTokenSecret}_jwt`});
        expect(jwt.sign.mock.calls[0]).toEqual([{email: 'aaa'}, accessTokenSecret, {expiresIn: '60s'}]);
        expect(jwt.sign.mock.calls[1]).toEqual([{email: 'aaa'}, refreshTokenSecret, {expiresIn: '1d'}]);
        expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
})

// settings functiongs
const OLD_ENV = process.env;
let accessTokenSecret;
let refreshTokenSecret;
const doBeforeEach = () => {
    jest.resetModules();
    mockResponseCalledTimes = 0;
    mockResponseSendStatusCalledTimes = 0;
    jwtVerifyCalledTimes = 0;
    process.env = { ...OLD_ENV, ACCESS_TOKEN_SECRET:'access_token_super_secret', REFRESH_TOKEN_SECRET:'refresh_token_super_secret' }; // Make a copy
    users.length = 0;
    accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
}
const doAfterAll = () => {
    process.env = OLD_ENV;
}

// mock helpers
let mockResponseCalledTimes = 0
const checkMockResponseCalledWith = (statusCode, ...params) => {
    mockResponseCalledTimes++;
    expect(mockResponse.status).toHaveBeenLastCalledWith(statusCode);
    expect(mockResponse.status).toHaveBeenCalledTimes(mockResponseCalledTimes);
    expect(mockResponse.json).toHaveBeenLastCalledWith(...params);
    expect(mockResponse.json).toHaveBeenCalledTimes(mockResponseCalledTimes);
}
let mockResponseSendStatusCalledTimes = 0;
const checkMockResponseSendStatusCalledWith = (statusCode) => {
    mockResponseSendStatusCalledTimes++;
    expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(statusCode);
    expect(mockResponse.sendStatus).toHaveBeenCalledTimes(mockResponseSendStatusCalledTimes);
}
let jwtVerifyCalledTimes = 0;
const checkJwtVerifyCalledWith = (...params) => {
    jwtVerifyCalledTimes++;
    expect(jwt.verify).toHaveBeenLastCalledWith(...params);
    expect(jwt.verify).toHaveBeenCalledTimes(jwtVerifyCalledTimes);
}