const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST /api/scheduler/daily - Trigger daily birthday/anniversary sweep
router.post('/daily', async (req, res) => {
  // In a real app, this endpoint would be protected (admin/service role only)
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1; // JS months are 0-indexed

    // Find people with birthdays or anniversaries today who have given consent
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, first_name, dob, anniversary_date')
      .eq('consent_email', true)
      .or(`dob.like.%-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')},anniversary_date.like.%-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

    if (peopleError) throw peopleError;

    if (people.length === 0) {
      return res.json({ success: true, message: 'No birthdays or anniversaries scheduled for today.' });
    }

    // This is a simulation. We're not actually finding a template.
    // In a real app, you'd have logic to pick an appropriate template.
    const defaultTemplateId = 'a934a81c-1e9c-42b2-8b25-2f7af95ae493'; // Warm Professional Greeting

    const sendsToCreate = people.map(person => ({
      person_id: person.id,
      template_id: defaultTemplateId,
      status: 'queued',
      channel: 'gmail',
      scheduled_for: today.toISOString()
    }));

    const { data: newSends, error: sendsError } = await supabase
      .from('sends')
      .insert(sendsToCreate)
      .select('id, person_id');

    if (sendsError) throw sendsError;

    res.json({ success: true, message: `Successfully queued ${newSends.length} greetings.`, data: newSends });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;