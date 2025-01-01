export interface ICheck {
  _id?: string;
  checkId: string;
  debtorId: string;
  number: string;
  status: string;
  basicVerification: string;
  fundsConfirmation: string;
  bvReason: string;
  fcReason: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
