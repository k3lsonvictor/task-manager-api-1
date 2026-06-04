export type SendPasswordResetEmailJob = {
  email: string;
  name: string;
  code: string;
  expiresAt: Date;
};
