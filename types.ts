export enum UserTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountValue: string;
  expiryDate?: string;
}

// Mirrors the typical Bubble.io 'User' or 'Company' data type structure
export interface Company {
  _id: string; // Bubble Data API uses _id
  Name: string;
  Description: string;
  Logo?: string; // URL
  Category: string;
  Website?: string;
  Phone?: string;
  Address?: string;
  IsPartner: boolean;
  Coupons?: Coupon[]; // List of coupons (could be a list of texts or related objects in Bubble)
}

export interface BubbleResponse<T> {
  response: {
    results: T[];
    cursor?: number;
    count?: number;
    remaining?: number;
  }
}