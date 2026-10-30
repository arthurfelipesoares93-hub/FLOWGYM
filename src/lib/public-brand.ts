import {useQuery} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
export type PublicBrand={phone?:string;cta?:string;invite_code?:string;brand?:string;professional?:string;photo?:string;logo?:string;theme?:string};
export function usePublicBrand(){return useQuery({queryKey:['public-contact'],queryFn:async()=>{const r=await supabase.rpc('public_team_contact');if(r.error)throw r.error;return r.data as PublicBrand|null;},staleTime:30000});}