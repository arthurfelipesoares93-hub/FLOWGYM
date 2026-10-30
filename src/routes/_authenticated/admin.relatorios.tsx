import {createFileRoute} from '@tanstack/react-router';
import {managementOptions} from '@/lib/management';
import {BusinessReports} from '@/components/app/business-reports';
import {PortalError} from '@/components/app/route-feedback';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/admin/relatorios')({head:()=>pageHead('Relatórios','Dados reais de alunos, pagamentos, relacionamento e treinos por período.'),loader:({context})=>context.queryClient.ensureQueryData(managementOptions),component:BusinessReports,errorComponent:PortalError});