-- reset-e2e-fixtures.sql
-- Reset the EMPLOYEE (Jordan Davis) test fixture to a clean, deterministic state
-- so the automated E2E repair-ticket + notification flows are always runnable:
--   * every assigned asset is ACTIVE and has NO open ticket (so a fresh ticket can
--     always be created, and the one-open-per-asset rule then blocks the duplicate),
--   * a read+unread mix of repair-related notifications exists for the read/clear flows,
--   * completed demo repairs keep their resolution text (so Repair History shows it).
--
-- Safe to run repeatedly (idempotent). Run BEFORE the E2E suite.
-- Apply with the Supabase MCP execute_sql / psql, or: npx supabase db execute ...
--
-- IDs (RepairDesk project puaobtjdcnlxixplpqjx):
--   org RepairDesk HQ = 075e1bd4-2b7a-4f81-a60f-8a73155eb952
--   Jordan Davis (EMPLOYEE) = 2fcf0e4a-d2aa-47ad-9a77-27babcb162e9
--   LAP-018 = 65442cdf-e414-46b4-af42-864bb5b0a5a9 | MOB-011 = 51e00047-afd2-4a38-95d6-88f192efdf1a

BEGIN;

-- 1) Clean spare, active, assigned assets (headroom for repeated create/duplicate runs).
INSERT INTO public.assets (organization_id, asset_tag, name, category, status, serial_number, location, description, assigned_to)
VALUES
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','LAP-050','Spare Laptop A','Laptop','ACTIVE','SN-LAP-050','IT Storage','Clean spare for E2E ticket-creation flows.', '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9'),
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','LAP-051','Spare Laptop B','Laptop','ACTIVE','SN-LAP-051','IT Storage','Clean spare for E2E ticket-creation flows.', '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9'),
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','LAP-052','Spare Laptop C','Laptop','ACTIVE','SN-LAP-052','IT Storage','Clean spare for E2E ticket-creation flows.', '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9'),
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','LAP-053','Spare Laptop D','Laptop','ACTIVE','SN-LAP-053','IT Storage','Clean spare for E2E ticket-creation flows.', '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9')
ON CONFLICT (organization_id, asset_tag) DO NOTHING;

-- 2) Remove accumulated QA repairs for the employee, keeping the two legit demo
--    completed tickets (they carry resolution text). Cascades their history/notes/notifications.
DELETE FROM public.repairs
WHERE reported_by = '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9'
  AND ticket_number NOT IN ('RD-1001','RD-1004');

-- 3) Ensure the kept demo completed repairs have a resolution (Repair History display).
UPDATE public.repairs
   SET resolution = COALESCE(NULLIF(btrim(resolution), ''), 'Resolved — repair completed and verified.')
 WHERE reported_by = '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9'
   AND status IN ('RESOLVED','CLOSED');

-- 4) Re-seed a read+unread mix of repair-related notifications (delete first for idempotency).
DELETE FROM public.notifications WHERE user_id = '2fcf0e4a-d2aa-47ad-9a77-27babcb162e9';
INSERT INTO public.notifications (organization_id, user_id, type, title, message, related_repair_id, related_asset_id, is_read, created_at)
VALUES
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','2fcf0e4a-d2aa-47ad-9a77-27babcb162e9','REPAIR_STATUS','Update on your LAP-018 repair','Your LAP-018 repair was updated: diagnostics complete, awaiting parts.',(SELECT id FROM repairs WHERE ticket_number='RD-1001'),'65442cdf-e414-46b4-af42-864bb5b0a5a9',false, now() - interval '5 minutes'),
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','2fcf0e4a-d2aa-47ad-9a77-27babcb162e9','REPAIR_ASSIGNMENT','Technician assigned to your LAP-018 repair','A bench technician was assigned to your LAP-018 repair request.',(SELECT id FROM repairs WHERE ticket_number='RD-1001'),'65442cdf-e414-46b4-af42-864bb5b0a5a9',false, now() - interval '20 minutes'),
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','2fcf0e4a-d2aa-47ad-9a77-27babcb162e9','CRITICAL_REPAIR','LAP-018 flagged as a repeated failure','Asset LAP-018 has a history of repairs and has been flagged for attention.',(SELECT id FROM repairs WHERE ticket_number='RD-1001'),'65442cdf-e414-46b4-af42-864bb5b0a5a9',false, now() - interval '1 hour'),
  ('075e1bd4-2b7a-4f81-a60f-8a73155eb952','2fcf0e4a-d2aa-47ad-9a77-27babcb162e9','REPAIR_RESOLVED','Repair for MOB-011 resolved','Your MOB-011 repair has been resolved and is ready for pickup.',(SELECT id FROM repairs WHERE ticket_number='RD-1004'),'51e00047-afd2-4a38-95d6-88f192efdf1a',true, now() - interval '1 day');

COMMIT;
