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

## Architecture
- Frontend only: all data flows through `TelemetrySource` (src/lib/telemetry); demo source is the only implementation until the platform contract exists — never invent endpoints/topics.
- Readings are classified only when a threshold exists; freshness derives from the device's last-message timestamp.
