import { NextFunction, Response, Request } from "express";
import { validationResult } from "express-validator";

export const isValidEmail = function(email: string) {
    const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return expression.test(email);
}

export const isValidPassword = function(password: string) {
    return true; // todo: Add password validation here
}

export const isValidContactNumber = function(contactNumber: string) {
    const expression: RegExp = /^(\d{3})[- ]?(\d{3})[- ]?(\d{4})$/;
    return expression.test(contactNumber);
}

export function validate(request: Request, response: Response, next: NextFunction) {
    const errors = validationResult(request);
    if(errors.isEmpty()) {
        next();
    }
    else {
        response.status(400).json({errors: errors.array()});
    }
}