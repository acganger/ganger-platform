-- ==========================================
-- LUNCH AVAILABILITY CONFIGURATION SYSTEM
-- Google Calendar Integration for 3-Office Lunch Scheduling
-- ==========================================

-- Lunch availability configuration table
CREATE TABLE IF NOT EXISTS lunch_availability_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_name TEXT NOT NULL, -- 'Ann Arbor', 'Wixom', 'Plymouth'
  google_calendar_id TEXT NOT NULL,
  
  -- Weekly availability settings
  available_days INTEGER[] NOT NULL, -- [1,2,3,4,5] for Mon-Fri
  start_time TIME NOT NULL, -- e.g., '12:00:00'
  end_time TIME NOT NULL, -- e.g., '12:45:00'
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  
  -- Booking window settings
  booking_window_weeks INTEGER NOT NULL DEFAULT 12, -- How far in advance
  min_advance_hours INTEGER DEFAULT 24, -- Minimum booking notice
  
  -- Location details
  location_address TEXT NOT NULL,
  special_instructions TEXT,
  max_attendees INTEGER DEFAULT 15,
  
  -- Status and tracking
  is_active BOOLEAN DEFAULT TRUE,
  last_updated_by UUID, -- References users table when available
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(location_name)
);

-- Enable RLS for security
ALTER TABLE lunch_availability_config ENABLE ROW LEVEL SECURITY;

-- Policies for lunch_availability_config
CREATE POLICY "Public read access for active lunch configs" ON lunch_availability_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write access for lunch configs" ON lunch_availability_config
  FOR ALL USING (
    auth.jwt() ->> 'email' IN (
      'admin@gangerdermatology.com',
      'manager@gangerdermatology.com',
      'anand@gangerdermatology.com'
    )
  );

-- Insert default configurations for the 3 locations
INSERT INTO lunch_availability_config 
(location_name, google_calendar_id, available_days, start_time, end_time, duration_minutes, booking_window_weeks, location_address)
VALUES 
(
  'Ann Arbor', 
  'gangerdermatology.com_b4jajesjfje9qfko0gn3kp9jtk@group.calendar.google.com', 
  '{1,2,3,4,5}', 
  '12:00:00', 
  '12:45:00', 
  45, 
  12, 
  '1979 Huron Pkwy, Ann Arbor, MI 48105'
),
(
  'Wixom', 
  'gangerdermatology.com_fsdmtevbhp32gmletbpb000q20@group.calendar.google.com', 
  '{1,2,3,4,5}', 
  '12:00:00', 
  '12:45:00', 
  45, 
  12, 
  '29877 Telegraph Rd, Southfield, MI 48034'
),
(
  'Plymouth', 
  'gangerdermatology.com_3cc4gomltg8f4kh9mc2o10gi6o@group.calendar.google.com', 
  '{1,2,3,4,5}', 
  '12:00:00', 
  '12:45:00', 
  45, 
  12, 
  '990 W Ann Arbor Trail, Plymouth, MI 48170'
);

-- Create indexes for performance
CREATE INDEX idx_lunch_config_location ON lunch_availability_config(location_name) WHERE is_active = true;
CREATE INDEX idx_lunch_config_active ON lunch_availability_config(is_active);

-- Function to get active lunch configurations
CREATE OR REPLACE FUNCTION get_active_lunch_locations()
RETURNS TABLE (
  location_name TEXT,
  location_address TEXT,
  duration_minutes INTEGER,
  booking_window_weeks INTEGER,
  available_days INTEGER[],
  start_time TIME,
  end_time TIME
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lac.location_name,
    lac.location_address,
    lac.duration_minutes,
    lac.booking_window_weeks,
    lac.available_days,
    lac.start_time,
    lac.end_time
  FROM lunch_availability_config lac
  WHERE lac.is_active = true
  ORDER BY lac.location_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lunch configuration by location
CREATE OR REPLACE FUNCTION get_lunch_config_by_location(p_location_name TEXT)
RETURNS TABLE (
  id UUID,
  location_name TEXT,
  google_calendar_id TEXT,
  available_days INTEGER[],
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  booking_window_weeks INTEGER,
  min_advance_hours INTEGER,
  location_address TEXT,
  special_instructions TEXT,
  max_attendees INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lac.id,
    lac.location_name,
    lac.google_calendar_id,
    lac.available_days,
    lac.start_time,
    lac.end_time,
    lac.duration_minutes,
    lac.booking_window_weeks,
    lac.min_advance_hours,
    lac.location_address,
    lac.special_instructions,
    lac.max_attendees,
    lac.is_active
  FROM lunch_availability_config lac
  WHERE lac.location_name = p_location_name
    AND lac.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lunch configuration
CREATE OR REPLACE FUNCTION update_lunch_config(
  p_location_name TEXT,
  p_available_days INTEGER[] DEFAULT NULL,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_booking_window_weeks INTEGER DEFAULT NULL,
  p_min_advance_hours INTEGER DEFAULT NULL,
  p_location_address TEXT DEFAULT NULL,
  p_special_instructions TEXT DEFAULT NULL,
  p_max_attendees INTEGER DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL,
  p_updated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE lunch_availability_config
  SET 
    available_days = COALESCE(p_available_days, available_days),
    start_time = COALESCE(p_start_time, start_time),
    end_time = COALESCE(p_end_time, end_time),
    duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
    booking_window_weeks = COALESCE(p_booking_window_weeks, booking_window_weeks),
    min_advance_hours = COALESCE(p_min_advance_hours, min_advance_hours),
    location_address = COALESCE(p_location_address, location_address),
    special_instructions = COALESCE(p_special_instructions, special_instructions),
    max_attendees = COALESCE(p_max_attendees, max_attendees),
    is_active = COALESCE(p_is_active, is_active),
    last_updated_by = COALESCE(p_updated_by, last_updated_by),
    updated_at = NOW()
  WHERE location_name = p_location_name;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate lunch booking time slot
CREATE OR REPLACE FUNCTION validate_lunch_time_slot(
  p_location_name TEXT,
  p_appointment_date DATE,
  p_start_time TIME
)
RETURNS TABLE (
  is_valid BOOLEAN,
  error_message TEXT,
  day_of_week INTEGER,
  is_available_day BOOLEAN,
  within_time_window BOOLEAN,
  meets_advance_notice BOOLEAN
) AS $$
DECLARE
  config_record RECORD;
  slot_day_of_week INTEGER;
  appointment_datetime TIMESTAMPTZ;
  hours_until_appointment NUMERIC;
BEGIN
  -- Get configuration
  SELECT * INTO config_record
  FROM lunch_availability_config
  WHERE location_name = p_location_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Location not found or inactive'::TEXT, 0, false, false, false;
    RETURN;
  END IF;
  
  -- Calculate day of week (1=Monday, 7=Sunday)
  slot_day_of_week := EXTRACT(ISODOW FROM p_appointment_date);
  
  -- Check if day is available
  IF NOT (slot_day_of_week = ANY(config_record.available_days)) THEN
    RETURN QUERY SELECT false, 'Location not available on this day'::TEXT, slot_day_of_week, false, false, false;
    RETURN;
  END IF;
  
  -- Check if time is within available window
  IF p_start_time < config_record.start_time OR p_start_time > config_record.end_time THEN
    RETURN QUERY SELECT false, 'Time outside available hours'::TEXT, slot_day_of_week, true, false, false;
    RETURN;
  END IF;
  
  -- Check advance notice requirement
  appointment_datetime := (p_appointment_date + p_start_time)::TIMESTAMPTZ;
  hours_until_appointment := EXTRACT(EPOCH FROM (appointment_datetime - NOW())) / 3600;
  
  IF hours_until_appointment < config_record.min_advance_hours THEN
    RETURN QUERY SELECT false, 'Insufficient advance notice'::TEXT, slot_day_of_week, true, true, false;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, ''::TEXT, slot_day_of_week, true, true, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updated_at timestamp
CREATE OR REPLACE FUNCTION update_lunch_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lunch_config_updated_at_trigger
  BEFORE UPDATE ON lunch_availability_config
  FOR EACH ROW
  EXECUTE FUNCTION update_lunch_config_updated_at();

-- Grant permissions for authenticated users to read public functions
GRANT EXECUTE ON FUNCTION get_active_lunch_locations() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_lunch_config_by_location(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_lunch_time_slot(TEXT, DATE, TIME) TO authenticated, anon;

-- Grant admin functions only to authenticated users
GRANT EXECUTE ON FUNCTION update_lunch_config(TEXT, INTEGER[], TIME, TIME, INTEGER, INTEGER, INTEGER, TEXT, TEXT, INTEGER, BOOLEAN, UUID) TO authenticated;

-- Create comment for documentation
COMMENT ON TABLE lunch_availability_config IS 'Configuration table for pharmaceutical rep lunch scheduling across 3 office locations with Google Calendar integration';
COMMENT ON FUNCTION get_active_lunch_locations() IS 'Returns all active lunch locations with basic configuration for public booking interface';
COMMENT ON FUNCTION get_lunch_config_by_location(TEXT) IS 'Returns complete configuration for a specific location including Google Calendar ID';
COMMENT ON FUNCTION validate_lunch_time_slot(TEXT, DATE, TIME) IS 'Validates if a requested time slot is valid according to location configuration and business rules';
COMMENT ON FUNCTION update_lunch_config(TEXT, INTEGER[], TIME, TIME, INTEGER, INTEGER, INTEGER, TEXT, TEXT, INTEGER, BOOLEAN, UUID) IS 'Admin function to update lunch availability configuration for a location';