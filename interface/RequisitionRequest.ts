export interface RequisitionRequest {
  redirect: string;
  // Relevant ones include REVOLUT_REVOLT21, UNICREDIT_UNCRBGSF, DSKBANK_STSABGSFXXX, FIBANK_FINVBGSF,
  institutionId: string;
  reference: string;
  agreement: string;
  userLanguage: string;
}
