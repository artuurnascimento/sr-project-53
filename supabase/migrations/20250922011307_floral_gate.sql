/*
  # Create time entries table

  1. New Tables
    - `time_entries`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key to profiles)
      - `punch_type` (text, IN/OUT/BREAK_IN/BREAK_OUT)
      - `punch_time` (timestamptz)
      - `location_lat` (numeric, optional)
      - `location_lng` (numeric, optional)
      - `location_address` (text, optional)
      - `status` (text, approved/pending/rejected)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `time_entries` table
    - Add policies for employees to manage their own entries
    - Add policies for managers to view all entries
*/

CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  punch_type text NOT NULL CHECK (punch_type IN ('IN', 'OUT', 'BREAK_IN', 'BREAK_OUT')),
  punch_time timestamptz NOT NULL DEFAULT now(),
  location_lat numeric(10, 8),
  location_lng numeric(11, 8),
  location_address text,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Employees can create and view their own time entries
CREATE POLICY "Employees can manage their own time entries"
  ON time_entries
  FOR ALL
  TO public
  USING (employee_id = get_current_user_profile_id())
  WITH CHECK (employee_id = get_current_user_profile_id());

-- Managers and admins can view all time entries
CREATE POLICY "Managers can view all time entries"
  ON time_entries
  FOR SELECT
  TO public
  USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

-- Managers and admins can update time entry status
CREATE POLICY "Managers can update time entries"
  ON time_entries
  FOR UPDATE
  TO public
  USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'manager'::text]));

-- Create trigger for updated_at
CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX IF NOT EXISTS time_entries_employee_id_idx ON time_entries(employee_id);
CREATE INDEX IF NOT EXISTS time_entries_punch_time_idx ON time_entries(punch_time);
CREATE INDEX IF NOT EXISTS time_entries_status_idx ON time_entries(status);