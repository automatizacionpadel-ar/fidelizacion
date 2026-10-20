-- Bootstrap del primer super admin.
-- 1) Reemplazar el email por el de la cuenta real (debe existir en auth.users).
-- 2) Ejecutar en Supabase Dashboard > SQL Editor (rol postgres).
--
-- La política RLS de user_roles no permite autoasignarse roles desde la app:
-- este insert debe correrse manualmente o con service role.

insert into public.user_roles (user_id, role)
select id, 'super_admin'
from auth.users
where email = 'admin@tudominio.com'
on conflict do nothing;

-- Verificación:
-- select u.email, r.role
-- from public.user_roles r
-- join auth.users u on u.id = r.user_id;
