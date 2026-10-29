import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errMsg } from '@/lib/format';
export function useAction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (action: () => Promise<unknown>) => action(), onSuccess: async () => { await qc.invalidateQueries(); toast.success('Salvo com sucesso.'); }, onError: e => toast.error(errMsg(e)) });
}
export function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}