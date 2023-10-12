// This is just a test file for testing syntaxes. It is not related to the project.

import { prop } from "@typegoose/typegoose";

class User {
    public userName!: string;
    public password!: Password;
}

export const user = new User();

class Password {
    public hash!: string;
    public salt!: string;
}

