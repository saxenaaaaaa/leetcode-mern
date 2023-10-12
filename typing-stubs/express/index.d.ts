import express from "express-serve-static-core"

declare global {
    namespace Express {
        interface Request{
            userData?: any
        }
        interface Response{
            promise: any
        }
    }
}

// declare module express {
//     namespace e {
        
//     }
// }
