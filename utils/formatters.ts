/**
 * Format a number as currency with commas as thousand separators
 */
export const formatCurrency = (value: number): string => {
  return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
};

/**
 * Format a date string in local format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

/**
 * Format a number with commas as thousand separators
 */
export const formatNumber = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function formatcalculateTimeRemaining(startDateString: string, endDateString: string): {
  timeRemaining: string;
  percentageComplete: number;
} {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const now = new Date();

  // Calculate durations
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = now.getTime() - startDate.getTime();
  const remainingDuration = endDate.getTime() - now.getTime();

  // Handle invalid or completed dates
  if (totalDuration <= 0) {
    return {
      timeRemaining: "Completed",
      percentageComplete: 100
    };
  }

  if (remainingDuration <= 0) {
    return {
      timeRemaining: "Completed",
      percentageComplete: 100
    };
  }

  // Calculate percentage (clamped between 0-100)
  const percentageComplete = Math.min(100, Math.max(0, 
    (elapsedDuration / totalDuration) * 100
  ));

  // Calculate time remaining (same as previous function)
  const days = Math.floor(remainingDuration / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  let timeRemaining: string;
  if (years > 0) {
    timeRemaining = `${years} ${years === 1 ? 'year' : 'years'} remaining`;
  } else if (months > 0) {
    timeRemaining = `${months} ${months === 1 ? 'month' : 'months'} remaining`;
  } else if (weeks > 1) {
    timeRemaining = `${weeks} weeks remaining`;
  } else if (days > 0) {
    timeRemaining = `${days} ${days === 1 ? 'day' : 'days'} remaining`;
  } else {
    const hours = Math.floor(remainingDuration / (1000 * 60 * 60));
    timeRemaining = `${hours} ${hours === 1 ? 'hour' : 'hours'} remaining`;
  }

  return {
    timeRemaining,
    percentageComplete: parseFloat(percentageComplete.toFixed(2))
  };
}

export function formatPastDate(inputDate: string | Date): string {
  const date = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Future dates (just show full date)
  if (seconds < 0) {
    return formatAbsoluteDate(date);
  }

  // Within last minute
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  }

  const minutes = Math.floor(seconds / 60);
  // Within last hour
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  // Today
  if (date.toDateString() === now.toDateString()) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  // Within last week
  if (days < 7) {
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  // Older than a week - show full date
  return formatAbsoluteDate(date);
}

function formatAbsoluteDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
}

export function percentagePrice(Amount:number, percentage:number):number{
  return (percentage*Amount)/100
 }