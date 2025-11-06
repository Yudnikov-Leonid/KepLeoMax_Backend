export const setup = (requestObject, responseObject) => {
    mockRequest = requestObject;
    mockResponse = responseObject;
}

let mockRequest;
let mockResponse;

export const resetCalledTimes = () => {
    mockResponseCalledTimes = 0;
    mockResponseSendStatusCalledTimes = 0;
    jwtVerifyCalledTimes = 0;
    poolQueryCalledTimes = 0;
}

// mock helpers
let mockResponseCalledTimes = 0
export const checkMockResponseCalledWith = (statusCode, ...params) => {
    mockResponseCalledTimes++;
    expect(mockResponse.status).toHaveBeenLastCalledWith(statusCode);
    expect(mockResponse.status).toHaveBeenCalledTimes(mockResponseCalledTimes);
    expect(mockResponse.json).toHaveBeenLastCalledWith(...params);
    expect(mockResponse.json).toHaveBeenCalledTimes(mockResponseCalledTimes);
}
let mockResponseSendStatusCalledTimes = 0;
export const checkMockResponseSendStatusCalledWith = (statusCode) => {
    mockResponseSendStatusCalledTimes++;
    expect(mockResponse.sendStatus).toHaveBeenLastCalledWith(statusCode);
    expect(mockResponse.sendStatus).toHaveBeenCalledTimes(mockResponseSendStatusCalledTimes);
}