/*
  # Update sensor names

  1. Changes
    - Update existing sensors with proper names
    - Ensure names are descriptive and meaningful
*/

UPDATE sensors
SET name = CASE id
  WHEN '240075' THEN 'Kigali Central Monitor'
  WHEN '240049' THEN 'Nyarugenge District Station'
  WHEN '239257' THEN 'Gasabo Air Quality Hub'
  WHEN '239297' THEN 'Kicukiro Environmental Station'
  WHEN '239307' THEN 'Muhanga District Monitor'
  WHEN '239267' THEN 'Huye Air Quality Station'
  WHEN '240595' THEN 'Musanze Environmental Hub'
  WHEN '239259' THEN 'Rubavu Coastal Monitor'
  WHEN '240067' THEN 'Rusizi District Station'
  WHEN '222835' THEN 'Nyagatare Air Quality Hub'
  WHEN '222887' THEN 'Rwamagana Environmental Station'
  WHEN '222861' THEN 'Karongi District Monitor'
  WHEN '240091' THEN 'Bugesera Air Quality Station'
  WHEN '240097' THEN 'Nyanza Environmental Hub'
  WHEN '240593' THEN 'Gicumbi District Monitor'
END
WHERE id IN (
  '240075', '240049', '239257', '239297', '239307', '239267',
  '240595', '239259', '240067', '222835', '222887', '222861',
  '240091', '240097', '240593'
);