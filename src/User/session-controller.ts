import { NextFunction, Response, Request } from "express";
import session from "express-session";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { findUserByEmail } from "./service";

export const secretKey = 'SomeSuperLongHardToGuessSecretString' // Todo: Figure out how key storage and key management is done and how key rotation works 

/**
 * In this file, I have implemented session management using 2 techniques - 1. Using express-session library. 2. Using Json Web Tokens (JWT)
 * We can use either of these methods to implement user Login sessions.
 */
export enum AuthenticationMethod {
    SESSION = "session",
    JWT = "jwt"
}

export let authInUse = AuthenticationMethod.JWT;

export const isAuthenticated = (request: Request,  response: Response, next: NextFunction) => {
    if(authInUse == AuthenticationMethod.SESSION) {
        isAuthenticatedSessionn(request, response, next);
    }
    else if(authInUse == AuthenticationMethod.JWT) {
        isAuthenticatedJwt(request, response, next);
    }
    else {
        throw Error("Invalid authentication method"); 
    }
}

export const isLoggedOut = (request: Request,  response: Response, next: NextFunction) => {
    switch(authInUse) {
        case AuthenticationMethod.SESSION: isLoggedOutSession(request, response, next); break;
        case AuthenticationMethod.JWT: isLoggedOutJwt(request, response, next); break;
        default: throw Error("Invalid authentication method"); 
    }
}

/**
 *  Implementing session using "express-session"
 * */ 

export const sessionCreator = () => {
    
    // express-session saves the session data inside server specified storage, while sending back the session id as cookie back to the client. The default name
    // of the cookie is connect.sid. It manages everything related to the session management
    // If someone steals the cookie, they can potentially gain unauthorised access to your account. Hence, should always send cookie over https
    return session({
        secret: secretKey,
        resave: false, // only update the session data in session-store when something changes instead of saving the same data in every request
        saveUninitialized: false, // if a session is not initialized, i.e. the server does not save anything in req.session, do not save this session in the server session-store
        store: new (require('express-sessions'))({ // for scalability, session-store must not be in-memory so that every server machin in the application uses the same session-store
            storage: 'mongodb',
            instance: mongoose,
            host: 'localhost',
            port: 27017,
            db: 'test',
            collection: 'sessions',
            expire: 86400
        }),
        cookie: { 
            maxAge: 2628000000, // milliseconds after which the cookie expires
            httpOnly: true, // ensures that cookie is not accessed by any script on the client side
            secure: false // In production, this should be true. It means cookie will only be sent over an https connection.
        },
    });
}

export const isAuthenticatedSessionn = (request: Request,  response: Response, next: NextFunction) => {
    if(request.session && request.session.userData.emailId){
        next();
    }
    response.status(401).json({message: "Access Denied! Please login to access the requested resource"});
}

export const isLoggedOutSession = (request: Request,  response: Response, next: NextFunction) => {
    
    /**
     * We set the session data in request.session object when we initialise the session. express-session takes care of saving this data in the session-store
     * and returning only the session-id as cookie in the response.
     * It also uses the cookie in every further request to retrieve the session-data from store and re-assign it to request.session for the server to use.
     * We are using that data to check if the user is already looged in.
     */
    if(request.session && request.session.userData.emailId) {
        response.status(403).send({message: "The user is already logged in."});
    }
    else {
        next();
    }
}

/**
 * Implementing session using jwt-tokens
 * JWT tokens are a scalable way of managing sessions as they are secure as well as self contained. 
 * By self-contained, we mean that all the session data is securely stored inside jwt itself and they don't need any session-store on the server side.
 * This makes them scalable for larger applications with multiple servers as we do not need to keep and manage any session store.
 * A Jwt token is of the format xxx.yyy.zzz
 * where, 
 *  i). xxx represents jwt header: it contains metadata
 *  ii). yyy is called the jwt payload. It actually contains the session data that application has to create and set.
 *  iii). zzz represents the digital signature of the token which ensures security of the token. 
 *        Header and Payload are hashed and then encrypted using a secret key only server knows. This becomes the digital signature of the jwt.
 *        Upon receiving the token back in further requests. JWT signature is decrypted using the same key to get the hash which was signed. 
 *        Another hash of the header and payload of the received token is calculated. If this hash matches the decrypted hash, it means that
 *        the token was not tampered with anywhere after the server created it. That's how jwt ensures security.
 */

export const isAuthenticatedJwt = async (request: Request,  response: Response, next: NextFunction) => {
    try {
        const token = extractToken(request, response, next);
        jwt.verify(token, secretKey, (error, decodedToken) => {
            if(error) { // Token is compromised
                response.status(401).json({message: "Access Denied!. Invalid Credentials."})
            }
            request.userData = decodedToken; // Assigning decodedToken i.e. session payload to userData to be easily accessible in further request processing.
            next();
        });
    } catch(error: any) {
        response.status(401).json({message: error.message})
    }
}

export const isLoggedOutJwt = (request: Request,  response: Response, next: NextFunction) => {
    try {
        const token = extractToken(request, response, next);
        // console.log("extracted token : ", token);
        const decodedToken = jwt.verify(token, secretKey); // Verifies whether the token received is not tampered with. Throws error if the token is compromised.
        if(decodedToken) {
            response.status(403).send({message: "The user is already logged in."});
        }
        else {
            next();
        }
    }
    catch(error: any) {
        // console.log("Ooops, reached catch block");
        next();
    }
}

function extractToken(request: Request, response: Response, next?: NextFunction) {
    const authHeader = request.headers.authorization; // We expect the front-end client to send jwt token inside Header Authorization as Bearer <Token> for every requests that expects only signed in users to call them.
    // console.log("We found an auth header : ", authHeader);
    if(authHeader && authHeader.startsWith("Bearer ")) {
        const tokenArr = authHeader.split(" ");
        if(tokenArr.length < 2) {
            throw new Error("Access Denied! Authorization token not provided.");
        }
        return tokenArr[1];
    }
    throw new Error("Access Denied! Authorization token not provided in Bearer format");
}

export function extractSessionData(request: Request) {
    let userData;
    if(authInUse == AuthenticationMethod.JWT) {
        userData = request.userData; // userData will be undefined if user is not logged in
    }
    else if(authInUse == AuthenticationMethod.SESSION) {
        userData = request.session?.userData;
    }
    return userData;
}

export const validateAdmin =  async (request: Request, response: Response, next: NextFunction) => {
    let userData = extractSessionData(request);
    if(userData && userData.emailId) {
        const user = await findUserByEmail(userData.emailId);
        // console.log("Found user inside validateAdmin - ", user);
        // console.log("print isAdmin - ", user?.isAdmin);
        if(user?.isAdmin) {
            next();
        }
        else {
            response.status(403).json({message: "Forbidden! You need to be an admin to perform this operation."});
        }
    }
    else {
        response.status(403).json({message: "Forbidden! Please login to perform this operation."});
    }
}
