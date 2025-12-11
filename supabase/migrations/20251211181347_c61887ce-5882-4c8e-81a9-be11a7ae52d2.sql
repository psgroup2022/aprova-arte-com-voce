-- Adicionar usuário como admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('af4dfd86-7be9-4ca8-b0f7-e1c35808bebe', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;