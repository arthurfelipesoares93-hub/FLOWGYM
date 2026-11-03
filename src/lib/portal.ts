import { queryOptions } from "@tanstack/react-query";
import { getPortal, getStudent } from "./portal.functions";
export const portalOptions = queryOptions({ queryKey: ["portal"], queryFn: () => getPortal() });
export const studentOptions = (studentId?: string) =>
  queryOptions({
    queryKey: ["student-detail", studentId ?? "me"],
    queryFn: () => getStudent({ data: studentId ? { studentId } : {} }),
  });
export type StudentData = Awaited<ReturnType<typeof getStudent>>;
export type PortalData = Awaited<ReturnType<typeof getPortal>>;
