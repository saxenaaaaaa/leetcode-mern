import { Request, Response, NextFunction } from "express";

export enum HttpStatusCode {
    OK = 200,
    NOT_FOUND = 404,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    INTERNAL_SERVER_ERROR = 500
}

export const responsePromisifier = (request: Request, response: Response, next: NextFunction) => {
    response.promise = (value: any) => {
        let promiseToResolve;
        if(value.then && value.catch) {
            promiseToResolve = value;
        }
        else if(typeof value === 'function') {
            promiseToResolve = Promise.resolve().then(() => value());
        }
        else {
            promiseToResolve = Promise.resolve(value);
        }
        return promiseToResolve.then((resolvedValue: any) => handleSuccess(response, resolvedValue)).catch((error: any) => handleFailure(response, error));
    }
    next();
}

function handleSuccess(response: Response, resolvedValue: any) {
    response.status(HttpStatusCode.OK).send(resolvedValue);
}
function handleFailure(response: Response, error: any) {
    // do all the stuff that needs to be done on error like logging, sending events to cloudwatch etc.
    response.status(error.status || HttpStatusCode.INTERNAL_SERVER_ERROR).send(error.message);
}

