export type SendVerificationEmailJob = {
  email: string;
  name: string;
  code: string;
  expiresAt: Date;
};
