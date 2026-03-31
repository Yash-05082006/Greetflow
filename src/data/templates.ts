import { Template } from '../types';

export const templates: Template[] = [
  // Children Birthday Templates (8-15 years)
  {
    id: 'child-birthday-1',
    name: 'Magical Rainbow Adventure',
    category: 'Birthday',
    ageGroup: 'Children (8-15)',
    content: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: 'Comic Sans MS', cursive;">
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; backdrop-filter: blur(10px);">
          <h1 style="font-size: 32px; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🌈 Happy Birthday [Name]! 🌈</h1>
          <div style="font-size: 20px; margin: 20px 0;">🎂✨🎈</div>
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Hope your special day is filled with magical moments, rainbow adventures, and all your favorite things!
          </p>
          <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; font-style: italic;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🦄🌟🎁</div>
        </div>
      </div>
    `,
    description: 'Magical rainbow theme with unicorns and sparkles',
    design: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      fontFamily: 'Comic Sans MS, cursive'
    },
    usageCount: 45
  },
  {
    id: 'child-birthday-2',
    name: 'Space Explorer Mission',
    category: 'Birthday',
    ageGroup: 'Children (8-15)',
    content: `
      <div style="background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.2);">
          <h1 style="font-size: 32px; margin-bottom: 15px; text-shadow: 0 0 20px #00ffff;">🚀 Mission Birthday: [Name]! 🚀</h1>
          <div style="font-size: 20px; margin: 20px 0;">🌌⭐🛸</div>
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Blast off into another amazing year of adventures! Your mission: have the most epic birthday ever!
          </p>
          <div style="background: rgba(0,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px; border: 1px solid rgba(0,255,255,0.3);">
            <p style="font-size: 16px; font-style: italic;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🌍👨‍🚀🎂</div>
        </div>
      </div>
    `,
    description: 'Space adventure theme with rockets and planets',
    design: {
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      textColor: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    },
    usageCount: 38
  },
  {
    id: 'child-birthday-3',
    name: 'Superhero Power-Up',
    category: 'Birthday',
    ageGroup: 'Children (8-15)',
    content: `
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: 'Arial Black', Arial, sans-serif;">
        <div style="background: rgba(0,0,0,0.1); padding: 20px; border-radius: 15px; box-shadow: inset 0 0 20px rgba(0,0,0,0.2);">
          <h1 style="font-size: 32px; margin-bottom: 15px; text-shadow: 3px 3px 0px #ff4757;">⚡ SUPER [Name] BIRTHDAY! ⚡</h1>
          <div style="font-size: 20px; margin: 20px 0;">🦸‍♂️💥🎯</div>
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: bold;">
            Another year older means your superpowers are getting stronger! Ready for your next adventure?
          </p>
          <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px; border: 2px dashed rgba(255,255,255,0.5);">
            <p style="font-size: 16px; font-style: italic;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🎂🎊🏆</div>
        </div>
      </div>
    `,
    description: 'Superhero theme with bold colors and action elements',
    design: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      textColor: '#ffffff',
      fontFamily: 'Arial Black, Arial, sans-serif'
    },
    usageCount: 52
  },
  {
    id: 'child-birthday-4',
    name: 'Ocean Adventure',
    category: 'Birthday',
    ageGroup: 'Children (8-15)',
    content: `
      <div style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: 'Trebuchet MS', sans-serif;">
        <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 15px; border: 2px solid rgba(255,255,255,0.2);">
          <h1 style="font-size: 32px; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">🌊 Dive into Birthday Fun, [Name]! 🌊</h1>
          <div style="font-size: 20px; margin: 20px 0;">🐠🐙🏖️</div>
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Make a splash on your special day! May your birthday be as deep and wonderful as the ocean!
          </p>
          <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; font-style: italic;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🎂🌺⚓</div>
        </div>
      </div>
    `,
    description: 'Ocean adventure with sea creatures and waves',
    design: {
      background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      textColor: '#ffffff',
      fontFamily: 'Trebuchet MS, sans-serif'
    },
    usageCount: 29
  },

  // Teen Birthday Templates (15-18 years)
  {
    id: 'teen-birthday-1',
    name: 'Neon City Vibes',
    category: 'Birthday',
    ageGroup: 'Teens (15-18)',
    content: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <div style="background: rgba(0,0,0,0.2); padding: 25px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.3);">
          <h1 style="font-size: 36px; margin-bottom: 15px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;">✨ [Name]'s Birthday Glow-Up! ✨</h1>
          <div style="font-size: 22px; margin: 20px 0;">💫🎵🌟</div>
          <p style="font-size: 20px; line-height: 1.6; margin-bottom: 20px; font-weight: 500;">
            Another year of being absolutely iconic! Keep shining and slaying! 💅
          </p>
          <div style="background: linear-gradient(45deg, rgba(255,107,107,0.3), rgba(78,205,196,0.3)); padding: 20px; border-radius: 12px; margin-top: 25px;">
            <p style="font-size: 18px; font-style: italic; font-weight: 500;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🎂🎉💖</div>
        </div>
      </div>
    `,
    description: 'Modern neon aesthetic with trendy language',
    design: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      fontFamily: 'Helvetica Neue, Arial, sans-serif'
    },
    usageCount: 67
  },
  {
    id: 'teen-birthday-2',
    name: 'Aesthetic Minimalist',
    category: 'Birthday',
    ageGroup: 'Teens (15-18)',
    content: `
      <div style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); padding: 30px; border-radius: 20px; text-align: center; color: #2c3e50; font-family: 'SF Pro Display', -apple-system, sans-serif;">
        <div style="background: rgba(255,255,255,0.7); padding: 25px; border-radius: 15px; backdrop-filter: blur(10px);">
          <h1 style="font-size: 34px; margin-bottom: 15px; font-weight: 300; letter-spacing: -1px;">happy birthday</h1>
          <h2 style="font-size: 42px; margin-bottom: 20px; font-weight: 700; background: linear-gradient(45deg, #ff6b6b, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <div style="font-size: 20px; margin: 25px 0; opacity: 0.8;">✨ • ☁️ • 🌸</div>
          <p style="font-size: 18px; line-height: 1.8; margin-bottom: 25px; font-weight: 400; opacity: 0.9;">
            here's to another year of growth, dreams, and endless possibilities
          </p>
          <div style="background: rgba(255,255,255,0.5); padding: 20px; border-radius: 12px; margin-top: 25px;">
            <p style="font-size: 16px; font-style: italic; font-weight: 400;">[Message]</p>
          </div>
        </div>
      </div>
    `,
    description: 'Clean aesthetic design with soft colors',
    design: {
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      textColor: '#2c3e50',
      fontFamily: 'SF Pro Display, -apple-system, sans-serif'
    },
    usageCount: 84
  },
  {
    id: 'teen-birthday-3',
    name: 'Gaming Level Up',
    category: 'Birthday',
    ageGroup: 'Teens (15-18)',
    content: `
      <div style="background: linear-gradient(135deg, #0f3460 0%, #e94560 100%); padding: 30px; border-radius: 20px; text-align: center; color: white; font-family: 'Courier New', monospace;">
        <div style="background: rgba(0,0,0,0.3); padding: 25px; border-radius: 15px; border: 2px solid #00ff88;">
          <h1 style="font-size: 28px; margin-bottom: 10px; color: #00ff88; text-shadow: 0 0 10px #00ff88;">LEVEL UP COMPLETE!</h1>
          <h2 style="font-size: 36px; margin-bottom: 20px; font-weight: bold;">PLAYER: [Name]</h2>
          <div style="font-size: 20px; margin: 20px 0; color: #00ff88;">🎮 • 🏆 • ⚡</div>
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px;">
            Achievement Unlocked: Another Year of Awesome! 🎯<br/>
            XP Gained: +365 Days of Epic Adventures!
          </p>
          <div style="background: rgba(0,255,136,0.1); padding: 15px; border-radius: 10px; margin-top: 20px; border: 1px solid #00ff88;">
            <p style="font-size: 16px; font-style: italic; color: #00ff88;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🎂🎊🕹️</div>
        </div>
      </div>
    `,
    description: 'Gaming-inspired with retro console aesthetics',
    design: {
      background: 'linear-gradient(135deg, #0f3460 0%, #e94560 100%)',
      textColor: '#ffffff',
      fontFamily: 'Courier New, monospace'
    },
    usageCount: 71
  },
  {
    id: 'teen-birthday-4',
    name: 'Music Festival Vibes',
    category: 'Birthday',
    ageGroup: 'Teens (15-18)',
    content: `
      <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); padding: 30px; border-radius: 20px; text-align: center; color: #2d3436; font-family: 'Helvetica Neue', Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.8); padding: 25px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <h1 style="font-size: 34px; margin-bottom: 15px; font-weight: 800; background: linear-gradient(45deg, #fd79a8, #fdcb6e); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🎵 [Name]'s Birthday Beat! 🎵</h1>
          <div style="font-size: 20px; margin: 20px 0;">🎤🎧🌈</div>
          <p style="font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: 500;">
            Turn up the volume because it's your day to shine! Dance like nobody's watching! 💃
          </p>
          <div style="background: linear-gradient(45deg, rgba(253,121,168,0.2), rgba(253,203,110,0.2)); padding: 20px; border-radius: 12px; margin-top: 25px;">
            <p style="font-size: 16px; font-style: italic; font-weight: 500;">[Message]</p>
          </div>
          <div style="margin-top: 25px; font-size: 24px;">🎂🎶✨</div>
        </div>
      </div>
    `,
    description: 'Music festival theme with vibrant gradients',
    design: {
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      textColor: '#2d3436',
      fontFamily: 'Helvetica Neue, Arial, sans-serif'
    },
    usageCount: 43
  },

  // Adult Birthday Templates (18+ years)
  {
    id: 'adult-birthday-1',
    name: 'Sophisticated Elegance',
    category: 'Birthday',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Playfair Display', Georgia, serif;">
        <div style="background: rgba(255,255,255,0.95); padding: 35px; border-radius: 15px; color: #2c3e50; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
          <h1 style="font-size: 36px; margin-bottom: 20px; font-weight: 400; color: #2c3e50; letter-spacing: -1px;">Happy Birthday</h1>
          <h2 style="font-size: 42px; margin-bottom: 25px; font-weight: 700; background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <div style="width: 60px; height: 2px; background: linear-gradient(45deg, #667eea, #764ba2); margin: 25px auto;"></div>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 300;">
            Wishing you a day filled with happiness and a year filled with joy, success, and beautiful moments.
          </p>
          <div style="background: linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px; border-left: 4px solid #667eea;">
            <p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #667eea;">🥂 ✨ 🌟</div>
        </div>
      </div>
    `,
    description: 'Elegant and sophisticated with premium styling',
    design: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#2c3e50',
      fontFamily: 'Playfair Display, Georgia, serif'
    },
    usageCount: 123
  },
  {
    id: 'adult-birthday-2',
    name: 'Modern Minimalist',
    category: 'Birthday',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Inter', -apple-system, sans-serif;">
        <div style="background: rgba(255,255,255,0.98); padding: 40px; border-radius: 15px; color: #1a202c;">
          <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #f093fb, #f5576c); border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🎉</div>
          <h1 style="font-size: 28px; margin-bottom: 10px; font-weight: 600; color: #1a202c;">Happy Birthday</h1>
          <h2 style="font-size: 38px; margin-bottom: 25px; font-weight: 800; background: linear-gradient(45deg, #f093fb, #f5576c); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <p style="font-size: 18px; line-height: 1.7; margin-bottom: 30px; color: #4a5568; font-weight: 400;">
            May this new chapter bring you endless opportunities, cherished memories, and all the happiness you deserve.
          </p>
          <div style="background: linear-gradient(45deg, rgba(240,147,251,0.1), rgba(245,87,108,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 16px; font-style: italic; color: #718096; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 18px; color: #f093fb;">🌸 💫 🎂</div>
        </div>
      </div>
    `,
    description: 'Clean modern design with subtle gradients',
    design: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      textColor: '#1a202c',
      fontFamily: 'Inter, -apple-system, sans-serif'
    },
    usageCount: 156
  },
  {
    id: 'adult-birthday-3',
    name: 'Luxury Gold Edition',
    category: 'Birthday',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Cormorant Garamond', Georgia, serif;">
        <div style="background: rgba(255,255,255,0.95); padding: 40px; border-radius: 15px; color: #2c3e50; border: 3px solid #d4af37;">
          <div style="width: 100px; height: 2px; background: linear-gradient(45deg, #d4af37, #ffd700); margin: 0 auto 30px;"></div>
          <h1 style="font-size: 32px; margin-bottom: 15px; font-weight: 400; color: #2c3e50; letter-spacing: 2px;">HAPPY BIRTHDAY</h1>
          <h2 style="font-size: 44px; margin-bottom: 25px; font-weight: 700; color: #d4af37; text-shadow: 2px 2px 4px rgba(212,175,55,0.3);">[Name]</h2>
          <div style="width: 60px; height: 2px; background: linear-gradient(45deg, #d4af37, #ffd700); margin: 25px auto;"></div>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 300; font-style: italic;">
            "May this new year of your life bring you prosperity, wisdom, and countless moments of pure joy."
          </p>
          <div style="background: linear-gradient(45deg, rgba(212,175,55,0.1), rgba(255,215,0,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px; border: 1px solid rgba(212,175,55,0.3);">
            <p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #d4af37;">🍾 ✨ 🎊</div>
        </div>
      </div>
    `,
    description: 'Luxurious gold theme with premium typography',
    design: {
      background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
      textColor: '#2c3e50',
      fontFamily: 'Cormorant Garamond, Georgia, serif'
    },
    usageCount: 89
  },
  {
    id: 'adult-birthday-4',
    name: 'Nature Inspired',
    category: 'Birthday',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Lato', Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.92); padding: 35px; border-radius: 15px; color: #2d5016;">
          <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #56ab2f, #a8e6cf); border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🌿</div>
          <h1 style="font-size: 32px; margin-bottom: 15px; font-weight: 300; color: #2d5016;">Happy Birthday</h1>
          <h2 style="font-size: 40px; margin-bottom: 25px; font-weight: 700; background: linear-gradient(45deg, #56ab2f, #a8e6cf); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <p style="font-size: 19px; line-height: 1.7; margin-bottom: 30px; color: #4a5d23; font-weight: 400;">
            Like a tree that grows stronger with each passing season, may you continue to flourish and bloom beautifully.
          </p>
          <div style="background: linear-gradient(45deg, rgba(86,171,47,0.1), rgba(168,230,207,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px; border: 1px solid rgba(86,171,47,0.3);">
            <p style="font-size: 17px; font-style: italic; color: #5a6c23; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #56ab2f;">🌺 🍃 🌸</div>
        </div>
      </div>
    `,
    description: 'Nature-inspired with organic elements',
    design: {
      background: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
      textColor: '#2d5016',
      fontFamily: 'Lato, Arial, sans-serif'
    },
    usageCount: 67
  },

  // Anniversary Templates
  {
    id: 'anniversary-1',
    name: 'Romantic Sunset',
    category: 'Anniversary',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Dancing Script', cursive;">
        <div style="background: rgba(255,255,255,0.95); padding: 40px; border-radius: 15px; color: #2c3e50;">
          <div style="width: 100px; height: 100px; background: linear-gradient(45deg, #ff6b6b, #feca57); border-radius: 50%; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; font-size: 40px;">💕</div>
          <h1 style="font-size: 38px; margin-bottom: 20px; font-weight: 400; color: #2c3e50;">Happy Anniversary</h1>
          <h2 style="font-size: 44px; margin-bottom: 25px; font-weight: 700; background: linear-gradient(45deg, #ff6b6b, #feca57); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <p style="font-size: 22px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 300;">
            Celebrating another beautiful year of love, laughter, and unforgettable memories together.
          </p>
          <div style="background: linear-gradient(45deg, rgba(255,107,107,0.1), rgba(254,202,87,0.1)); padding: 30px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 20px; font-style: italic; color: #5a6c7d; line-height: 1.7;">[Message]</p>
          </div>
          <div style="margin-top: 35px; font-size: 24px; color: #ff6b6b;">🌹 💖 ✨</div>
        </div>
      </div>
    `,
    description: 'Romantic sunset theme with elegant typography',
    design: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      textColor: '#2c3e50',
      fontFamily: 'Dancing Script, cursive'
    },
    usageCount: 76
  },
  {
    id: 'anniversary-2',
    name: 'Classic Romance',
    category: 'Anniversary',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Crimson Text', Georgia, serif;">
        <div style="background: rgba(255,255,255,0.97); padding: 40px; border-radius: 15px; color: #2c3e50; border: 2px solid rgba(102,126,234,0.3);">
          <div style="font-size: 48px; margin-bottom: 20px;">💐</div>
          <h1 style="font-size: 34px; margin-bottom: 15px; font-weight: 400; color: #2c3e50; letter-spacing: 1px;">Anniversary Wishes</h1>
          <h2 style="font-size: 40px; margin-bottom: 25px; font-weight: 700; background: linear-gradient(45deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <div style="width: 80px; height: 1px; background: linear-gradient(45deg, #667eea, #764ba2); margin: 25px auto;"></div>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 300; font-style: italic;">
            "Love is not about how many days, months, or years you have been together. It's about how much you love each other every single day."
          </p>
          <div style="background: linear-gradient(45deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08)); padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #667eea;">💝 🌹 💫</div>
        </div>
      </div>
    `,
    description: 'Classic romantic design with elegant quotes',
    design: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#2c3e50',
      fontFamily: 'Crimson Text, Georgia, serif'
    },
    usageCount: 94
  },

  // Event Invitation Templates
  {
    id: 'event-invitation-1',
    name: 'Corporate Excellence',
    category: 'Event Invitation',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Montserrat', Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.97); padding: 40px; border-radius: 15px; color: #1e3c72;">
          <div style="width: 100px; height: 100px; background: linear-gradient(45deg, #1e3c72, #2a5298); border-radius: 20px; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; transform: rotate(45deg);"><div style="transform: rotate(-45deg);">🎯</div></div>
          <h1 style="font-size: 32px; margin-bottom: 20px; font-weight: 600; color: #1e3c72; letter-spacing: 1px;">You're Invited</h1>
          <h2 style="font-size: 40px; margin-bottom: 25px; font-weight: 800; background: linear-gradient(45deg, #1e3c72, #2a5298); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <div style="width: 80px; height: 2px; background: linear-gradient(45deg, #1e3c72, #2a5298); margin: 25px auto;"></div>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 400;">
            Join us for an exceptional evening as we celebrate our company milestone and achievements.
          </p>
          <div style="background: linear-gradient(45deg, rgba(30,60,114,0.1), rgba(42,82,152,0.1)); padding: 30px; border-radius: 15px; margin-top: 30px; border: 1px solid rgba(30,60,114,0.2);">
            <p style="font-size: 18px; color: #5a6c7d; line-height: 1.7; margin-bottom: 15px;">[Message]</p>
            <div style="background: rgba(30,60,114,0.1); padding: 15px; border-radius: 8px;">
              <p style="color: #1e3c72; font-weight: 600; font-size: 16px;">Event Details Inside</p>
            </div>
          </div>
          <div style="margin-top: 35px; font-size: 20px; color: #1e3c72;">🏆 🥂 ⭐</div>
        </div>
      </div>
    `,
    description: 'Professional corporate event invitation',
    design: {
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      textColor: '#1e3c72',
      fontFamily: 'Montserrat, Arial, sans-serif'
    },
    usageCount: 156
  },
  {
    id: 'event-invitation-2',
    name: 'Creative Celebration',
    category: 'Event Invitation',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Poppins', Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.95); padding: 40px; border-radius: 15px; color: #2d3436;">
          <div style="display: flex; justify-content: center; margin-bottom: 25px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #ff9a9e, #fecfef); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 5px; animation: bounce 2s infinite;">🎨</div>
            <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #fecfef, #ff9a9e); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 5px; animation: bounce 2s infinite 0.5s;">🎭</div>
            <div style="width: 60px; height: 60px; background: linear-gradient(45deg, #ff9a9e, #fecfef); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 5px; animation: bounce 2s infinite 1s;">🎪</div>
          </div>
          <h1 style="font-size: 34px; margin-bottom: 15px; font-weight: 600; color: #2d3436;">Special Invitation</h1>
          <h2 style="font-size: 42px; margin-bottom: 25px; font-weight: 800; background: linear-gradient(45deg, #ff9a9e, #fecfef); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">[Name]</h2>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #636e72; font-weight: 400;">
            You're invited to join us for a creative celebration filled with inspiration, innovation, and unforgettable moments.
          </p>
          <div style="background: linear-gradient(45deg, rgba(255,154,158,0.1), rgba(254,207,239,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 18px; font-style: italic; color: #636e72; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #ff9a9e;">🎉 🌟 🎈</div>
        </div>
      </div>
    `,
    description: 'Creative and artistic celebration invitation',
    design: {
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      textColor: '#2d3436',
      fontFamily: 'Poppins, Arial, sans-serif'
    },
    usageCount: 112
  },

  // Greeting Templates
  {
    id: 'greeting-1',
    name: 'Warm Professional',
    category: 'Greeting',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Source Sans Pro', Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.96); padding: 35px; border-radius: 15px; color: #2c3e50;">
          <div style="width: 80px; height: 80px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;">👋</div>
          <h1 style="font-size: 36px; margin-bottom: 20px; font-weight: 300; color: #2c3e50;">Hello [Name]!</h1>
          <div style="width: 60px; height: 2px; background: linear-gradient(45deg, #667eea, #764ba2); margin: 25px auto;"></div>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #34495e; font-weight: 400;">
            Sending you warm wishes and positive thoughts your way. Hope you're having a wonderful day!
          </p>
          <div style="background: linear-gradient(45deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 18px; font-style: italic; color: #5a6c7d; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #667eea;">🌿 💚 🌱</div>
        </div>
      </div>
    `,
    description: 'Professional yet warm greeting design',
    design: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#2c3e50',
      fontFamily: 'Source Sans Pro, Arial, sans-serif'
    },
    usageCount: 234
  },
  {
    id: 'greeting-2',
    name: 'Friendly Connect',
    category: 'Greeting',
    ageGroup: 'Adults (18+)',
    content: `
      <div style="background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%); padding: 40px; border-radius: 20px; text-align: center; color: white; font-family: 'Open Sans', Arial, sans-serif;">
        <div style="background: rgba(255,255,255,0.95); padding: 35px; border-radius: 15px; color: #2d5016;">
          <div style="display: flex; justify-content: center; margin-bottom: 25px;">
            <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #56ab2f, #a8e6cf); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 3px;">🤝</div>
            <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #a8e6cf, #56ab2f); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 3px;">💬</div>
            <div style="width: 50px; height: 50px; background: linear-gradient(45deg, #56ab2f, #a8e6cf); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 3px;">✨</div>
          </div>
          <h1 style="font-size: 34px; margin-bottom: 20px; font-weight: 600; color: #2d5016;">Greetings [Name]!</h1>
          <p style="font-size: 20px; line-height: 1.8; margin-bottom: 30px; color: #4a5d23; font-weight: 400;">
            Just wanted to reach out and connect with you. Hope you're doing amazing and that great things are coming your way!
          </p>
          <div style="background: linear-gradient(45deg, rgba(86,171,47,0.1), rgba(168,230,207,0.1)); padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="font-size: 18px; font-style: italic; color: #5a6c23; line-height: 1.6;">[Message]</p>
          </div>
          <div style="margin-top: 30px; font-size: 20px; color: #56ab2f;">🌟 💫 🌈</div>
        </div>
      </div>
    `,
    description: 'Friendly connection with modern elements',
    design: {
      background: 'linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%)',
      textColor: '#2d5016',
      fontFamily: 'Open Sans, Arial, sans-serif'
    },
    usageCount: 187
  }
];