import { body } from "express-validator";
import { findUserByEmail, findUserByUserName } from "./service";

async function checkEmailNotInUse(emailId: string) {
    const user = await findUserByEmail(emailId);
    if(user) {
        throw new Error("Email already in use.")
    }
    return true;
}

async function checkUserNameNotInUse(userName: string) {
    const user = await findUserByUserName(userName);
    if(user) {
        throw new Error("Username already in use.")
    }
    return true;
}

export function signUpValidatorChain() {
    return [
        body("emailId").trim().toLowerCase().isEmail().withMessage("Invalid email address.").custom(checkEmailNotInUse).withMessage("This email is already in use."),
        body("password").isLength({min: 8}).withMessage("Password must be atleast 8 characters long."),
        body("firstName").trim().notEmpty().withMessage("First Name cannot be empty."),
        body("userName").trim().notEmpty().custom(checkUserNameNotInUse).withMessage("UserName unavailable. Please try a different username.")
    ];
}

export function signInValidatorChain() {
    return [
        body("emailId").toLowerCase().isEmail().withMessage("Invalid Email"),
        body("password").isLength({min: 8}).withMessage("Password must be atleast 8 characters long.")
    ];
}