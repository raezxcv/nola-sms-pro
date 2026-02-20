export interface SmsStats {
  totalSent: number;
  delivered: number;
  failed: number;
  lastSentAt: string;
}