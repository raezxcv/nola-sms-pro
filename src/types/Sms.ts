export interface SmsStats {
  totalSent: number;
  delivered: number;
  failed: number;
  lastSentAt: string;
}

export interface BulkMessageHistoryItem {
  id: string;
  message: string;
  recipientCount: number;
  recipientNames?: string[];
  customName?: string;
  timestamp: string;
  status: 'sent' | 'partial' | 'failed';
}