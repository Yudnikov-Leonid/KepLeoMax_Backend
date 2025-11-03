import { createNewUser, login } from '../controllers/authController.js'
import { users } from '../db/users';

const mockRequest = {
    body:  {}
};

const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
};

describe('auth tests', () => {
    beforeEach(() => {
        users.length = 0;
    });

    it('register test', async () => {
        // check fields validation
        mockRequest.body = {};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledTimes(1);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Email and password are required'});
   
        mockRequest.body = {email: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Email and password are required'});

        mockRequest.body = {password: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Email and password are required'});

        // success
        mockRequest.body = {email: 'aaa', password: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(201);
        expect(mockResponse.json).toHaveBeenLastCalledWith({success: 'New user aaa created'});

        // create a new user with the same email
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(409);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'User with email aaa is alredy exists'});

        // one more success
        mockRequest.body = {email: 'aaa2', password: 'aaa'};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(201);
        expect(mockResponse.json).toHaveBeenLastCalledWith({success: 'New user aaa2 created'});

        expect(mockResponse.status).toHaveBeenCalledTimes(6);
        expect(mockResponse.json).toHaveBeenCalledTimes(6);
    });

    it('login test', async () => {
        //check fields validation
        mockRequest.body = {};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledTimes(1);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Email and password are required'});

        mockRequest.body = {email: 'aaa'};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Email and password are required'});

        mockRequest.body = {password: 'bbb'};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(400);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Email and password are required'});

        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(401);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'User with email aaa was not found'}); // lastCalled function

        // register a user
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await createNewUser(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(201);
        expect(mockResponse.json).toHaveBeenLastCalledWith({success: 'New user aaa created'});

        // a password is incorrect
        mockRequest.body = {email: 'aaa', password: 'bbb1'};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(401);
        expect(mockResponse.json).toHaveBeenLastCalledWith({message: 'Password is incorrect'});

        // success
        mockRequest.body = {email: 'aaa', password: 'bbb'};
        await login(mockRequest, mockResponse);
        expect(mockResponse.status).toHaveBeenLastCalledWith(200);
        expect(mockResponse.json).toHaveBeenLastCalledWith({success: 'User aaa is logged in!'});

        expect(mockResponse.status).toHaveBeenCalledTimes(7);
        expect(mockResponse.json).toHaveBeenCalledTimes(7);
    });
})