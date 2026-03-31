import { supabase } from '../lib/supabase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  recipientName: string;
  templateId?: string;
  userId: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(emailData: EmailData): Promise<EmailResult> {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async sendBulkEmails(emails: EmailData[]): Promise<{
    successful: number;
    failed: number;
    results: EmailResult[];
  }> {
    const results: EmailResult[] = [];
    let successful = 0;
    let failed = 0;

    // Send emails in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (emailData) => {
        const result = await this.sendEmail(emailData);
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
        return result;
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { successful, failed, results };
  }

  generatePersonalizedMessage(
    templateType: 'birthday' | 'anniversary' | 'greeting' | 'invitation',
    userName: string,
    preferences?: string[],
    customMessage?: string
  ): string {
    if (customMessage) return customMessage;

    const baseMessages = {
      birthday: [
        `Hope your special day is filled with joy and wonderful surprises!`,
        `Wishing you a fantastic birthday celebration and an amazing year ahead!`,
        `May your birthday be as special and wonderful as you are!`
      ],
      anniversary: [
        `Celebrating another beautiful year of love and happiness together!`,
        `Wishing you continued joy and love on your special anniversary!`,
        `May your love story continue to inspire and bring you endless happiness!`
      ],
      greeting: [
        `Hope you're having a wonderful day and that great things are coming your way!`,
        `Sending you positive thoughts and warm wishes!`,
        `Just wanted to reach out and let you know you're appreciated!`
      ],
      invitation: [
        `We would be honored to have you join us for this special celebration!`,
        `Your presence would make our event even more meaningful!`,
        `Looking forward to celebrating with you!`
      ]
    };

    let message = baseMessages[templateType][Math.floor(Math.random() * baseMessages[templateType].length)];

    // Add personalization based on preferences
    if (preferences && preferences.length > 0) {
      const randomPreference = preferences[Math.floor(Math.random() * preferences.length)];
      const personalizedAdditions = {
        birthday: ` Hope you get to enjoy some ${randomPreference} on your special day!`,
        anniversary: ` May your journey together be filled with more ${randomPreference} and endless joy!`,
        greeting: ` Hope you're finding time for ${randomPreference} and all the things you love!`,
        invitation: ` We know how much you enjoy ${randomPreference}, so this event is perfect for you!`
      };
      message += personalizedAdditions[templateType];
    }

    return message;
  }

  generateEmailSubject(
    templateType: 'birthday' | 'anniversary' | 'greeting' | 'invitation',
    userName: string
  ): string {
    const subjects = {
      birthday: [
        `🎉 Happy Birthday ${userName}!`,
        `🎂 Birthday Wishes for ${userName}`,
        `✨ Celebrating You Today, ${userName}!`
      ],
      anniversary: [
        `💕 Happy Anniversary ${userName}!`,
        `🌹 Anniversary Wishes for ${userName}`,
        `💖 Celebrating Your Love, ${userName}!`
      ],
      greeting: [
        `👋 Hello ${userName}!`,
        `🌟 Thinking of You, ${userName}`,
        `💚 Warm Wishes for ${userName}`
      ],
      invitation: [
        `🎊 You're Invited, ${userName}!`,
        `✨ Special Invitation for ${userName}`,
        `🎉 Join Us, ${userName}!`
      ]
    };

    return subjects[templateType][Math.floor(Math.random() * subjects[templateType].length)];
  }
}

export const emailService = EmailService.getInstance();