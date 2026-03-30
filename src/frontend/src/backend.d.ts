import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WheelInput {
    name: string;
    options: Array<WheelOption>;
}
export interface UserProfile {
    name: string;
}
export interface SpinEntry {
    selectedLabel: string;
    selectedWeight: bigint;
    timestamp: bigint;
}
export interface WheelOption {
    id: string;
    weight: bigint;
    optionLabel: string;
    color?: string;
    enabled: boolean;
}
export interface Wheel {
    id: string;
    name: string;
    createdAt: bigint;
    updatedAt: bigint;
    options: Array<WheelOption>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createWheel(input: WheelInput): Promise<Wheel>;
    deleteWheel(wheelId: string): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getSpinHistory(wheelId: string): Promise<Array<SpinEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWheel(wheelId: string): Promise<Wheel | null>;
    getWheels(): Promise<Array<Wheel>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    spinWheel(wheelId: string): Promise<SpinEntry | null>;
    updateWheel(wheelId: string, input: WheelInput): Promise<Wheel | null>;
}
