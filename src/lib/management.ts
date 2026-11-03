import { queryOptions } from "@tanstack/react-query";
import { getManagement } from "./management.functions";
export const managementOptions = queryOptions({
  queryKey: ["management"],
  queryFn: () => getManagement(),
});
export type ManagementData = Awaited<ReturnType<typeof getManagement>>;
