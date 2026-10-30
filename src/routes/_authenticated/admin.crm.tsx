import {createFileRoute} from '@tanstack/react-router';
import {managementOptions} from '@/lib/management';
import {CRMLeads} from '@/components/app/crm-leads';
import {PortalError} from '@/components/app/route-feedback';
import {pageHead} from '@/lib/seo';
export const Route=createFileRoute('/_authenticated/admin/crm')({head:()=>pageHead('CRM de interessados','Relacionamento, contatos e matrículas do Team Oliveira.'),loader:({context})=>context.queryClient.ensureQueryData(managementOptions),component:CRMLeads,errorComponent:PortalError});