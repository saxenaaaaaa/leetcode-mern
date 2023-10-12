import { HttpStatusCode } from "./response-handler"

export class AppError extends Error {
    status: HttpStatusCode;

    constructor(message: string, status: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR) {
        super(message);
        this.status = status;
    }
}