/**
 * Pi Network SDK Mock Service
 * Simulates interactions with the Pi Browser environment.
 */

// Simulates the Pay-to-Load protocol
export const requestPiPayment = async (amount: number, memo: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // In production: Pi.createPayment(...)
    console.log(`[Pi SDK] Requesting payment: ${amount} Pi for ${memo}`);
    setTimeout(() => {
      // 90% success rate simulation
      if (Math.random() > 0.1) {
        resolve(`payment-tx-${Date.now()}`);
      } else {
        reject(new Error("User cancelled payment"));
      }
    }, 1500);
  });
};

// Simulates Pi Ads (Interstitial)
export const showPiAd = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('[Pi Ads] Requesting Interstitial Ad...');
    // In production: Pi.Ads.showAd("interstitial")
    setTimeout(() => {
      console.log('[Pi Ads] Ad Completed');
      resolve(true);
    }, 2000);
  });
};

// Mock KYC Check
export const checkKycStatus = async (username: string): Promise<boolean> => {
  // In production: server-side check against Pi APIs
  return true; 
};