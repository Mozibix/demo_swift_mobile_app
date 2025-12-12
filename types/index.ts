export type SellDetails = {
  Sender_s_Name: string;
  Bank_Name: string;
  Date_Time_of_Transfer: string;
  Transaction_Screenshot: string;
};

export type FormField = {
  label: string;
  type: string;
  required: boolean;
};

export type Bank = {
  name: string;
  slug: string;
  code: string;
  nibss_bank_code: string | null;
  country: string;
};

export type Investment = {
  id: number;
  user_id: number;
  asset_name: string;
  asset_symbol: string;
  asset_icon_url: string;
  asset_type: "stock";
  amount_invested: number;
  amount_earned: number;
  change_percentage: number;
  final_change_percentage: number;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export interface AccountDetails {
  account_number: string;
  bank_code: string;
  bank_name: string;
  account_name: string;
}
