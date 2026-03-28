import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RedeemStatus, RewardType } from "../backend.d";
import { useActor } from "./useActor";

export function useIsRegistered() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isRegistered"],
    queryFn: () => actor!.isRegistered(),
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: () => actor!.getCallerUserProfile(),
    enabled: !!actor && !isFetching,
  });
}

export function useCoinBalance() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["coinBalance"],
    queryFn: () => actor!.getCoinBalance(),
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useNotices() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["notices"],
    queryFn: () => actor!.getNotices(),
    enabled: !!actor && !isFetching,
  });
}

export function useRedeemHistory() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["redeemHistory"],
    queryFn: () => actor!.getRedeemHistory(),
    enabled: !!actor && !isFetching,
  });
}

export function useAllRedeemRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allRedeemRequests"],
    queryFn: () => actor!.getAllRedeemRequests(),
    enabled: !!actor && !isFetching,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: () => actor!.isCallerAdmin(),
    enabled: !!actor && !isFetching,
  });
}

export function useRecordAdWatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => actor!.recordAdWatch(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coinBalance"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useSubmitRedeem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      rewardType,
      amount,
    }: { rewardType: RewardType; amount: bigint }) =>
      actor!.submitRedeemRequest(rewardType, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coinBalance"] });
      qc.invalidateQueries({ queryKey: ["redeemHistory"] });
    },
  });
}

export function useUpdateRedeemStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: bigint; status: RedeemStatus }) =>
      actor!.updateRedeemStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allRedeemRequests"] });
    },
  });
}

export function usePostNotice() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      description,
    }: { title: string; description: string }) =>
      actor!.postNoticeWithPassword(
        title,
        description,
        "GamerAdmin@06052006#2026",
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useUpdateUsername() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => actor!.updateUsername(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["isRegistered"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}
