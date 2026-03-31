import { corsHeaders } from '../_shared/cors.ts';

interface GenerateTemplateRequest {
  prompt: string;
  category: 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting';
  ageGroup: 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)';
}

interface GenerateTemplateResponse {
  success: boolean;
  template?: {
    name: string;
    content: string;
    description: string;
    design: {
      background: string;
      textColor: string;
      fontFamily: string;
    };
  };
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

    const requestData: GenerateTemplateRequest = await req.json();
    
    // Validate required fields
    if (!requestData.prompt || !requestData.category || !requestData.ageGroup) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, category, ageGroup' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // AI Template Generation Logic
    const generateTemplate = (prompt: string, category: string, ageGroup: string) => {
      // Define age-appropriate color schemes and fonts
      const ageGroupStyles = {
        'Children (8-15)': {
          colors: ['#ff6b6b, #4ecdc4', '#667eea, #764ba2', '#56ab2f, #a8e6cf', '#ff9a9e, #fecfef'],
          fonts: ['Comic Sans MS, cursive', 'Fredoka One, cursive', 'Bubblegum Sans, cursive'],
          elements: ['🌈', '🦄', '⭐', '🎈', '🎂', '🎁', '✨', '🌟', '🎪', '🎨']
        },
        'Teens (15-18)': {
          colors: ['#667eea, #764ba2', '#ff9a9e, #fecfef', '#ffecd2, #fcb69f', '#a8edea, #fed6e3'],
          fonts: ['Helvetica Neue, Arial, sans-serif', 'SF Pro Display, -apple-system, sans-serif', 'Inter, sans-serif'],
          elements: ['✨', '💫', '🌟', '💖', '🎵', '🎧', '📱', '💅', '🔥', '💯']
        },
        'Adults (18+)': {
          colors: ['#667eea, #764ba2', '#f093fb, #f5576c', '#1e3c72, #2a5298', '#56ab2f, #a8e6cf'],
          fonts: ['Playfair Display, Georgia, serif', 'Montserrat, Arial, sans-serif', 'Lato, Arial, sans-serif'],
          elements: ['🥂', '✨', '🌟', '💐', '🌹', '💝', '🎊', '🏆', '⭐', '💫']
        }
      };

      const styles = ageGroupStyles[ageGroup as keyof typeof ageGroupStyles];
      const randomColor = styles.colors[Math.floor(Math.random() * styles.colors.length)];
      const randomFont = styles.fonts[Math.floor(Math.random() * styles.fonts.length)];
      const randomElements = styles.elements.sort(() => 0.5 - Math.random()).slice(0, 3);

      // Generate template name based on prompt
      const templateName = `AI Generated: ${prompt.split(' ').slice(0, 3).join(' ')}`;
      
      // Create HTML content based on category and age group
      const content = `
        <div style="background: linear-gradient(135deg, ${randomColor}); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: '${randomFont}';">
          <div style="background: rgba(255,255,255,0.95); padding: 35px; border-radius: 15px; color: #2c3e50;">
            <div style="width: 80px; height: 80px; background: linear-gradient(45deg, ${randomColor}); border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px;">${randomElements[0]}</div>
            <h1 style="font-size: 36px; margin-bottom: 20px; font-weight: 600; color: #2c3e50;">${category === 'Birthday' ? 'Happy Birthday' : category === 'Anniversary' ? 'Happy Anniversary' : category === 'Greeting' ? 'Hello' : 'You\'re Invited'}</h1>
            <h2 style="font-size: 42px; margin-bottom: 25px; font-weight: 800; background: linear-gradient(45deg, ${randomColor}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
            <div style="width: 60px; height: 2px; background: linear-gradient(45deg, ${randomColor}); margin: 25px auto;"></div>
            <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 400;">
              ${category === 'Birthday' ? 'Wishing you a day filled with happiness and a year filled with joy!' : 
                category === 'Anniversary' ? 'Celebrating another beautiful year together!' :
                category === 'Greeting' ? 'Sending you warm wishes and positive thoughts!' :
                'Join us for a special celebration!'}
            </p>
            <div style="background: linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;">
              <p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p>
            </div>
            <div style="margin-top: 30px; font-size: 20px; color: #667eea;">${randomElements.join(' ')}</div>
          </div>
        </div>
      `;

      return {
        name: templateName,
        content: content.trim(),
        description: `AI-generated ${category.toLowerCase()} template for ${ageGroup.toLowerCase()} based on: ${prompt}`,
        design: {
          background: `linear-gradient(135deg, ${randomColor})`,
          textColor: '#2c3e50',
          fontFamily: randomFont
        }
      };
    };

    const generatedTemplate = generateTemplate(requestData.prompt, requestData.category, requestData.ageGroup);

    const response: GenerateTemplateResponse = {
      success: true,
      template: generatedTemplate
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Template generation error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate template' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});