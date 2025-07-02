-- Drop existing tables if they exist (to allow for clean migration)
DROP TABLE IF EXISTS public.ticket_comments CASCADE;
DROP TABLE IF EXISTS public.ticket_file_uploads CASCADE;
DROP TABLE IF EXISTS public.ticket_approvals CASCADE;
DROP TABLE IF EXISTS public.ticket_notifications CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.job_queue CASCADE;

-- Create updated tickets table with improved schema
CREATE TABLE public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  
  -- Form metadata
  form_type TEXT NOT NULL CHECK (form_type IN (
    'support_ticket',
    'time_off_request',
    'punch_fix',
    'change_of_availability',
    'expense_reimbursement',
    'meeting_request',
    'impact_filter'
  )),
  
  -- Submitter information
  submitter_email TEXT NOT NULL,
  submitter_name TEXT NOT NULL,
  submitter_id UUID REFERENCES auth.users(id),
  
  -- Ticket status and workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pending_approval',
    'open',
    'in_progress',
    'stalled',
    'approved',
    'denied',
    'completed',
    'cancelled'
  )),
  
  -- Priority and categorization
  priority TEXT CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  location TEXT,
  category TEXT,
  
  -- Assignment and ownership
  assigned_to_email TEXT,
  assigned_to_id UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Ticket content
  title TEXT NOT NULL,
  description TEXT,
  form_data JSONB NOT NULL DEFAULT '{}',
  
  -- Workflow timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  action_taken_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by_email TEXT,
  completed_by_id UUID REFERENCES auth.users(id),
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by_email TEXT,
  approved_by_id UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,
  
  -- Search and indexing
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(submitter_name, '')), 'C')
  ) STORED
);

-- Create indexes for performance
CREATE INDEX idx_tickets_form_type ON tickets(form_type);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_submitter_email ON tickets(submitter_email);
CREATE INDEX idx_tickets_assigned_to_email ON tickets(assigned_to_email);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_search ON tickets USING GIN(search_vector);
CREATE INDEX idx_tickets_location ON tickets(location) WHERE location IS NOT NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority) WHERE priority IS NOT NULL;

-- Create ticket comments table
CREATE TABLE public.ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  author_email TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Track edits
  edited_at TIMESTAMPTZ,
  edited_by_email TEXT,
  edit_count INTEGER DEFAULT 0
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at DESC);

-- Create file uploads table
CREATE TABLE public.ticket_file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE,
  
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  
  uploaded_by_email TEXT NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  uploaded_by_id UUID REFERENCES auth.users(id),
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_file_uploads_ticket_id ON ticket_file_uploads(ticket_id);
CREATE INDEX idx_file_uploads_status ON ticket_file_uploads(status);

-- Create approvals table for approval workflow
CREATE TABLE public.ticket_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  approver_email TEXT NOT NULL,
  approver_name TEXT NOT NULL,
  approver_id UUID REFERENCES auth.users(id),
  
  action TEXT NOT NULL CHECK (action IN ('approved', 'denied', 'requested_info')),
  comments TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_approvals_ticket_id ON ticket_approvals(ticket_id);
CREATE INDEX idx_ticket_approvals_created_at ON ticket_approvals(created_at DESC);

-- Create notifications table
CREATE TABLE public.ticket_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id),
  
  type TEXT NOT NULL CHECK (type IN (
    'new_ticket',
    'ticket_assigned',
    'ticket_updated',
    'ticket_commented',
    'ticket_approved',
    'ticket_denied',
    'ticket_completed'
  )),
  
  payload JSONB NOT NULL DEFAULT '{}',
  
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_ticket_id ON ticket_notifications(ticket_id);
CREATE INDEX idx_notifications_recipient_email ON ticket_notifications(recipient_email);
CREATE INDEX idx_notifications_read_at ON ticket_notifications(read_at) WHERE read_at IS NULL;

-- Create job queue table for background processing
CREATE TABLE public.job_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  handler TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled'
  )),
  
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_scheduled ON job_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_job_queue_priority ON job_queue(priority DESC, created_at ASC) WHERE status = 'pending';

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_number INTEGER;
  new_ticket_number TEXT;
BEGIN
  -- Get current year
  year_part := TO_CHAR(NOW(), 'YY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 3) AS INTEGER)), 0) + 1
  INTO sequence_number
  FROM tickets
  WHERE ticket_number LIKE year_part || '%';
  
  -- Format: YY-NNNNNN (e.g., 25-000001)
  new_ticket_number := year_part || '-' || LPAD(sequence_number::TEXT, 6, '0');
  
  RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tickets
-- Users can see their own tickets
CREATE POLICY "Users can view own tickets" ON tickets
  FOR SELECT USING (auth.uid() = submitter_id OR auth.email() = submitter_email);

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = submitter_id OR auth.email() = submitter_email);

-- Users can update their own pending tickets
CREATE POLICY "Users can update own pending tickets" ON tickets
  FOR UPDATE USING (
    (auth.uid() = submitter_id OR auth.email() = submitter_email) 
    AND status IN ('pending', 'open')
  );

-- Assigned users can view and update tickets
CREATE POLICY "Assigned users can view tickets" ON tickets
  FOR SELECT USING (auth.uid() = assigned_to_id OR auth.email() = assigned_to_email);

CREATE POLICY "Assigned users can update tickets" ON tickets
  FOR UPDATE USING (auth.uid() = assigned_to_id OR auth.email() = assigned_to_email);

-- Create RLS policies for comments
-- Users can view comments on tickets they can see
CREATE POLICY "Users can view comments" ON ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

-- Users can create comments on tickets they can see
CREATE POLICY "Users can create comments" ON ticket_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_comments.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view file uploads" ON ticket_file_uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_file_uploads.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

CREATE POLICY "Users can upload files" ON ticket_file_uploads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_file_uploads.ticket_id
      AND (tickets.submitter_id = auth.uid() OR tickets.submitter_email = auth.email()
           OR tickets.assigned_to_id = auth.uid() OR tickets.assigned_to_email = auth.email())
    )
  );

-- Create views for common queries
CREATE OR REPLACE VIEW ticket_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'open') AS open_tickets,
  COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
  COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > NOW() - INTERVAL '30 days') AS completed_last_30_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS created_last_7_days,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600)::INTEGER AS avg_resolution_hours
FROM tickets;

-- Create view for user ticket summary
CREATE OR REPLACE VIEW user_ticket_summary AS
SELECT
  submitter_email,
  submitter_name,
  COUNT(*) AS total_tickets,
  COUNT(*) FILTER (WHERE status = 'open') AS open_tickets,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_tickets,
  COUNT(*) FILTER (WHERE priority = 'urgent') AS urgent_tickets,
  MAX(created_at) AS last_ticket_date
FROM tickets
GROUP BY submitter_email, submitter_name;

-- Add helpful comments
COMMENT ON TABLE tickets IS 'Main tickets table for all form submissions in ganger-actions';
COMMENT ON COLUMN tickets.form_data IS 'JSONB storage for form-specific fields that vary by form_type';
COMMENT ON COLUMN tickets.search_vector IS 'Full-text search index for ticket title, description, and submitter name';
COMMENT ON TABLE job_queue IS 'Background job processing queue for notifications and other async tasks';