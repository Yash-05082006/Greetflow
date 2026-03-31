export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: 'Lead' | 'Client' | 'User';
  dateOfBirth: Date;
  anniversaryDate?: Date;
  preferences?: string[];
}

export interface Template {
  id: string;
  name: string;
  category: 'Birthday' | 'Anniversary' | 'Event Invitation' | 'Greeting';
  ageGroup: 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)';
  content: string;
  description: string;
  design: {
    background: string;
    textColor: string;
    fontFamily: string;
  };
  usageCount: number;
}

export interface Event {
  id: string;
  user: User;
  type: 'birthday' | 'anniversary';
  date: Date;
}

export interface EmailLog {
  id: string;
  userId: string;
  templateId: string;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
}