<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Protected portal pages live under the managed authenticated layout, with admin and student parent layouts providing the navigation shell; this keeps each URL independently accessible.
- Initial portal and student reads use authenticated server functions with Query loader priming and suspense subscriptions; private reads stay RLS-scoped and refresh together after mutations.
- Workout publication and financial changes use the existing authorized database RPCs; ordinary updates must never bypass their review or audit checks.
