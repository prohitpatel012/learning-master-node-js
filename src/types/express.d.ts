export interface AuthenticatedUser {
    id: number;
    name: string;
    email: string;
    role: string;
    whatsapp_number: string | null;
    is_active: boolean;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};