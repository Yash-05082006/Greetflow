const cron = require('node-cron');
const { supabase } = require('../config/supabase');
const fetch = (...args) => import('node-fetch').then(({ default: fetchFn }) => fetchFn(...args));

let schedulerStarted = false;

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function runDailyAutomation() {
  console.log('[Scheduler] Daily automation job started');

  try {
    const today = new Date();
    const todayMonth = today.getUTCMonth();
    const todayDay = today.getUTCDate();

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, date_of_birth, anniversary_date')
      .or('date_of_birth.not.is.null,anniversary_date.not.is.null');

    if (error) {
      console.error('[Scheduler] Failed to fetch users for daily automation:', error);
      return;
    }

    const users = data || [];

    const birthdayUsers = users.filter((user) => {
      if (!user.date_of_birth) return false;
      const dob = new Date(user.date_of_birth);
      return dob.getUTCMonth() === todayMonth && dob.getUTCDate() === todayDay;
    });

    const anniversaryUsers = users.filter((user) => {
      if (!user.anniversary_date) return false;
      const ann = new Date(user.anniversary_date);
      return ann.getUTCMonth() === todayMonth && ann.getUTCDate() === todayDay;
    });

    console.log('🎂 Birthday users found:', birthdayUsers.length);
    console.log('💍 Anniversary users found:', anniversaryUsers.length);

    // Load uploaded templates manifest from Supabase Storage
    try {
      const { data: file, error: downloadError } = await supabase
        .storage
        .from('Templates')
        .download('manifest.json');

      if (downloadError || !file) {
        console.warn(
          '[Scheduler] manifest.json not found in Templates bucket or download failed:',
          downloadError?.message || 'No file'
        );
      } else {
        const text = await file.text();

        let manifest;
        try {
          manifest = JSON.parse(text);
        } catch (parseError) {
          console.error('[Scheduler] Failed to parse manifest.json:', parseError);
          manifest = null;
        }

        if (Array.isArray(manifest)) {
          const birthdayTemplates = manifest.filter((t) => t && t.type === 'birthday');
          const anniversaryTemplates = manifest.filter((t) => t && t.type === 'anniversary');

          console.log('🖼 Birthday templates available:', birthdayTemplates.length);
          console.log('🖼 Anniversary templates available:', anniversaryTemplates.length);

          // Send birthday emails using uploaded templates via API
          if (birthdayTemplates.length > 0 && birthdayUsers.length > 0) {
            for (const user of birthdayUsers) {
              try {
                const template = getRandomItem(birthdayTemplates);

                const { data, error: publicError } = supabase
                  .storage
                  .from('Templates')
                  .getPublicUrl(template.path);

                if (publicError || !data?.publicUrl) {
                  console.warn(
                    '[Scheduler] Failed to get public URL for birthday template path:',
                    template.path,
                    publicError?.message || 'No public URL'
                  );
                  continue;
                }

                const imageUrl = data.publicUrl;

                const subject = `Happy Birthday, ${user.name}! 🎂`;
                const htmlContent = `
    <div style="text-align:center;font-family:sans-serif">
      <h2>🎉 Happy Birthday ${user.name}!</h2>
      <img src="${imageUrl}" style="max-width:600px;width:100%;border-radius:8px"/>
    </div>
  `;

                try {
                  const response = await fetch('http://localhost:4000/api/send-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      to: user.email,
                      name: user.name,
                      subject,
                      htmlTemplate: htmlContent,
                    }),
                  });

                  console.log(`📧 Automation API response for ${user.email}:`, response.status);

                  if (!response.ok) {
                    console.error(
                      '[Scheduler] Birthday automation API returned non-OK status for',
                      user.email,
                      response.status
                    );
                  } else {
                    console.log(`📧 Birthday email sent to ${user.email}`);
                  }
                } catch (sendError) {
                  console.error('[Scheduler] Failed to call automation API for birthday email to', user.email, sendError);
                }
              } catch (userError) {
                console.error('[Scheduler] Error while processing birthday user', user.email, userError);
              }
            }
          }

          // Send anniversary emails using uploaded templates via API
          if (anniversaryTemplates.length > 0 && anniversaryUsers.length > 0) {
            for (const user of anniversaryUsers) {
              try {
                const template = getRandomItem(anniversaryTemplates);

                const { data, error: publicError } = supabase
                  .storage
                  .from('Templates')
                  .getPublicUrl(template.path);

                if (publicError || !data?.publicUrl) {
                  console.warn(
                    '[Scheduler] Failed to get public URL for anniversary template path:',
                    template.path,
                    publicError?.message || 'No public URL'
                  );
                  continue;
                }

                const imageUrl = data.publicUrl;

                const subject = `Happy Anniversary, ${user.name}! 💍`;
                const htmlContent = `
    <div style="text-align:center;font-family:sans-serif">
      <h2>💍 Happy Anniversary ${user.name}!</h2>
      <img src="${imageUrl}" style="max-width:600px;width:100%;border-radius:8px"/>
    </div>
  `;

                try {
                  const response = await fetch('http://localhost:4000/api/send-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      to: user.email,
                      name: user.name,
                      subject,
                      htmlTemplate: htmlContent,
                    }),
                  });

                  console.log(`📧 Automation API response for ${user.email}:`, response.status);

                  if (!response.ok) {
                    console.error(
                      '[Scheduler] Anniversary automation API returned non-OK status for',
                      user.email,
                      response.status
                    );
                  } else {
                    console.log(`📧 Anniversary email sent to ${user.email}`);
                  }
                } catch (sendError) {
                  console.error('[Scheduler] Failed to call automation API for anniversary email to', user.email, sendError);
                }
              } catch (userError) {
                console.error('[Scheduler] Error while processing anniversary user', user.email, userError);
              }
            }
          }
        } else if (manifest !== null) {
          console.warn('[Scheduler] manifest.json is not an array; skipping template classification.');
        }
      }
    } catch (storageError) {
      console.error('[Scheduler] Error while loading templates manifest:', storageError);
    }
  } catch (error) {
    console.error('[Scheduler] Error in runDailyAutomation:', error);
  }
}

function startDailyScheduler() {
  if (schedulerStarted) {
    console.log('[Scheduler] Daily scheduler already started; skipping.');
    return;
  }

  schedulerStarted = true;

  console.log('[Scheduler] Starting daily scheduler (runs every day at 00:00 server time).');

  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Midnight trigger fired; running daily automation.');

    try {
      await runDailyAutomation();
    } catch (error) {
      console.error('[Scheduler] Daily automation job failed:', error);
    }
  });

  console.log('[Scheduler] Daily scheduler started.');
}

module.exports = {
  startDailyScheduler,
};

