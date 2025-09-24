// ==========================================
// src/types/auth.types.ts
// ==========================================

import { UserResponse } from "./user.types";

export interface OutlookUser {
    id: string;
    mail?: string;
    userPrincipalName?: string;
    displayName?: string;
    givenName?: string;
    surname?: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
    businessPhones?: string[];
    mobilePhone?: string;
}

export interface OutlookTokenResponse {
    valid: boolean;
    user?: OutlookUser;
    error?: string;
}

export interface LoginRequest {
    token: string;
}

export interface LoginResponse {
    ok: boolean;
    message: string;
    usuario?: UserResponse;
    token?: string;
    loginMethod?: 'outlook' | 'test' | 'pimu';
    timestamp?: string;
    error?: string;
}

export interface RefreshTokenRequest {
    token: string;
}

export interface RefreshTokenResponse {
    ok: boolean;
    message: string;
    token?: string;
    usuario?: UserResponse;
    renovadoAt?: string;
    error?: string;
}

export interface VerifyTokenResponse {
    ok: boolean;
    message: string;
    usuario?: UserResponse;
    tokenInfo?: {
        valid: boolean;
        uid: string;
        verificadoAt: string;
    };
    error?: string;
}
