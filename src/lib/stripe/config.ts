export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export const stripeConfig = {
  currency: "eur",
  billingAddressCollection: "auto",
} as const;
