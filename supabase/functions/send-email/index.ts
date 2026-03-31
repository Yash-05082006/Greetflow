import { corsHeaders } from '../_shared/cors.ts';

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  recipientName: string;
  templateId?: string;
  userId: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const emailData: EmailRequest = await req.json();
    
    // Validate required fields
    if (!emailData.to || !emailData.subject || !emailData.html || !emailData.recipientName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For demo purposes, we'll simulate email sending
    // In production, you would integrate with Gmail API or SMTP
    const simulateEmailSend = async (): Promise<EmailResponse> => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      
      if (success) {
        return {
          success: true,
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        return {
          success: false,
          error: 'Failed to deliver email - recipient mailbox full'
        };
      }
    };

    const result = await simulateEmailSend();

    // Log the email attempt to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const logResponse = await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
          },
          body: JSON.stringify({
            user_id: emailData.userId,
            template_id: emailData.templateId,
            recipient_email: emailData.to,
            recipient_name: emailData.recipientName,
            subject: emailData.subject,
            content: emailData.html,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error,
            sent_at: result.success ? new Date().toISOString() : null
          })
        });

        if (!logResponse.ok) {
          console.error('Failed to log email:', await logResponse.text());
        }
      } catch (logError) {
        console.error('Error logging email:', logError);
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});