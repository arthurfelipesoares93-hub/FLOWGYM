import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errMsg } from "@/lib/format";
const withId = (id: string | number | undefined) => (id === undefined ? {} : { id });
export function useAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (action: () => Promise<unknown>) => action(),
    // Aviso imediato: a lista só atualiza depois da nova consulta, que pode levar alguns segundos.
    onMutate: () => toast.loading("Salvando…"),
    onSuccess: async (_data, _vars, toastId) => {
      toast.success("Salvo com sucesso.", withId(toastId));
      await qc.invalidateQueries();
    },
    onError: (e, _vars, toastId) => {
      toast.error(errMsg(e), withId(toastId));
    },
  });
}
export function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}
