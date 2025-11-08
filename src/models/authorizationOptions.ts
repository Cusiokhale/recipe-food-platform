export interface AuthorizationOptions {
    hasRole: Array<"user" | "admin">;
    allowSameUser?: boolean;
}