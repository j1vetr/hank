export interface PartnerProfile {
  id: string;
  couponId: string;
  username: string;
  code: string;
  name: string;
  commissionType: string | null;
  commissionValue: string | null;
}

export interface PartnerWithdrawal {
  id: string;
  couponId: string;
  amount: string;
  status: "pending" | "paid" | "rejected";
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface PartnerSale {
  id: string;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  code: string;
  total: string;
  status: string;
  paymentStatus: string;
  commission: string;
  commissionEstimated: boolean;
  items: Array<{ productName: string; productImage: string | null; variantDetails: string | null; quantity: number }>;
}

export interface PartnerDashboard {
  profile: PartnerProfile;
  summary: {
    orderCount: number;
    revenue: string;
    commissionEarned: string;
    availableBalance: string;
    reservedBalance: string;
    paidTotal: string;
  };
  monthly: Array<{ month: string; count: number; revenue: string; commission: string }>;
  topProducts: Array<{ name: string; quantity: number }>;
  sales: PartnerSale[];
  totalSales: number;
  page: number;
  withdrawals: PartnerWithdrawal[];
  payments: Array<{ id: string; amount: string; paidAt: string; note: string | null }>;
}

export interface PartnerAdminData {
  accounts: Array<{
    id: string;
    couponId: string;
    username: string;
    enabled: boolean;
    resetRequired: boolean;
    createdAt: string;
  }>;
  withdrawals: Array<PartnerWithdrawal & { code: string; name: string }>;
}
