# CLAUDE.md


## Design system

Dark theme, no CSS frameworks beyond Tailwind for layout. All colors are inline styles:

| Token | Value | Usage |
|---|---|---|
| Background card | `#2A2A29` | Cards, modals, sidebar |
| Background deep | `#20201F` | Page background, inputs |
| Border | `#3D3D3B` | All borders |
| Text primary | `#F0F0EE` | Headings, values |
| Text muted | `#5C5C59` | Labels, subtitles |
| Text mid | `#9A9A96` | Secondary text |
| Green | `#7AB619` | Brand, CTAs, icons |
| Purple | `#8B5CF6` | Recetas feature |
| Blue | `#3B82F6` | Secondary stats |

Content areas use `w-[90%] mx-auto` (not `max-w-*`).

## Environment variables

| Variable | Used where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Both clients |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server anon client |
| `SUPABASE_SERVICE_ROLE_KEY` | `createAdminClient()` — server only |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push subscription in browser |
| `VAPID_PRIVATE_KEY` | `/api/push/enviar` — server only |
| `VAPID_EMAIL` | VAPID identification |
| `N8N_WEBHOOK_URL` | `/api/chat` proxy (optional, has default) |

