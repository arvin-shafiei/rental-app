-- Migration to enhance agreement checklist items with notification functionality
-- and create/delete timeline events when users are assigned/unassigned to tasks

-- 1. First, drop the old trigger that creates events for all property users
DROP TRIGGER IF EXISTS after_agreement_created ON agreements;
DROP FUNCTION IF EXISTS create_agreement_events();

-- 2. Add a function to manage timeline events for checklist items
CREATE OR REPLACE FUNCTION manage_agreement_checklist_events()
RETURNS TRIGGER AS $$
DECLARE
  old_items JSONB;
  new_items JSONB;
  old_item JSONB;
  new_item JSONB;
  item_index INTEGER;
  property_name TEXT;
  event_id UUID;
  event_date TIMESTAMP WITH TIME ZONE;
  notification_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get property name for the event title
  SELECT name INTO property_name 
  FROM properties 
  WHERE id = NEW.property_id;

  -- If property has no name, use address instead
  IF property_name IS NULL THEN
    SELECT address INTO property_name 
    FROM properties 
    WHERE id = NEW.property_id;
  END IF;

  -- Get old and new checklist items
  old_items := COALESCE(OLD.check_items, '[]'::JSONB);
  new_items := COALESCE(NEW.check_items, '[]'::JSONB);
  
  -- Process each item in the new check_items array
  FOR item_index IN 0..jsonb_array_length(new_items) - 1 LOOP
    new_item := new_items -> item_index;
    
    -- Skip if no assignment
    IF new_item -> 'assigned_to' IS NULL OR (new_item -> 'assigned_to')::TEXT = 'null' THEN
      CONTINUE;
    END IF;
    
    -- Find the corresponding old item if it exists
    old_item := NULL;
    IF TG_OP = 'UPDATE' AND item_index < jsonb_array_length(old_items) THEN
      old_item := old_items -> item_index;
    END IF;
    
    -- User assignment has changed or is new
    IF old_item IS NULL OR 
       (old_item -> 'assigned_to') IS NULL OR 
       (old_item -> 'assigned_to')::TEXT = 'null' OR
       (old_item -> 'assigned_to')::TEXT != (new_item -> 'assigned_to')::TEXT THEN
      
      -- Use the agreement's due_date for the event date
      IF NEW.due_date IS NOT NULL THEN
        event_date := NEW.due_date;
      ELSE
        event_date := NOW(); -- Default to today if no due date specified
      END IF;
      
      -- Calculate notification date based on notification_days_before if specified
      IF (new_item -> 'notification_days_before') IS NOT NULL AND 
         (new_item -> 'notification_days_before')::TEXT != 'null' AND
         NEW.due_date IS NOT NULL THEN
        notification_date := NEW.due_date - ((new_item ->> 'notification_days_before')::INTEGER * INTERVAL '1 day');
      ELSE
        notification_date := NULL;
      END IF;
      
      -- Create a timeline event for the assigned user
      INSERT INTO timeline_events (
        property_id,
        user_id,
        title,
        description,
        event_type,
        start_date,
        is_all_day,
        is_completed,
        metadata
      ) VALUES (
        NEW.property_id,
        (new_item ->> 'assigned_to')::UUID,
        'Task: ' || (new_item ->> 'text'),
        'Agreement task from: ' || NEW.title || ' at ' || COALESCE(property_name, 'property'),
        'agreement_task',
        event_date,
        TRUE,
        COALESCE((new_item ->> 'checked')::BOOLEAN, FALSE),
        jsonb_build_object(
          'agreement_id', NEW.id,
          'item_index', item_index,
          'notification_date', notification_date
        )
      ) RETURNING id INTO event_id;
      
      -- Store event_id in the check_item for future reference
      new_items := jsonb_set(
        new_items,
        ARRAY[item_index::TEXT],
        jsonb_set(new_item, '{event_id}', to_jsonb(event_id::TEXT))
      );
    
    -- Completion status has changed
    ELSIF (old_item -> 'checked')::TEXT != (new_item -> 'checked')::TEXT THEN
      -- Update the corresponding timeline event's completion status
      IF new_item -> 'event_id' IS NOT NULL THEN
        UPDATE timeline_events
        SET is_completed = (new_item ->> 'checked')::BOOLEAN,
            updated_at = NOW()
        WHERE id = (new_item ->> 'event_id')::UUID;
      END IF;
    END IF;
  END LOOP;
  
  -- Handle unassignments - look for items that were assigned but are now unassigned
  IF TG_OP = 'UPDATE' THEN
    FOR item_index IN 0..jsonb_array_length(old_items) - 1 LOOP
      old_item := old_items -> item_index;
      
      -- Skip if there was no assignment or no event_id
      IF old_item -> 'assigned_to' IS NULL OR 
         (old_item -> 'assigned_to')::TEXT = 'null' OR
         old_item -> 'event_id' IS NULL THEN
        CONTINUE;
      END IF;
      
      -- Check if the item still exists in new_items with the same assignment
      IF item_index >= jsonb_array_length(new_items) OR
         (new_items -> item_index -> 'assigned_to') IS NULL OR
         (new_items -> item_index -> 'assigned_to')::TEXT = 'null' OR
         (old_item -> 'assigned_to')::TEXT != (new_items -> item_index -> 'assigned_to')::TEXT THEN
        
        -- Delete the timeline event
        DELETE FROM timeline_events
        WHERE id = (old_item ->> 'event_id')::UUID;
      END IF;
    END LOOP;
  END IF;
  
  -- Update the check_items with the new event IDs
  NEW.check_items := new_items;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create triggers for insert and update operations
CREATE TRIGGER before_agreement_insert
BEFORE INSERT ON agreements
FOR EACH ROW
EXECUTE FUNCTION manage_agreement_checklist_events();

CREATE TRIGGER before_agreement_update
BEFORE UPDATE ON agreements
FOR EACH ROW
EXECUTE FUNCTION manage_agreement_checklist_events();

-- 4. Add comment to make the structure of check_items clearer
COMMENT ON COLUMN agreements.check_items IS 'JSON array of check items with structure: 
[{
  text: string, 
  checked: boolean,
  assigned_to: UUID or null,
  notification_days_before: integer or null,
  completed_by: UUID or null,
  completed_at: timestamp or null,
  event_id: UUID or null
}]'; 