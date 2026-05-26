CREATE OR REPLACE FUNCTION update_questions_correct_answers(updates json)
RETURNS void AS $$
DECLARE
  update_record json;
BEGIN
  -- Loop through each object in the JSON array
  FOR update_record IN SELECT * FROM json_array_elements(updates)
  LOOP
    -- Update the questions table
    -- The JSON must have 'id' (uuid) and 'correct_answer' (text)
    UPDATE questions
    SET correct_answer = (update_record->>'correct_answer')
    WHERE id = (update_record->>'id')::uuid;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
