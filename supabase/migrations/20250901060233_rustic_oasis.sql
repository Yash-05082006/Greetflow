/*
  # Seed Templates for GreetFlow System

  1. Insert Default Templates
    - Children birthday templates (4 options)
    - Teen birthday templates (4 options) 
    - Adult birthday templates (4 options)
    - Anniversary templates (2 options)
    - Event invitation templates (2 options)
    - Greeting templates (2 options)

  2. Template Content
    - Rich HTML content with modern designs
    - Placeholder support for [Name] and [Message]
    - Age-appropriate styling and messaging
*/

-- Children Birthday Templates
INSERT INTO templates (name, category, age_group, content, description, design, usage_count) VALUES
(
  'Magical Rainbow Adventure',
  'Birthday',
  'Children (8-15)',
  '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: ''Comic Sans MS'', cursive;"><div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; backdrop-filter: blur(10px);"><h1 style="font-size: 32px; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🌈 Happy Birthday [Name]! 🌈</h1><div style="font-size: 20px; margin: 20px 0;">🎂✨🎈</div><p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">Hope your special day is filled with magical moments, rainbow adventures, and all your favorite things!</p><div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px;"><p style="font-size: 16px; font-style: italic;">[Message]</p></div><div style="margin-top: 25px; font-size: 24px;">🦄🌟🎁</div></div></div>',
  'Magical rainbow theme with unicorns and sparkles',
  '{"background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "textColor": "#ffffff", "fontFamily": "Comic Sans MS, cursive"}',
  45
),
(
  'Space Explorer Mission',
  'Birthday', 
  'Children (8-15)',
  '<div style="background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: Arial, sans-serif;"><div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.2);"><h1 style="font-size: 32px; margin-bottom: 15px; text-shadow: 0 0 20px #00ffff;">🚀 Mission Birthday: [Name]! 🚀</h1><div style="font-size: 20px; margin: 20px 0;">🌌⭐🛸</div><p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">Blast off into another amazing year of adventures! Your mission: have the most epic birthday ever!</p><div style="background: rgba(0,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px; border: 1px solid rgba(0,255,255,0.3);"><p style="font-size: 16px; font-style: italic;">[Message]</p></div><div style="margin-top: 25px; font-size: 24px;">🌍👨‍🚀🎂</div></div></div>',
  'Space adventure theme with rockets and planets',
  '{"background": "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)", "textColor": "#ffffff", "fontFamily": "Arial, sans-serif"}',
  38
);

-- Teen Birthday Templates  
INSERT INTO templates (name, category, age_group, content, description, design, usage_count) VALUES
(
  'Neon City Vibes',
  'Birthday',
  'Teens (15-18)', 
  '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: ''Helvetica Neue'', Arial, sans-serif;"><div style="background: rgba(0,0,0,0.2); padding: 25px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.3);"><h1 style="font-size: 36px; margin-bottom: 15px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;">✨ [Name]''s Birthday Glow-Up! ✨</h1><div style="font-size: 22px; margin: 20px 0;">💫🎵🌟</div><p style="font-size: 20px; line-height: 1.6; margin-bottom: 20px; font-weight: 500;">Another year of being absolutely iconic! Keep shining and slaying! 💅</p><div style="background: linear-gradient(45deg, rgba(255,107,107,0.3), rgba(78,205,196,0.3)); padding: 20px; border-radius: 12px; margin-top: 25px;"><p style="font-size: 18px; font-style: italic; font-weight: 500;">[Message]</p></div><div style="margin-top: 25px; font-size: 24px;">🎂🎉💖</div></div></div>',
  'Modern neon aesthetic with trendy language',
  '{"background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "textColor": "#ffffff", "fontFamily": "Helvetica Neue, Arial, sans-serif"}',
  67
),
(
  'Aesthetic Minimalist',
  'Birthday',
  'Teens (15-18)',
  '<div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; border-radius: 20px; text-align: center; color: #2c3e50; font-family: ''SF Pro Display'', -apple-system, sans-serif;"><div style="background: rgba(255,255,255,0.7); padding: 25px; border-radius: 15px; backdrop-filter: blur(10px);"><h1 style="font-size: 34px; margin-bottom: 15px; font-weight: 300; letter-spacing: -1px;">happy birthday</h1><h2 style="font-size: 42px; margin-bottom: 20px; font-weight: 700; background: linear-gradient(45deg, #ff6b6b, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2><div style="font-size: 20px; margin: 25px 0; opacity: 0.8;">✨ • ☁️ • 🌸</div><p style="font-size: 18px; line-height: 1.8; margin-bottom: 25px; font-weight: 400; opacity: 0.9;">here''s to another year of growth, dreams, and endless possibilities</p><div style="background: rgba(255,255,255,0.5); padding: 20px; border-radius: 12px; margin-top: 25px;"><p style="font-size: 16px; font-style: italic; font-weight: 400;">[Message]</p></div></div></div>',
  'Clean aesthetic design with soft colors',
  '{"background": "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", "textColor": "#2c3e50", "fontFamily": "SF Pro Display, -apple-system, sans-serif"}',
  84
);

-- Adult Birthday Templates
INSERT INTO templates (name, category, age_group, content, description, design, usage_count) VALUES
(
  'Sophisticated Elegance',
  'Birthday',
  'Adults (18+)',
  '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: ''Playfair Display'', Georgia, serif;"><div style="background: rgba(255,255,255,0.95); padding: 35px; border-radius: 15px; color: #2c3e50; box-shadow: 0 20px 40px rgba(0,0,0,0.1);"><h1 style="font-size: 36px; margin-bottom: 20px; font-weight: 400; color: #2c3e50; letter-spacing: -1px;">Happy Birthday</h1><h2 style="font-size: 42px; margin-bottom: 25px; font-weight: 700; background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2><div style="width: 60px; height: 2px; background: linear-gradient(45deg, #667eea, #764ba2); margin: 25px auto;"></div><p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 300;">Wishing you a day filled with happiness and a year filled with joy, success, and beautiful moments.</p><div style="background: linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px; border-left: 4px solid #667eea;"><p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p></div><div style="margin-top: 30px; font-size: 20px; color: #667eea;">🥂 ✨ 🌟</div></div></div>',
  'Elegant and sophisticated with premium styling',
  '{"background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "textColor": "#2c3e50", "fontFamily": "Playfair Display, Georgia, serif"}',
  123
),
(
  'Modern Minimalist',
  'Birthday',
  'Adults (18+)',
  '<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: ''Inter'', -apple-system, sans-serif;"><div style="background: rgba(255,255,255,0.98); padding: 40px; border-radius: 15px; color: #1a202c;"><div style="width: 80px; height: 80px; background: linear-gradient(45deg, #f093fb, #f5576c); border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🎉</div><h1 style="font-size: 28px; margin-bottom: 10px; font-weight: 600; color: #1a202c;">Happy Birthday</h1><h2 style="font-size: 38px; margin-bottom: 25px; font-weight: 800; background: linear-gradient(45deg, #f093fb, #f5576c); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2><p style="font-size: 18px; line-height: 1.7; margin-bottom: 30px; color: #4a5568; font-weight: 400;">May this new chapter bring you endless opportunities, cherished memories, and all the happiness you deserve.</p><div style="background: linear-gradient(45deg, rgba(240,147,251,0.1), rgba(245,87,108,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;"><p style="font-size: 16px; font-style: italic; color: #718096; line-height: 1.6;">[Message]</p></div><div style="margin-top: 30px; font-size: 18px; color: #f093fb;">🌸 💫 🎂</div></div></div>',
  'Clean modern design with subtle gradients',
  '{"background": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", "textColor": "#1a202c", "fontFamily": "Inter, -apple-system, sans-serif"}',
  156
);

-- Anniversary Templates
INSERT INTO templates (name, category, age_group, content, description, design, usage_count) VALUES
(
  'Romantic Sunset',
  'Anniversary',
  'Adults (18+)',
  '<div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: ''Dancing Script'', cursive;"><div style="background: rgba(255,255,255,0.95); padding: 40px; border-radius: 15px; color: #2c3e50;"><div style="width: 100px; height: 100px; background: linear-gradient(45deg, #ff6b6b, #feca57); border-radius: 50%; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; font-size: 40px;">💕</div><h1 style="font-size: 38px; margin-bottom: 20px; font-weight: 400; color: #2c3e50;">Happy Anniversary</h1><h2 style="font-size: 44px; margin-bottom: 25px; font-weight: 700; background: linear-gradient(45deg, #ff6b6b, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2><p style="font-size: 22px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 300;">Celebrating another beautiful year of love, laughter, and unforgettable memories together.</p><div style="background: linear-gradient(45deg, rgba(255,107,107,0.1), rgba(254,202,87,0.1)); padding: 30px; border-radius: 12px; margin-top: 30px;"><p style="font-size: 20px; font-style: italic; color: #5a6c7d; line-height: 1.7;">[Message]</p></div><div style="margin-top: 35px; font-size: 24px; color: #ff6b6b;">🌹 💖 ✨</div></div></div>',
  'Romantic sunset theme with elegant typography',
  '{"background": "linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)", "textColor": "#2c3e50", "fontFamily": "Dancing Script, cursive"}',
  76
);

-- Event Invitation Templates
INSERT INTO templates (name, category, age_group, content, description, design, usage_count) VALUES
(
  'Corporate Excellence',
  'Event Invitation',
  'Adults (18+)',
  '<div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: ''Montserrat'', Arial, sans-serif;"><div style="background: rgba(255,255,255,0.97); padding: 40px; border-radius: 15px; color: #1e3c72;"><div style="width: 100px; height: 100px; background: linear-gradient(45deg, #1e3c72, #2a5298); border-radius: 20px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; transform: rotate(45deg);"><div style="transform: rotate(-45deg);">🎯</div></div><h1 style="font-size: 32px; margin-bottom: 20px; font-weight: 600; color: #1e3c72; letter-spacing: 1px;">You''re Invited</h1><h2 style="font-size: 40px; margin-bottom: 25px; font-weight: 800; background: linear-gradient(45deg, #1e3c72, #2a5298); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2><div style="width: 80px; height: 2px; background: linear-gradient(45deg, #1e3c72, #2a5298); margin: 25px auto;"></div><p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 400;">Join us for an exceptional evening as we celebrate our company milestone and achievements.</p><div style="background: linear-gradient(45deg, rgba(30,60,114,0.1), rgba(42,82,152,0.1)); padding: 30px; border-radius: 15px; margin-top: 30px; border: 1px solid rgba(30,60,114,0.2);"><p style="font-size: 18px; color: #5a6c7d; line-height: 1.7; margin-bottom: 15px;">[Message]</p><div style="background: rgba(30,60,114,0.1); padding: 15px; border-radius: 8px;"><p style="color: #1e3c72; font-weight: 600; font-size: 16px;">Event Details Inside</p></div></div><div style="margin-top: 35px; font-size: 20px; color: #1e3c72;">🏆 🥂 ⭐</div></div></div>',
  'Professional corporate event invitation',
  '{"background": "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)", "textColor": "#1e3c72", "fontFamily": "Montserrat, Arial, sans-serif"}',
  156
);

-- Greeting Templates
INSERT INTO templates (name, category, age_group, content, description, design, usage_count) VALUES
(
  'Warm Professional',
  'Greeting',
  'Adults (18+)',
  '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: ''Source Sans Pro'', Arial, sans-serif;"><div style="background: rgba(255,255,255,0.96); padding: 35px; border-radius: 15px; color: #2c3e50;"><div style="width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;">👋</div><h1 style="font-size: 36px; margin-bottom: 20px; font-weight: 300; color: #2c3e50;">Hello [Name]!</h1><div style="width: 60px; height: 2px; background: linear-gradient(45deg, #667eea, #764ba2); margin: 25px auto;"></div><p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 400;">Sending you warm wishes and positive thoughts your way. Hope you''re having a wonderful day!</p><div style="background: linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;"><p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p></div><div style="margin-top: 30px; font-size: 20px; color: #667eea;">🌿 💚 🌱</div></div></div>',
  'Professional yet warm greeting design',
  '{"background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", "textColor": "#2c3e50", "fontFamily": "Source Sans Pro, Arial, sans-serif"}',
  234
);