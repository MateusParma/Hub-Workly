
export enum UserTier {
  FREE = 'FREE',
  PRO = 'PRO'
}

export interface Coupon {
  id: string; // Bubble _id
  code: string;
  description: string;
  discountValue: string;
  expiryDate?: string;
  maxUses?: number;
  uses?: number; // Usos atuais vindos do Bubble
  status?: 'active' | 'expired' | 'paused';
}

// Representa a Tabela 'Empresa' do Bubble
export interface Company {
  _id: string; // ID único da tabela Empresa (não do User)
  Name: string;
  Description: string;
  Logo?: string; 
  Category: string;
  Website?: string;
  Phone?: string;
  Address?: string;
  Email?: string; // Pode vir do User vinculado ou da empresa se tiver campo
  IsPartner: boolean;
  Coupons?: Coupon[]; // Lista de cupons da tabela Empresa
  CreatedDate?: string; // Data de criação para ordenação
}

export interface DashboardStats {
  totalPartners: number;
  totalCoupons: number;
  totalRedemptions: number;
  recentPartners: Company[];
  topCategories: { name: string; count: number }[];
}

export interface BubbleResponse<T> {
  response: {
    results: T[];
    cursor?: number;
    count?: number;
    remaining?: number;
  }
}
