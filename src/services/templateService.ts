import { supabase } from '../lib/supabase';
import { Template } from '../types';

export interface AITemplateRequest {
  prompt: string;
  category: 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting';
  ageGroup: 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)';
}

export class TemplateService {
  private static instance: TemplateService;
  
  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  async generateAITemplate(request: AITemplateRequest): Promise<Template> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-template', {
        body: request
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate template');
      }

      // Create the template object
      const template: Omit<Template, 'id' | 'usageCount'> = {
        name: data.template.name,
        category: request.category,
        ageGroup: request.ageGroup,
        content: data.template.content,
        description: data.template.description,
        design: data.template.design
      };

      return {
        ...template,
        id: `ai-${Date.now()}`,
        usageCount: 0
      };
    } catch (error) {
      console.error('AI template generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate template');
    }
  }

  processTemplate(
    template: Template,
    recipientName: string,
    customMessage?: string,
    preferences?: string[]
  ): string {
    let processedContent = template.content;
    
    // Replace name placeholder
    processedContent = processedContent.replace(/\[Name\]/g, recipientName);
    
    // Replace message placeholder
    if (customMessage) {
      processedContent = processedContent.replace(/\[Message\]/g, customMessage);
    } else {
      // Generate personalized message based on template category and user preferences
      const personalizedMessage = this.generatePersonalizedMessage(
        template.category,
        preferences
      );
      processedContent = processedContent.replace(/\[Message\]/g, personalizedMessage);
    }

    return processedContent;
  }

  private generatePersonalizedMessage(
    category: string,
    preferences?: string[]
  ): string {
    const baseMessages = {
      'Birthday': [
        'Hope your special day is filled with joy and wonderful surprises!',
        'Wishing you a fantastic birthday celebration and an amazing year ahead!',
        'May your birthday be as special and wonderful as you are!'
      ],
      'Anniversary': [
        'Celebrating another beautiful year of love and happiness together!',
        'Wishing you continued joy and love on your special anniversary!',
        'May your love story continue to inspire and bring you endless happiness!'
      ],
      'Greeting': [
        'Hope you\'re having a wonderful day and that great things are coming your way!',
        'Sending you positive thoughts and warm wishes!',
        'Just wanted to reach out and let you know you\'re appreciated!'
      ],
      'Event Invitation': [
        'We would be honored to have you join us for this special celebration!',
        'Your presence would make our event even more meaningful!',
        'Looking forward to celebrating with you!'
      ]
    };

    let message = baseMessages[category as keyof typeof baseMessages]?.[0] || 'Hope you have a wonderful day!';

    // Add personalization based on preferences
    if (preferences && preferences.length > 0) {
      const randomPreference = preferences[Math.floor(Math.random() * preferences.length)];
      const personalizedAdditions = {
        'Birthday': ` Hope you get to enjoy some ${randomPreference} on your special day!`,
        'Anniversary': ` May your journey together be filled with more ${randomPreference} and endless joy!`,
        'Greeting': ` Hope you're finding time for ${randomPreference} and all the things you love!`,
        'Event Invitation': ` We know how much you enjoy ${randomPreference}, so this event is perfect for you!`
      };
      message += personalizedAdditions[category as keyof typeof personalizedAdditions] || '';
    }

    return message;
  }
}

export const templateService = TemplateService.getInstance();