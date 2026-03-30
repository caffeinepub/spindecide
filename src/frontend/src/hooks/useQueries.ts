import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { backendInterface as BackendAPI } from "../backend.d";
import type { WheelInput } from "../backend.d";
import { useActor } from "./useActor";

function api(actor: unknown): BackendAPI {
  return actor as BackendAPI;
}

export function useGetWheels() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["wheels"],
    queryFn: async () => {
      if (!actor) return [];
      return api(actor).getWheels();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetSpinHistory(wheelId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["spinHistory", wheelId],
    queryFn: async () => {
      if (!actor || !wheelId) return [];
      return api(actor).getSpinHistory(wheelId);
    },
    enabled: !!actor && !isFetching && !!wheelId,
  });
}

export function useCreateWheel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WheelInput) => {
      if (!actor) throw new Error("No actor");
      return api(actor).createWheel(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wheels"] }),
  });
}

export function useUpdateWheel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: WheelInput }) => {
      if (!actor) throw new Error("No actor");
      return api(actor).updateWheel(id, input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wheels"] }),
  });
}

export function useDeleteWheel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wheelId: string) => {
      if (!actor) throw new Error("No actor");
      return api(actor).deleteWheel(wheelId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wheels"] }),
  });
}

export function useSpinWheel() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wheelId: string) => {
      if (!actor) throw new Error("No actor");
      return api(actor).spinWheel(wheelId);
    },
    onSuccess: (_data, wheelId) => {
      qc.invalidateQueries({ queryKey: ["spinHistory", wheelId] });
    },
  });
}
