import React, { useState } from 'react';
import { X, Wand2, Sparkles, Loader2, CheckCircle, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import { apiClient } from '../services/apiClient';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface UploadedTemplateRecord {
  id: string;
  display_name: string;
  storage_path: string;
  image_url: string;
  template_type: 'uploaded' | 'ai_generated';
  created_at: string;
}

interface AITemplateGeneratorProps {
  onClose: () => void;
  onGenerated: (record: UploadedTemplateRecord) => void;
}

type Category = 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting';
type AgeGroup = 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)';

type GeneratingStep = 'idle' | 'crafting' | 'generating' | 'saving' | 'done';

// ────────────────────────────────────────────────────────────
// Prompt suggestions — detailed, structured, professional
// ────────────────────────────────────────────────────────────
const promptSuggestions: Record<Category, { title: string; full: string }[]> = {
  Birthday: [
    {
      title: 'Tropical Adventure Birthday',
      full: 'Design a vibrant birthday card with a tropical theme featuring lush palm trees, colorful exotic flowers, and golden sunset hues. Include playful balloon illustrations and confetti scattered across the design. The typography should be bold and festive with a warm orange-to-pink gradient headline. Perfect for someone who loves travel, nature, and adventure.'
    },
    {
      title: 'Elegant Minimalist Birthday',
      full: 'Create a sophisticated, minimalist birthday card with a deep navy blue background and subtle gold foil-effect accents. Feature refined geometric patterns, a single elegant floral arrangement in soft blush tones, and premium serif typography. The overall aesthetic should feel like a luxury printed invitation — restrained, elegant, and deeply personal.'
    },
    {
      title: 'Galaxy & Stars Birthday',
      full: 'Design a breathtaking birthday card set in deep space with a rich purple-to-midnight-blue gradient background filled with twinkling stars, nebula clouds, and soft aurora effects. Include a bold, glowing headline and fun cosmic elements like planets and shooting stars. Perfect for someone fascinated by the universe and astronomy.'
    },
    {
      title: 'Retro Celebration Birthday',
      full: 'Create a groovy retro-style birthday card inspired by the 1970s with warm earth tones — mustard yellow, terracotta, and olive green. Use bold vintage typography with retro sunburst patterns, geometric shapes, and funky floral motifs. The vibe should be fun, nostalgic, and celebratory with a modern twist.'
    }
  ],
  Anniversary: [
    {
      title: 'Romantic Rose Garden',
      full: 'Design a deeply romantic anniversary card featuring an abundance of soft-pink and deep-red roses with lush green foliage creating a garden atmosphere. Use a warm golden-hour lighting effect with soft bokeh in the background. Include elegant calligraphy-style typography and delicate heart motifs. The mood should feel intimate, timeless, and genuinely heartfelt.'
    },
    {
      title: 'Golden Years Milestone',
      full: 'Create a luxurious anniversary card celebrating a golden milestone (25th or 50th). Use a rich gold and champagne color palette with subtle metallic sheen effects. Feature elegant champagne flute illustrations, scattered rose petals, and premium serif typography. The design should feel celebratory, prestigious, and deeply meaningful.'
    },
    {
      title: 'Watercolor Love Story',
      full: 'Design a tender anniversary card with a flowing watercolor art style. Use soft washes of lavender, dusty rose, and sage green blending naturally across the background. Include illustrated silhouettes of a couple walking together, watercolor florals, and handwritten-style typography. The overall feeling should be poetic, gentle, and beautifully personal.'
    },
    {
      title: 'Modern Geometric Love',
      full: 'Create a contemporary anniversary card using bold geometric patterns with interlocking shapes that symbolize connection and partnership. Use a rich jewel-tone palette — deep teal, burgundy, and gold. Feature clean, modern typography and a striking central composition. The design should feel confident, modern, and beautifully crafted.'
    }
  ],
  'Event Invitation': [
    {
      title: 'Corporate Networking Gala',
      full: 'Design a sophisticated corporate event invitation card with a deep charcoal and midnight blue color scheme. Feature subtle circuit-board patterns as a nod to technology, with gold accents for elegance. Include space for event name, date, and venue details laid out in a clean, hierarchical format using premium sans-serif typography. The design should project confidence, professionalism, and exclusivity.'
    },
    {
      title: 'Outdoor Garden Party',
      full: 'Create a fresh, charming invitation for an outdoor garden party. Use a soft white and botanical green palette with hand-illustrated wildflowers, herbs, and ivy winding around the borders. Feature light, airy typography with a playful yet refined feel. The design should evoke a warm summer afternoon with breezy, optimistic energy that makes guests excited to attend.'
    },
    {
      title: 'Charity Fundraising Gala',
      full: 'Design a compelling invitation for a high-end charity fundraising gala. Use a classic black-tie aesthetic with a deep black background and elegant gold typography. Include subtle illustrations representing the cause (like hands holding, a globe, or community symbols). The design should feel prestigious, warm-hearted, and persuasive — inspiring guests to attend and contribute.'
    },
    {
      title: 'Tech Product Launch Event',
      full: 'Create a dynamic product launch event invitation with a cutting-edge design aesthetic. Use dark backgrounds with electric blue and neon accent colors to suggest innovation and energy. Include abstract geometric tech visuals, bold display typography, and a sense of anticipation and excitement. The design should feel like the event is unmissable and at the forefront of something groundbreaking.'
    }
  ],
  Greeting: [
    {
      title: 'Warm Welcome New Client',
      full: 'Design a professional yet warm greeting card to welcome a new client or business partner. Use a clean, elegant layout with a soft cream and navy palette. Feature subtle hand-drawn flourishes, a friendly but formal tone, and premium typography. The card should strike the perfect balance between professional confidence and genuine human warmth — making the recipient feel valued and excited for the partnership ahead.'
    },
    {
      title: 'Heartfelt Thank You',
      full: 'Create a sincere and beautifully designed thank-you card that feels genuinely meaningful rather than generic. Use warm gold, amber, and cream tones with botanical watercolor accents. Include handwritten-style script typography for the main message and clean serif fonts for supporting text. The design should radiate authenticity, gratitude, and warmth that the recipient will want to keep.'
    },
    {
      title: 'Festive Seasonal Wishes',
      full: 'Design a universally appealing seasonal greeting card suitable for sending to diverse business clients. Use a rich, festive color palette of deep burgundy, forest green, and warm gold. Include elegant botanical holly, pinecone, and ribbon motifs without religious iconography. Feature a warm, inclusive message in sophisticated typography. The card should feel premium, tasteful, and appropriate for professional relationships.'
    },
    {
      title: 'Motivational Team Appreciation',
      full: 'Create an energetic and uplifting greeting card to appreciate and motivate a team or group of colleagues. Use bold, dynamic colors — vibrant orange, energetic yellow, and confident navy. Include ascending arrow motifs, star elements, and typography that feels like a rallying cry. The overall design should feel empowering, enthusiastic, and make every recipient feel genuinely recognized for their contributions.'
    }
  ]
};

// ────────────────────────────────────────────────────────────
// Step labels for the generating animation
// ────────────────────────────────────────────────────────────
const STEP_MESSAGES: Record<GeneratingStep, string> = {
  idle: '',
  crafting: 'Crafting your prompt with AI intelligence...',
  generating: 'Generating your unique greeting card image...',
  saving: 'Compositing logo & saving to library...',
  done: 'Template ready!'
};

// ────────────────────────────────────────────────────────────
// PromptSuggestionCard — collapsible with "Read More"
// ────────────────────────────────────────────────────────────
const PromptSuggestionCard: React.FC<{
  suggestion: { title: string; full: string };
  onSelect: (text: string) => void;
}> = ({ suggestion, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const SHORT_LIMIT = 120;
  const isLong = suggestion.full.length > SHORT_LIMIT;
  const displayText = expanded || !isLong
    ? suggestion.full
    : suggestion.full.slice(0, SHORT_LIMIT) + '...';

  return (
    <div
      className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-400 rounded-xl p-4 transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect(suggestion.full)}
    >
      <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">{suggestion.title}</p>
      <p className="text-sm text-gray-700 leading-relaxed">{displayText}</p>
      {isLong && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          className="mt-2 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold transition-colors"
        >
          {expanded ? <><ChevronUp className="h-3 w-3" /> Show Less</> : <><ChevronDown className="h-3 w-3" /> Read More...</>}
        </button>
      )}
      <p className="text-xs text-purple-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
        Click to use this prompt →
      </p>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
const AITemplateGenerator: React.FC<AITemplateGeneratorProps> = ({ onClose, onGenerated }) => {
  const [category, setCategory] = useState<Category>('Birthday');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('Adults (18+)');
  const [prompt, setPrompt] = useState('');
  const [templateName, setTemplateName] = useState('');

  const [generatingStep, setGeneratingStep] = useState<GeneratingStep>('idle');
  const [generatedRecord, setGeneratedRecord] = useState<UploadedTemplateRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGenerating = generatingStep !== 'idle' && generatingStep !== 'done';

  // Animate through steps while waiting for API
  const animateSteps = async (): Promise<void> => {
    setGeneratingStep('crafting');
    await new Promise(r => setTimeout(r, 1200));
    setGeneratingStep('generating');
    // 'saving' switched will be triggered after API responds
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setGeneratedRecord(null);

    const stepAnimation = animateSteps();

    try {
      // Let first steps animate while API call begins
      // Frontend timeout — never hang the UI longer than 100 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100_000);

      const [, response] = await Promise.all([
        stepAnimation,
        apiClient.post<UploadedTemplateRecord>('/api/uploaded-templates/generate', {
          prompt: prompt.trim(),
          category,
          ageGroup,
          name: templateName.trim() || `AI ${category} — ${new Date().toLocaleDateString()}`
        }).finally(() => clearTimeout(timeoutId))
      ]);

      setGeneratingStep('saving');
      await new Promise(r => setTimeout(r, 800));

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Generation failed. Please try again.');
      }

      setGeneratedRecord(response.data);
      setGeneratingStep('done');
    } catch (err: any) {
      const msg = err.name === 'AbortError'
        ? 'Generation timed out. Please try a simpler prompt or try again later.'
        : (err.message || 'Generation failed. Please try again.');
      setError(msg);
      setGeneratingStep('idle');
    }
  };

  const handleSaveAndClose = () => {
    if (generatedRecord) {
      onGenerated(generatedRecord);
    }
  };

  const handleGenerateAnother = () => {
    setGeneratedRecord(null);
    setGeneratingStep('idle');
    setError(null);
    setTemplateName('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-6 text-white rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">AI Template Generator</h3>
                <p className="text-purple-100 text-sm mt-0.5">Powered by Google Gemini · Beam Welly branded</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-8">

          {/* ════════════════════════════════════════════════
              VIEW A: Form (idle state)
          ════════════════════════════════════════════════ */}
          {generatingStep === 'idle' && !generatedRecord && (
            <div className="space-y-8">

              {/* Category + Age Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Template Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as Category)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 focus:bg-white"
                  >
                    <option value="Birthday">🎂 Birthday</option>
                    <option value="Anniversary">💍 Anniversary</option>
                    <option value="Event Invitation">🎪 Event Invitation</option>
                    <option value="Greeting">👋 Greeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Target Age Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ageGroup}
                    onChange={e => setAgeGroup(e.target.value as AgeGroup)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 focus:bg-white"
                  >
                    <option value="Children (8-15)">🧒 Children (8–15)</option>
                    <option value="Teens (15-18)">🧑 Teens (15–18)</option>
                    <option value="Adults (18+)">👔 Adults (18+)</option>
                  </select>
                </div>
              </div>

              {/* Template name (optional) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Template Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 focus:bg-white"
                  placeholder={`AI ${category} Template`}
                  maxLength={80}
                />
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Describe Your Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50 focus:bg-white resize-none"
                  placeholder="Describe the greeting card in detail — theme, colors, mood, style, any special elements..."
                />
                <div className="flex justify-between mt-1.5">
                  <p className="text-xs text-gray-500">
                    💡 More detail = better results. Describe colors, mood, style, and any special elements.
                  </p>
                  <span className={`text-xs font-medium ${prompt.length > 800 ? 'text-red-500' : 'text-gray-400'}`}>
                    {prompt.length}/1000
                  </span>
                </div>
              </div>

              {/* Prompt Suggestions */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Suggested Prompts for {category}
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promptSuggestions[category].map((s, i) => (
                    <PromptSuggestionCard
                      key={i}
                      suggestion={s}
                      onSelect={text => setPrompt(text)}
                    />
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  <strong>Generation failed:</strong> {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    prompt.trim()
                      ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="h-5 w-5" />
                  Generate Template
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              VIEW B: Generating animation
          ════════════════════════════════════════════════ */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-24 space-y-8">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-300">
                  <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
                <div className="absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 animate-ping opacity-20" />
              </div>

              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold text-gray-900">
                  {STEP_MESSAGES[generatingStep]}
                </h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Gemini is creating your bespoke greeting card. This takes 15–30 seconds.
                </p>
              </div>

              {/* Step progress indicators */}
              <div className="flex items-center gap-3 mt-4">
                {(['crafting', 'generating', 'saving'] as GeneratingStep[]).map((step, i) => {
                  const steps: GeneratingStep[] = ['crafting', 'generating', 'saving'];
                  const currentIdx = steps.indexOf(generatingStep);
                  const isDone = i < currentIdx;
                  const isActive = step === generatingStep;
                  return (
                    <React.Fragment key={step}>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                        isActive ? 'bg-purple-600 text-white shadow-md' :
                        isDone ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? <CheckCircle className="h-3 w-3" /> : null}
                        {step === 'crafting' ? 'Crafting Prompt' : step === 'generating' ? 'Generating' : 'Saving'}
                      </div>
                      {i < 2 && <div className={`w-6 h-0.5 ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              VIEW C: Success — preview the generated image
          ════════════════════════════════════════════════ */}
          {generatingStep === 'done' && generatedRecord && (
            <div className="space-y-8">
              {/* Success banner */}
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-800">Template Generated Successfully!</h4>
                  <p className="text-sm text-emerald-600">Your AI-crafted greeting card with Beam Welly branding is ready.</p>
                </div>
              </div>

              {/* Image preview */}
              <div className="bg-gray-50 rounded-2xl p-4 border-2 border-dashed border-gray-200">
                <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" /> Preview
                </h4>
                <div className="bg-white rounded-xl overflow-hidden shadow-lg flex items-center justify-center min-h-64">
                  <img
                    src={generatedRecord.image_url}
                    alt={generatedRecord.display_name}
                    className="max-w-full max-h-[480px] object-contain"
                  />
                </div>
              </div>

              {/* Template details */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Name</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{generatedRecord.display_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Category</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Age Group</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{ageGroup}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Type</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                    <Sparkles className="h-3 w-3" /> AI Generated
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleGenerateAnother}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleSaveAndClose}
                  className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold"
                >
                  <CheckCircle className="h-5 w-5" />
                  Save to Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITemplateGenerator;