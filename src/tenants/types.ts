export type Role = "OWNER" | "ADMIN" | "MANAGER" | "CASHIER" | "KITCHEN" | "VIEWER";

export interface SettingRequest {
    user: {
        userId: string,
        email: string,
        tenantId: string,
        role: Role
    }
}

export interface Me {
    email: string;
    name: string | null;
}