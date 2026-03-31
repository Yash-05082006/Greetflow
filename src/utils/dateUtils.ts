export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

export const isThisWeek = (date: Date): boolean => {
  const today = new Date();
  const weekFromNow = new Date();
  weekFromNow.setDate(today.getDate() + 7);
  
  return date >= today && date <= weekFromNow;
};

export const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getAgeGroup = (birthDate: Date): 'Children (8-15)' | 'Teens (15-18)' | 'Adults (18+)' => {
  const age = calculateAge(birthDate);
  
  if (age >= 8 && age <= 15) return 'Children (8-15)';
  if (age >= 15 && age <= 18) return 'Teens (15-18)';
  return 'Adults (18+)';
};