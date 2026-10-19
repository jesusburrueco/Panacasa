-- El cliente puede cancelar sus propios pedidos extra mientras esten
-- pendientes (solo el paso pending -> cancelled; el resto, el admin).
drop policy if exists "Users can cancel their own pending extra orders" on public.extra_orders;

create policy "Users can cancel their own pending extra orders"
  on public.extra_orders for update
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'cancelled');
