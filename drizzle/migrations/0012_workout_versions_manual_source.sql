ALTER TABLE public.workout_versions DROP CONSTRAINT IF EXISTS workout_versions_source_check;
--> statement-breakpoint
ALTER TABLE public.workout_versions ADD CONSTRAINT workout_versions_source_check CHECK (source IN ('ia', 'revisao', 'manual'));
