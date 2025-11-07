import { createNewUser, login, refreshToken } from "../controllers/authController.js";
import * as usersModel from '../models/usersModel.js';
import * as profilesModel from "../models/profilesModel.js";
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn((payload, secrets, options) => `token_${options.expiresIn}`),
    verify: jest.fn((token, secret, callback) => {
        callback(undefined, undefined);
    })
}));

jest.mock('../models/usersModel.js', () => ({
    haveDuplicateWithEmail: jest.fn(),
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    updateRefreshTokens: jest.fn(),
    getUserByRefreshToken: jest.fn(),
    resetRefreshTokensByUserId: jest.fn(),
}));

jest.mock('../models/profilesModel.js', () => ({
    createUserProfile: jest.fn()
}));

jest.mock('bcrypt', () => ({
    compare: (a, b) => `${a}-crypt` === b,
    hash: (password, _) => `${password}-crypt`,
}));

const mockRequest = {
    body: {}
};

const mockResponse = {
    status: jest.fn().mockReturnThis(),
    sendStatus: jest.fn(),
    json: jest.fn(),
};

describe('auth tests', () => {
    it('register', async () => {
        // check fields requirement
        mockRequest.body = {};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Email and password are required' });

        mockRequest.body = { email: 'email@cool.com' };
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Email and password are required' });

        mockRequest.body = { password: 'password123' };
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Email and password are required' });

        // duplicate
        usersModel.haveDuplicateWithEmail.mockReturnValueOnce(true);
        mockRequest.body = { email: 'email@cool.com', password: 'password123' };
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(409);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'User with email email@cool.com is alredy exists' });

        // success
        usersModel.haveDuplicateWithEmail.mockReturnValueOnce(false);
        usersModel.createUser.mockReturnValueOnce(232);
        mockRequest.body = { email: 'email@cool.com', password: 'password123' };
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(201);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ success: 'New user email@cool.com created' });
        expect(usersModel.createUser).toHaveBeenLastCalledWith('email@cool.com', 'password123-crypt');
        expect(profilesModel.createUserProfile).toHaveBeenLastCalledWith(232);
    });

    it('login', async () => {
        // check fields requirement
        mockRequest.body = {};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Email and password are required' });

        mockRequest.body = { email: 'email@cool.com' };
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Email and password are required' });

        mockRequest.body = { password: 'password123' };
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Email and password are required' });

        // user not found
        mockRequest.body = { email: 'email@cool.com', password: 'password123' };
        usersModel.getUserByEmail.mockReturnValueOnce(null);
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(401);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'User with email email@cool.com not found' });

        // incorrect password
        mockRequest.body = { email: 'email@cool.com', password: 'password123' };
        usersModel.getUserByEmail.mockReturnValueOnce({ id: 10, email: 'email@cool.com', password: 'password', refresh_tokens: [] });
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(401);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ message: 'Password is incorrect' });

        // success
        mockRequest.body = { email: 'email@cool.com', password: 'password123' };
        usersModel.getUserByEmail.mockReturnValueOnce({ id: 10, email: 'email@cool.com', password: 'password123-crypt', refresh_tokens: ['first_token'] });
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(200);
        expect(mockResponse.json).toHaveBeenLastCalledWith({ accessToken: 'token_300s', refreshToken: 'token_1d' });
        expect(jwt.sign.mock.calls[0]).toEqual([{ UserInfo: { id: 10, email: 'email@cool.com' } }, undefined, { expiresIn: '300s' }]); // undefined - secrets from .env
        expect(jwt.sign.mock.calls[1]).toEqual([{ UserInfo: { id: 10, email: 'email@cool.com' } }, undefined, { expiresIn: '1d' }]);
        expect(usersModel.updateRefreshTokens).toHaveBeenCalledWith(10, ['first_token', 'token_1d']);
    });

    it('refresh', async () => {
        return; // TODO

        // check fields requirement
        mockRequest.body = {};
        await refreshToken(mockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(401);

        // user not found, token error
        const token = 'super_refresh_token';
        mockRequest.body = {refreshToken: token};
        usersModel.getUserByRefreshToken.mockReturnValueOnce(null);
        jwt.verify.mockReturnValueOnce(
            jest.fn((token, secret, callback) => {
                callback(new Error(), undefined);
            })
        );
        await refreshToken(mockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(403);
        expect(jwt.verify).toHaveBeenCalledWith(token, undefined, expect.anything());

        // user not found (should delete all refreshTokens)
        usersModel.getUserByRefreshToken.mockReturnValueOnce(null);
        usersModel.getUserByEmail.mockReturnValueOnce({id: 444, email: 'email@cool.com'});
        jwt.verify.mockReturnValueOnce(
            jest.fn((token, secret, callback) => {
                callback(undefined, {UserInfo: {email: 'email@cool.com'}});
            })
        );
        await refreshToken(mockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(403);
        expect(jwt.verify).toHaveBeenCalledWith(token, undefined, expect.anything());
        expect(usersModel.resetRefreshTokensByUserId).toHaveBeenCalledWith(444);

        // token error
        usersModel.getUserByRefreshToken.mockReturnValueOnce({id: 555, email: 'email@cool.com'});
        jwt.verify.mockReturnValueOnce(
            jest.fn((token, secret, callback) => {
                callback(new Error(), undefined);
            })
        );
        await refreshToken(mockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(403);
        expect(jwt.verify).toHaveBeenCalledWith(token, undefined, expect.anything());

        // decodedToken.email != foundUser.email
        usersModel.getUserByRefreshToken.mockReturnValueOnce({id: 555, email: 'email@cool.com'});
        jwt.verify.mockReturnValueOnce(
            jest.fn((token, secret, callback) => {
                callback(undefined, {UserInfo: {email: 'email@not_cool.com'}});
            })
        );
        await refreshToken(mockRequest, mockResponse);
        expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(403);
        expect(jwt.verify).toHaveBeenCalledWith(token, undefined, expect.anything());

        // success
        usersModel.getUserByRefreshToken.mockReturnValueOnce({id: 555, email: 'email@cool.com', refresh_tokens: ['first_token']});
        jwt.verify.mockReturnValueOnce(
            jest.fn((token, secret, callback) => {
                callback(undefined, {UserInfo: {email: 'email@cool.com'}});
            })
        );
        await refreshToken(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(200);
        expect(mockResponse.json).toHaveBeenLastCalledWith({
            accessToken: 'token_300s', refreshToken: 'token_1d',
        });
        expect(usersModel.updateRefreshTokens).toHaveBeenLastCalledWith(['first_token', 'token_1d']);
        expect(jwt.verify).toHaveBeenCalledWith(token, undefined, expect.anything());
    });
});