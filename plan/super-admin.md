# Plan de implementación — Super admin, clientes y aliados

## 1. Objetivo

Incorporar tres perfiles de plataforma sobre la app actual:

1. **Super admin**: acceso total a todos los clientes, suspensión, CRUD de clientes y aliados, y dashboard global de KPIs.
2. **Aliado (partner comercial / reseller)**: cuenta propia que administra una cartera de clientes referidos y ve sus métricas en modo lectura.
3. **Cliente (dueño de negocio)**: perfil actual, sin cambios de flujo salvo la validación de estado (activo/suspendido).

La implementación debe ser compatible con los datos existentes, aplicar aislamiento multi-tenant por RLS y dejar trazabilidad de las acciones administrativas.

---

## 2. Decisiones y supuestos

| Tema | Decisión |
| --- | --- |
| Aliado | Partner comercial / reseller que refiere o vende el SaaS. Tiene comisión y clientes asignados. |
| Eliminación de clientes | Borrado definitivo con confirmación estricta (escribir el slug) y auditoría. También existe suspensión reversible. |
| Roles | Un usuario puede tener `super_admin` o `ally`. El rol de dueño de negocio sigue siendo implícito por `businesses.owner_user_id`. |
| Prioridad de acceso | `super_admin` > `ally` > cliente. |
| Acceso de aliados | Solo lectura sobre los negocios asignados. No puede crear, editar, suspender ni eliminar clientes. |
| Datos de consumidores finales | El aliado **no** ve nombres ni teléfonos de miembros. Solo métricas agregadas del negocio y estado de pagos. |
| Suspensión | El panel queda en modo lectura con aviso persistente; se bloquean operaciones de fidelización, altas, sellados, canjes, avisos y cambios de programas. Se permite consultar datos y registrar pagos para regularizar. |
| Comisiones | Se muestran como **estimación** (plan del cliente × porcentaje del aliado). No se implementa liquidación ni ledger de pagos a aliados en esta fase. |
| Alcance | Sin impersonación, sin roles granulares de soporte/finanzas, sin 2FA en esta fase. |

---

## 3. Estado actual relevante

- Next.js 16.4 (App Router, Server Components y Route Handlers) + Supabase Auth/Postgres/Storage.
- El dueño se resuelve por `businesses.owner_user_id` (`lib/auth/helpers.ts`, `lib/loyalty/business.ts`). No existe tabla de roles.
- RLS actual: políticas `owner_*` basadas en `is_business_owner(business_id)`.
- `middleware.ts` solo refresca la sesión de Supabase. En Next.js 16 el archivo `middleware` está deprecado y se renombró a `proxy.ts`; se recomienda migrar durante esta implementación.
- El cliente admin con service role existe en `lib/supabase/admin.ts` y se usa solo del lado servidor.
- Migraciones existentes: `001` a `012`. La próxima es `013`.
- Tablas existentes relevantes: `businesses`, `branches`, `loyalty_programs`, `loyalty_members`, `loyalty_cards`, `loyalty_transactions`, `push_subscriptions`, `service_payments`, `notification_sends`, `notification_recipients`.
- No hay framework de tests configurado. La verificación base es `npm run lint` y `npm run build`.

---

## 4. Modelo de roles y autorización

### 4.1 Fuente de verdad

Crear `public.user_roles` para roles de plataforma. No modificar `auth.users` ni usar `user_metadata` para autorización, porque el usuario puede editar su metadata.

```sql
create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'ally')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index if not exists user_roles_role_idx on public.user_roles(role);
```

El rol de cliente no se guarda: se deriva de la existencia de un negocio propio.

### 4.2 Helpers SQL

```sql
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_ally_of(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    join public.allies a on a.id = b.ally_id
    where b.id = p_business_id
      and a.user_id = auth.uid()
      and a.status = 'active'
  );
$$;
```

Notas:

- `security definer` evita recursión de RLS al consultar `user_roles` y `allies`.
- El primer super admin se crea manualmente desde el SQL Editor (rol `postgres`) o con service role. La política RLS **no** debe permitir que un usuario autenticado se inserte a sí mismo como `super_admin`.
- Revocar ejecución pública innecesaria: `revoke execute on function public.is_super_admin() from anon;` (las funciones igual devuelven `false` sin sesión).

### 4.3 Helpers de aplicación

Crear `lib/auth/roles.ts`:

- `type PlatformRole = "super_admin" | "ally" | "client"`.
- `getPlatformRole(supabase, userId)`: consulta `user_roles`; si no hay rol de plataforma, verifica si tiene negocio y devuelve `client`.
- `requireSuperAdmin()`: obtiene usuario; si no hay sesión redirige a `/login`; si no es super admin redirige a `/panel` (o devuelve 403 en APIs).
- `requireAlly()`: exige fila en `allies` con `user_id = auth.uid()` y `status = 'active'`; devuelve `{ ally }`.
- `requireBusiness()` se extiende para devolver `business.status`.
- `assertBusinessActive(businessId)`: helper reutilizable para endpoints mutantes.

Separar guards de páginas (redirect) de guards de API (JSON + status HTTP 401/403). Nunca confiar en parámetros de la URL para el `ally_id`: siempre resolverlo desde la sesión.

### 4.4 Redirección post-login

Crear `app/auth/continue/page.tsx` (Server Component):

1. Sin sesión → `/login`.
2. `super_admin` → `/admin`.
3. `ally` activo → `/aliado`.
4. Aliado suspendido → `/cuenta-suspendida`.
5. Cliente → `/panel`.

Actualizar `app/login/page.tsx` para navegar a `/auth/continue` después de `signInWithPassword`. `/registro` sigue creando clientes y va a `/panel`.

---

## 5. Modelo de datos

### 5.1 Migración `013_platform_roles.sql`

- Tabla `user_roles` + índices.
- Funciones `is_super_admin()` e `is_ally_of()`.
- RLS de `user_roles`:
  - `select`: el propio usuario o super admin.
  - `insert/update/delete`: solo super admin.
- Comentario con el SQL de bootstrap del primer super admin.

### 5.2 Migración `014_allies.sql`

```sql
create table if not exists public.allies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  legal_name text not null default '',
  tax_id text not null default '',
  contact_name text not null default '',
  email text not null,
  phone text not null default '',
  commission_rate numeric(5,2) not null default 0
    check (commission_rate >= 0 and commission_rate <= 100),
  status text not null default 'active'
    check (status in ('active', 'suspended')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists allies_user_idx on public.allies(user_id);
create index if not exists allies_status_idx on public.allies(status);
```

- Trigger `allies_touch` reutilizando `public.touch_updated_at()`.
- RLS:
  - Super admin: `for all`.
  - Aliado: `select` solo su propia fila (`user_id = auth.uid()`).
  - Sin `insert/update/delete` para aliados.
- `user_id` puede ser `null` mientras se crea el registro y luego se invita/crea la cuenta; la app debe completarlo.

### 5.3 Migración `015_business_admin_fields.sql`

```sql
alter table public.businesses
  add column if not exists ally_id uuid references public.allies(id) on delete set null,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended')),
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text not null default '',
  add column if not exists suspended_by uuid references auth.users(id) on delete set null;

create index if not exists businesses_status_idx on public.businesses(status);
create index if not exists businesses_ally_idx on public.businesses(ally_id);
create index if not exists businesses_created_admin_idx on public.businesses(created_at desc);
```

- Todos los negocios existentes quedan `active` y `ally_id = null`.
- `on delete set null` evita borrar clientes si se elimina un aliado. La app igual debe impedir eliminar un aliado con clientes asignados hasta reasignarlos (ver 8.2).

### 5.4 Migración `016_admin_policies.sql`

Agregar políticas RLS aditivas. Las políticas actuales de dueño se mantienen.

| Tabla | Super admin | Aliado |
| --- | --- | --- |
| `businesses` | `for all` | `select` con `is_ally_of(id)` |
| `branches` | `for all` | `select` con `is_ally_of(business_id)` |
| `loyalty_programs` | `for all` | `select` con `is_ally_of(business_id)` |
| `loyalty_members` | `for all` | Sin acceso directo (solo agregados por RPC) |
| `loyalty_cards` | `for all` | Sin acceso directo (contiene tokens) |
| `loyalty_transactions` | `for all` | Sin acceso directo (solo agregados por RPC) |
| `service_payments` | `for all` | `select` con `is_ally_of(business_id)` |
| `push_subscriptions` | `for all` | Sin acceso directo |
| `notification_sends` | `for all` | Sin acceso directo |
| `notification_recipients` | `for all` | Sin acceso directo (contiene PII) |

Patrón:

```sql
create policy "super_admin_businesses" on public.businesses
for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy "ally_businesses_read" on public.businesses
for select using (public.is_ally_of(id));
```

Para el aliado, aplicar solo `for select`; no crear políticas de escritura. La privacidad se refuerza en dos capas:

1. RLS: el aliado no puede leer `loyalty_members`, `loyalty_cards`, `loyalty_transactions`, `push_subscriptions` ni destinatarios de notificaciones.
2. App: el portal de aliados solo usa `ally_dashboard_kpis`, que devuelve agregados sin PII ni tokens. `security definer` permite calcular los agregados sin exponer las filas.

### 5.5 Migración `017_admin_audit.sql`

```sql
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_created_idx
  on public.admin_audit_log(created_at desc);
create index if not exists admin_audit_entity_idx
  on public.admin_audit_log(entity_type, entity_id);
```

Acciones mínimas: `client.create`, `client.update`, `client.suspend`, `client.resume`, `client.delete`, `ally.create`, `ally.update`, `ally.suspend`, `ally.resume`, `ally.delete`, `role.grant`, `role.revoke`.

RLS: solo super admin puede `select`. Sin políticas de escritura para clientes; los inserts se hacen desde Route Handlers con service role o desde funciones `security definer`. El log es inmutable desde la app.

### 5.6 Migración `018_admin_kpis.sql`

Crear funciones `security definer` con guard explícito:

- `public.admin_dashboard_kpis(p_period text)`:
  - Si `not public.is_super_admin()` → `raise exception 'No autorizado'`.
  - Devuelve un `jsonb` con conteos, sumas y rankings.
- `public.ally_dashboard_kpis(p_allies_id uuid)`:
  - Permite super admin o el aliado dueño de esa fila.
  - Devuelve métricas agregadas de su cartera.

Los precios de planes no se duplican en SQL: la función devuelve `clients_by_plan` y `paid_by_plan`; la app calcula MRR y comisiones con `PLANS` de `lib/billing.ts`.

### 5.7 Migración `019_suspension_enforcement.sql`

- Crear `public.business_is_active(p_business_id uuid) returns boolean`.
- Redefinir `public.loyalty_earn(...)` y `public.loyalty_redeem(...)` para rechazar negocios suspendidos con un error claro. Mantener la firma y el resto de la lógica actual.
- Opcional: redefinir cualquier otra RPC de escritura existente con la misma validación.

### 5.8 Bootstrap del primer super admin

Documentar en `supabase/seed/00_bootstrap_super_admin.sql` (o en README):

```sql
-- Reemplazar por el email real del administrador.
insert into public.user_roles (user_id, role)
select id, 'super_admin'
from auth.users
where email = 'admin@tudominio.com'
on conflict do nothing;
```

Si el usuario no existe, crearlo primero en Supabase Auth o desde la app y luego ejecutar el insert.

---

## 6. Suspensión de clientes

### 6.1 Comportamiento

**Suspender** un negocio:

- Marca `status = 'suspended'`, guarda `suspended_at`, `suspended_reason`, `suspended_by`.
- Registra auditoría.
- Bloquea de inmediato:
  - Nuevas altas (`/f/[slug]`, `/api/loyalty/enroll`).
  - Sellado automático (`/n/[programSlug]`).
  - Sellado, canje y ajustes (`earn`, `redeem`, `adjust`).
  - Publicación/edición/borrado de programas y sucursales.
  - Envío de avisos push y suscripciones.
  - Cambios de logo y re-sync de Wallet.
- Permite:
  - Iniciar sesión y ver el panel en modo lectura.
  - Ver tarjeta web existente con aviso de cuenta suspendida.
  - Registrar pagos y consultar historial de pagos.
- Muestra un banner persistente en `/panel` con motivo y contacto de soporte.

**Reactivar**:

- `status = 'active'`, limpia `suspended_at`, `suspended_reason`, `suspended_by`.
- Registra auditoría.
- Restaura todas las operaciones.

### 6.2 Enforcement por capas

1. **DB**: RPC de sellado/canje valida negocio activo.
2. **Servidor**: helper `assertBusinessActive` en todos los Route Handlers mutantes de lealtad; `/f`, `/n`, `/t` consultan estado antes de renderizar.
3. **UI**: banner y botones deshabilitados en el panel; el layout no redirige para permitir consulta y pago.

Lista de endpoints a revisar:

- `app/api/loyalty/enroll/route.ts`
- `app/api/loyalty/earn/route.ts`
- `app/api/loyalty/redeem/route.ts`
- `app/api/loyalty/cards/[id]/adjust/route.ts`
- `app/api/loyalty/cards/[id]/resync/route.ts`
- `app/api/loyalty/programs/route.ts`
- `app/api/loyalty/programs/[id]/route.ts`
- `app/api/loyalty/programs/[id]/publish/route.ts`
- `app/api/loyalty/branches/route.ts`
- `app/api/loyalty/logo/route.ts`
- `app/api/loyalty/push/send/route.ts`
- `app/api/loyalty/push/subscribe/route.ts`
- `app/f/[slug]/page.tsx`
- `app/n/[programSlug]/page.tsx`
- `app/t/[token]/page.tsx`
- `app/panel/layout.tsx` y páginas con acciones.

Excepción explícita: `app/api/billing/route.ts` mantiene POST/PUT habilitados para que el cliente pueda regularizar.

---

## 7. Rutas y pantallas

### 7.1 Super admin

```text
app/admin/layout.tsx                 Shell de administración (guard + sidebar)
app/admin/page.tsx                   Dashboard global de KPIs
app/admin/clientes/page.tsx          Listado, búsqueda, filtros y paginación
app/admin/clientes/nuevo/page.tsx    Alta de cliente + cuenta de acceso
app/admin/clientes/[id]/page.tsx     Detalle, edición, suspensión y borrado
app/admin/aliados/page.tsx           Listado y filtros de aliados
app/admin/aliados/nuevo/page.tsx     Alta de aliado + invitación
app/admin/aliados/[id]/page.tsx      Perfil, clientes asignados y métricas
app/admin/auditoria/page.tsx         (Opcional) últimas acciones administrativas
```

Componentes:

```text
components/admin/AdminSidebar.tsx
components/admin/AdminMobileNav.tsx
components/admin/KpiCard.tsx
components/admin/KpiGrid.tsx
components/admin/ActivityBars.tsx
components/admin/ClientForm.tsx
components/admin/AllyForm.tsx
components/admin/StatusBadge.tsx
components/admin/ConfirmAction.tsx
components/admin/Pagination.tsx
```

Reutilizar `components/ui/{Button,Card,Input,Table,ConfirmModal}` y los tokens de color actuales (`#20201F`, `#2A2A29`, `#3D3D3B`, `#7AB619`, `#F0F0EE`, `#9A9A96`).

### 7.2 Portal de aliados

```text
app/aliado/layout.tsx                Guard de aliado + shell
app/aliado/page.tsx                  Dashboard de cartera
app/aliado/clientes/page.tsx         Clientes asignados (solo lectura)
app/aliado/clientes/[id]/page.tsx    Métricas del cliente (sin PII de miembros)
app/aliado/perfil/page.tsx           Datos de contacto del aliado
```

### 7.3 Navegación

- Sidebar admin: Dashboard, Clientes, Aliados, Auditoría, Cerrar sesión.
- Sidebar aliado: Dashboard, Mis clientes, Mi perfil, Cerrar sesión.
- Mantener el sidebar actual de clientes sin cambios de estructura.
- En móvil, replicar el patrón de `MobileNav`.
- No mostrar links de admin a clientes ni aliados, y viceversa.

---

## 8. CRUD de clientes y aliados

### 8.1 Clientes (super admin)

**Listado**

- Búsqueda por nombre, slug o email del dueño.
- Filtros: estado (`active`/`suspended`), plan (`base`/`pro`), aliado, con/sin aliado.
- Columnas: negocio, dueño, plan, aliado, estado, miembros, última actividad, acciones.
- Paginación server-side de 25 registros. Usar `.range()` y `count: "exact"`.
- Export CSV opcional (reutilizar patrón de `members/export`).

**Crear**

Formulario:

- Nombre del negocio, slug (autogenerado con `slugify`, editable).
- Nombre y email del dueño.
- Plan (`base`/`pro`).
- Aliado (opcional).
- Modo de acceso: invitar por email o contraseña temporal.
- Notas internas (opcional).

Flujo servidor:

1. Guard `requireSuperAdmin`.
2. Validar con Zod.
3. Verificar slug único; si colisiona, devolver 409.
4. Crear usuario con `admin.auth.admin.inviteUserByEmail` o `admin.auth.admin.createUser`.
5. Insertar `businesses` con `owner_user_id`, plan, ally_id, status `active`.
6. Si falla el insert, borrar el usuario creado (rollback best-effort).
7. Auditoría `client.create`.
8. `revalidatePath("/admin/clientes")`.

**Editar**

- Campos: nombre, slug, plan, aliado, notas internas.
- No permitir cambiar `owner_user_id` en esta fase.
- Cambio de email del dueño: acción separada que use `admin.auth.admin.updateUserById`, con validación y auditoría.
- Reset de contraseña: acción "enviar recuperación" usando el flujo existente.

**Suspender / reactivar**

- `POST /api/admin/clients/[id]/status` con `{ status, reason? }`.
- Motivo obligatorio al suspender.
- Usar `ConfirmModal` (sin `window.confirm`).
- Auditoría con motivo.

**Eliminar**

- `DELETE /api/admin/clients/[id]` con `{ confirmSlug, deleteOwnerAccount }`.
- El modal exige escribir el slug exacto y advierte que la acción es irreversible.
- Recolectar y borrar archivos del bucket `logos` (logos, wallet logos, heroes, sellos y heroes de tarjetas) antes del delete de DB, reutilizando la lógica de `app/api/loyalty/programs/[id]/route.ts`.
- Llamar a la RPC `admin_delete_business(p_business_id)` para borrar en una transacción y auditar.
- Si `deleteOwnerAccount` y el dueño no tiene otros negocios, borrar el usuario de Auth con service role. Si falla, devolver éxito parcial con advertencia.
- `revalidatePath("/admin/clientes")`.

RPC sugerida:

```sql
create or replace function public.admin_delete_business(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biz public.businesses%rowtype;
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_biz from public.businesses where id = p_business_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'El cliente no existe.');
  end if;

  insert into public.admin_audit_log (actor_user_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'client.delete', 'business', v_biz.id,
    jsonb_build_object('name', v_biz.name, 'slug', v_biz.slug, 'owner_user_id', v_biz.owner_user_id));

  delete from public.businesses where id = v_biz.id;

  return jsonb_build_object('ok', true, 'owner_user_id', v_biz.owner_user_id);
end $$;
```

### 8.2 Aliados (super admin)

**Listado**

- Búsqueda por nombre, email o contacto.
- Filtros: estado, con/sin clientes.
- Columnas: aliado, contacto, comisión, clientes activos, estado, acciones.
- Mostrar comisión estimada del mes (calculada en servidor con `PLANS`).

**Crear**

Formulario:

- Nombre comercial, razón social, CUIT, contacto, email, teléfono.
- Porcentaje de comisión (0–100).
- Notas.
- Modo de acceso: invitar por email o contraseña temporal.

Flujo:

1. Crear usuario en Auth.
2. Insertar `allies` con `user_id`.
3. Insertar `user_roles(user_id, 'ally')`.
4. Si algo falla, compensar: borrar rol/fila/usuario creado.
5. Auditoría `ally.create`.
6. Enviar invitación con `redirectTo` a `/auth/continue`.

**Editar**

- Datos comerciales y de contacto.
- Comisión.
- Estado.
- No permitir cambiar `user_id` libremente; si se necesita reasignar cuenta, usar una acción explícita con auditoría.

**Suspender / reactivar**

- `status = 'suspended'` bloquea el portal del aliado, pero no cambia el estado de sus clientes.
- Si se suspende un aliado, sus clientes siguen operando normalmente.

**Eliminar**

- Bloquear si tiene clientes asignados; pedir reasignación previa.
- Si no tiene clientes: borrar `allies`, `user_roles` y opcionalmente la cuenta de Auth.
- Auditoría `ally.delete`.

### 8.3 Portal de aliados

- Dashboard: clientes asignados, activos, suspendidos, mix de planes, comisión estimada, pagos del mes y actividad agregada de 30 días.
- Listado de clientes: negocio, plan, estado, miembros, tarjetas activas y última actividad. Sin datos personales de consumidores.
- Detalle: métricas agregadas, estado de pagos del período, evolución de transacciones. Sin acciones de escritura.
- Perfil: editar teléfono y contacto; email y comisión solo lectura.
- Si el aliado está suspendido, el layout redirige a `/cuenta-suspendida`.

---

## 9. Dashboard de KPIs

### 9.1 KPIs principales (super admin)

| KPI | Fuente | Regla |
| --- | --- | --- |
| Clientes totales | `businesses` | `count(*)` |
| Clientes activos | `businesses` | `status = 'active'` |
| Clientes suspendidos | `businesses` | `status = 'suspended'` |
| Clientes nuevos (30 días) | `businesses` | `created_at >= now() - interval '30 days'` |
| Aliados activos | `allies` | `status = 'active'` |
| Clientes sin aliado | `businesses` | `ally_id is null` |
| MRR estimado | `businesses` + `PLANS` | suma del precio del plan de clientes activos |
| Cobrado del mes | `service_payments` | `period = actual and status = 'paid'` |
| Pendiente del mes | `service_payments` | `period = actual and status = 'pending'` |
| Tasa de cobro | `service_payments` | `cobrado / (cobrado + pendiente)` |
| Miembros totales | `loyalty_members` | `count(*)` |
| Tarjetas activas (30 días) | `loyalty_cards` | `last_earn_at >= now() - interval '30 days'` |
| Transacciones (30 días) | `loyalty_transactions` | `count(*)` agrupado por `type` |
| Programas activos | `loyalty_programs` | `status = 'active'` |

Rankings:

- Top 5 clientes por transacciones de los últimos 30 días.
- Top 5 clientes por miembros.
- Top 5 aliados por clientes activos y comisión estimada.
- Actividad diaria de 30 días para el gráfico de barras.

### 9.2 Dashboard de aliado

- Clientes asignados, activos y suspendidos.
- Mix de planes.
- Comisión estimada del mes.
- Cobrado y pendiente de sus clientes en el período.
- Actividad agregada de 30 días.
- Top 5 clientes de su cartera por actividad.

### 9.3 UI

- Grilla de KPI cards responsive (2 columnas en móvil, 4 en desktop).
- Gráfico de actividad con barras CSS; no agregar librería de charts.
- Selector de período para pagos (`YYYY-MM`), por defecto mes actual.
- Estados vacíos claros y enlaces de acción rápida: "Nuevo cliente", "Nuevo aliado".
- Mostrar fecha de actualización y botón de refresco.
- Respetar `force-dynamic` o revalidación explícita para evitar datos cacheados.

---

## 10. API y archivos

### 10.1 Endpoints

```text
GET    /api/admin/clients?q=&status=&plan=&ally=&page=
POST   /api/admin/clients
GET    /api/admin/clients/[id]
PATCH  /api/admin/clients/[id]
DELETE /api/admin/clients/[id]
POST   /api/admin/clients/[id]/status

GET    /api/admin/allies?q=&status=&page=
POST   /api/admin/allies
GET    /api/admin/allies/[id]
PATCH  /api/admin/allies/[id]
DELETE /api/admin/allies/[id]
POST   /api/admin/allies/[id]/status

GET    /api/admin/kpis?period=YYYY-MM
GET    /api/admin/audit?page=
GET    /api/ally/kpis
```

Convenciones:

- `requireSuperAdmin` / `requireAlly` al inicio de cada handler.
- Validación con Zod en `lib/admin/schemas.ts`.
- Respuestas de error consistentes: `{ error: string, details?: unknown }`.
- Códigos: 400 validación, 401 sin sesión, 403 sin permisos, 404 inexistente, 409 conflicto de slug/email.
- `assertSameOrigin` en mutaciones para mitigar CSRF, o usar Server Actions si se prefiere el chequeo nativo de origen.
- Auditoría después de cada mutación exitosa.
- `revalidatePath` de las rutas afectadas.

### 10.2 Librería

```text
lib/auth/roles.ts           Resolución de rol y guards
lib/admin/clients.ts        Consultas y operaciones de clientes
lib/admin/allies.ts         Consultas y operaciones de aliados
lib/admin/kpis.ts           Llamadas a RPC + cálculo de MRR/comisiones
lib/admin/audit.ts          Inserción de eventos
lib/admin/schemas.ts        Esquemas Zod
lib/admin/storage.ts        Limpieza de archivos del bucket
lib/admin/types.ts          Tipos de las nuevas entidades
```

Mantener el patrón existente de Route Handlers con `params: Promise<{ id: string }>` y `await params` (Next.js 16).

### 10.3 Migración de middleware

- Renombrar `middleware.ts` a `proxy.ts` y exportar `proxy` en lugar de `middleware`.
- Mantener el refresh de cookies de Supabase.
- No hacer autorización basada en rol en el proxy; la verificación segura va en layouts y handlers (los docs de Next recomiendan chequeos optimistas en proxy y chequeos reales en la capa de datos).
- Actualizar el `matcher` si es necesario.

---

## 11. Fases de implementación

### Fase 0 — Preparación (0.5 día)

- [ ] Backup de la base y del bucket `logos`.
- [ ] Crear rama de trabajo.
- [ ] Confirmar email del primer super admin y entorno de staging.
- [ ] Revisar los docs de Next.js 16 en `node_modules/next/dist/docs/` antes de tocar rutas/params.

### Fase 1 — Base de datos y seguridad (1.5 días)

- [ ] `013_platform_roles.sql`.
- [ ] `014_allies.sql`.
- [ ] `015_business_admin_fields.sql`.
- [ ] `016_admin_policies.sql`.
- [ ] `017_admin_audit.sql`.
- [ ] `018_admin_kpis.sql`.
- [ ] `019_suspension_enforcement.sql`.
- [ ] Bootstrap del primer super admin.
- [ ] Verificar RLS con consultas manuales (ver sección 12).

### Fase 2 — Roles, guards y suspensión (1 día)

- [ ] `lib/auth/roles.ts` y helpers de guards.
- [ ] `/auth/continue` y ajuste de login.
- [ ] Extender `requireBusiness` / `getMyBusiness` con estado.
- [ ] `assertBusinessActive` y aplicación en endpoints mutantes.
- [ ] Bloqueo de `/f`, `/n`, `/t` para negocios suspendidos.
- [ ] Banner de suspensión en panel.
- [ ] Migrar `middleware.ts` a `proxy.ts`.

### Fase 3 — Shell admin y dashboard (1.5 días)

- [ ] `app/admin/layout.tsx` con guard y navegación.
- [ ] Componentes de KPI, badges, paginación y barras.
- [ ] `admin_dashboard_kpis` + `lib/admin/kpis.ts`.
- [ ] `/admin` con KPIs, rankings y accesos rápidos.
- [ ] Responsive y estados vacíos.

### Fase 4 — CRUD de clientes y suspensión (2 días)

- [ ] Listado con búsqueda, filtros y paginación.
- [ ] Alta con creación de usuario, negocio y asignación de aliado.
- [ ] Edición de datos, plan y aliado.
- [ ] Suspender/reactivar con motivo y auditoría.
- [ ] Eliminación con confirmación por slug, limpieza de storage y borrado de Auth.
- [ ] Export CSV opcional.

### Fase 5 — Aliados y portal (2 días)

- [ ] Listado, alta, edición, suspensión y baja de aliados.
- [ ] Invitación/creación de cuenta y asignación de rol.
- [ ] Asignación/reasignación de clientes.
- [ ] Portal `/aliado` con KPIs de cartera.
- [ ] Listado y detalle de clientes en modo lectura.
- [ ] Perfil del aliado.

### Fase 6 — Hardening y cierre (1 día)

- [ ] `npm run lint`.
- [ ] `npm run build`.
- [ ] Pruebas manuales de la matriz de seguridad.
- [ ] Revisión de índices y consultas del dashboard.
- [ ] Actualizar README con migraciones, bootstrap y flujo de roles.
- [ ] Documentar rollback.

Estimación total: **8 a 10 días hábiles**, dependiendo de la creación de cuentas por invitación y de la urgencia del export CSV/auditoría visual.

---

## 12. Pruebas y validación

### 12.1 Matriz de autorización

| Caso | Resultado esperado |
| --- | --- |
| Anónimo visita `/admin` | Redirect a `/login` |
| Cliente visita `/admin` | Redirect a `/panel` |
| Aliado visita `/admin` | Redirect a `/aliado` |
| Aliado consulta `GET /api/admin/clients` | 403 |
| Aliado consulta un cliente no asignado por URL | 404/403, nunca datos |
| Cliente intenta `POST /api/admin/clients` | 403 |
| Usuario autenticado intenta insertarse en `user_roles` | Bloqueado por RLS |
| Super admin suspende un cliente | `status = suspended` + auditoría |
| Cliente suspendido intenta sellar | Error controlado |
| Cliente suspendido abre `/f/[slug]` | Página de cuenta suspendida |
| Cliente suspendido registra pago | Permitido |
| Super admin reactiva | Operaciones restauradas |
| Eliminar cliente sin escribir el slug | Bloqueado en UI y API |
| Eliminar aliado con clientes | Bloqueado con mensaje de reasignación |
| Aliado suspendido intenta entrar al portal | Redirect a `/cuenta-suspendida` |

### 12.2 Verificación SQL

- Confirmar que `is_super_admin()` devuelve `true` solo para el usuario bootstrap.
- Con `set role authenticated` y `request.jwt.claims` de un cliente, verificar que no puede leer negocios ajenos.
- Verificar que un aliado solo ve sus negocios asignados.
- Verificar que las nuevas tablas tienen RLS habilitado.
- Verificar que `admin_dashboard_kpis` falla para un usuario que no es super admin.
- Verificar que `loyalty_earn` rechaza un negocio suspendido.

### 12.3 Verificación funcional

- Crear cliente, iniciar sesión con la invitación y ver `/panel`.
- Asignar aliado y comprobar que aparece en su cartera.
- Suspender, comprobar bloqueos y reactivar.
- Eliminar un cliente de prueba y verificar:
  - Fila de `businesses` eliminada.
  - Programas, tarjetas, miembros, transacciones y pagos eliminados por cascada.
  - Archivos del bucket eliminados.
  - Usuario de Auth eliminado si correspondía.
  - Evento en `admin_audit_log`.
- Crear aliado, aceptar invitación, verificar acceso solo lectura.
- Comparar cada KPI del dashboard con una consulta SQL de control.
- Probar en móvil: sidebar, tablas con scroll y formularios.

### 12.4 Comandos

```bash
npm run lint
npm run build
```

Opcional si se aprueba agregar testing: Vitest para helpers puros (`slugify`, cálculo de comisiones, schemas Zod) y pruebas de integración de guards.

---

## 13. Checklist de seguridad

- [ ] `SUPABASE_SERVICE_ROLE_KEY` solo se usa en servidor.
- [ ] Ningún endpoint admin usa la sesión del cliente para operaciones cross-tenant sin guard.
- [ ] `user_roles` no permite autoasignación.
- [ ] RLS habilitado en `user_roles`, `allies` y `admin_audit_log`.
- [ ] Políticas de aliado son solo `select` y filtran por `is_ally_of`.
- [ ] El aliado no recibe PII de consumidores finales.
- [ ] Auditoría inmutable desde la app.
- [ ] Confirmación por slug para borrado definitivo.
- [ ] Validación Zod en todos los inputs.
- [ ] Chequeo de origen en mutaciones o uso de Server Actions.
- [ ] Mensajes de error sin filtrar detalles internos de DB.
- [ ] Slugs y emails con manejo de conflicto 409.
- [ ] Suspensión validada en DB y en servidor, no solo en UI.
- [ ] Páginas admin/aliado con `dynamic = "force-dynamic"` o revalidación explícita.

---

## 14. Rollout y rollback

### Rollout

1. Backup de DB y bucket.
2. Aplicar migraciones `013` a `019` en staging en orden.
3. Crear el super admin de staging y probar la matriz de autorización.
4. Desplegar la app en staging y ejecutar el flujo completo.
5. Aplicar migraciones en producción (son aditivas y compatibles: todo negocio existente queda activo).
6. Desplegar la app.
7. Crear el super admin real.
8. Smoke test: login por rol, dashboard, suspender/reactivar un cliente de prueba, alta de aliado.

Orden importante: **primero migraciones, después deploy**. El código nuevo espera columnas y funciones que no existen en el esquema anterior.

### Rollback

- Revertir el deploy a la versión anterior.
- Ejecutar `019_down`, `018_down`, ..., `013_down` en orden inverso si es necesario.
- El rollback de DB elimina roles, aliados, campos de estado y auditoría; los negocios y datos de fidelización existentes se conservan.
- Los clientes eliminados definitivamente no se recuperan con rollback: restaurar desde backup si fuera necesario.

---

## 15. Fuera de alcance / próximos pasos

- Liquidación y ledger de comisiones de aliados.
- Impersonación controlada de clientes por super admin.
- Roles granulares (`support`, `finance`, `read_only_admin`).
- 2FA para super admin.
- Branding white-label por aliado.
- Notificaciones automáticas de suspensión o vencimiento.
- Dashboard histórico con series temporales más allá de 30 días.
- App móvil nativa para aliados.

---

## 16. Estado de implementación

Implementado en el repo:

- Migraciones `013`–`019` + `*_down.sql` y seed de bootstrap.
- Guards de rol, login por rol (`/auth/continue`) y portal de aliados.
- Dashboard y CRUD de clientes/aliados en `/admin`, auditoría en `/admin/auditoria`.
- Portal de aliados en `/aliado` (dashboard, cartera, detalle y perfil).
- Enforcement de suspensión en panel, páginas públicas, server actions y APIs.
- `npm run build` pasa. ESLint pasa en los archivos nuevos; el repo mantiene
  errores preexistentes de `react-hooks/set-state-in-effect` en componentes viejos.

Pendiente para cerrar el rollout:

- Aplicar `013`–`019` en Supabase (staging primero) y ejecutar el seed.
- Smoke test por rol: super admin, aliado, cliente activo y cliente suspendido.
- Ajustar el email de soporte/contacto en `/cuenta-suspendida` si corresponde.
