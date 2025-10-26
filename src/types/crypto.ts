export interface CryptoDetails {
  tradingPair: string;
  name: string;
  symbol: string;
}

export interface Price {
  symbol: string;
  price: number;
}

export interface Stats {
  symbol: string;
  priceChangePercent: number;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

export interface CryptoState {
  cryptoDetails: Record<string, CryptoDetails>;
  prices: Price[];
  previousPrices: Record<string, number>;
  loading: boolean;
  error: string | null;
  stats: Record<string, Stats>;
}

// Hook return type
export interface UseCryptoData {
  cryptoDetails: Record<string, CryptoDetails>;
  prices: Price[];
  previousPrices: Record<string, number>;
  loading: boolean;
  error: string | null;
  stats: Record<string, Stats>;
  refreshPrices: () => Promise<void>;
}