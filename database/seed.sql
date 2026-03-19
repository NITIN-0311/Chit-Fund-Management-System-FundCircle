-- Optional seed data for quick local testing.
-- Run this after schema.sql.

INSERT INTO members (full_name, phone, email, address)
VALUES
  ('Aarav Kumar', '9990001111', 'aarav@example.com', 'Chennai'),
  ('Diya Sharma', '9990002222', 'diya@example.com', 'Bengaluru')
ON CONFLICT (email) DO NOTHING;

INSERT INTO chit_groups (name, monthly_amount, duration_months, start_date, status)
VALUES
  ('Gold Saver Group', 5000, 20, CURRENT_DATE - INTERVAL '2 months', 'ACTIVE')
ON CONFLICT DO NOTHING;

INSERT INTO group_members (group_id, member_id)
SELECT g.id, m.id
FROM chit_groups g
JOIN members m ON m.email IN ('aarav@example.com', 'diya@example.com')
WHERE g.name = 'Gold Saver Group'
ON CONFLICT (group_id, member_id) DO NOTHING;
