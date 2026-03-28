import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Notice {
    title: string;
    date: Time;
    description: string;
}
export interface RedeemRequest {
    id: bigint;
    status: RedeemStatus;
    date: Time;
    user: Principal;
    rewardType: RewardType;
    amount: bigint;
}
export interface UserProfile {
    nextAdWatchTime: Time;
    username: string;
    coinBalance: bigint;
    dailyAdCount: bigint;
}
export enum RedeemStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum RewardType {
    amazon = "amazon",
    googlePlay = "googlePlay"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllRedeemRequests(): Promise<Array<RedeemRequest>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCoinBalance(): Promise<bigint>;
    getNotices(): Promise<Array<Notice>>;
    getRedeemHistory(): Promise<Array<RedeemRequest>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isRegistered(): Promise<boolean>;
    postNotice(title: string, description: string): Promise<void>;
    postNoticeWithPassword(title: string, description: string, password: string): Promise<void>;
    recordAdWatch(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    submitRedeemRequest(rewardType: RewardType, amount: bigint): Promise<void>;
    updateRedeemStatus(redeemId: bigint, status: RedeemStatus): Promise<void>;
    updateUsername(username: string): Promise<void>;
}
