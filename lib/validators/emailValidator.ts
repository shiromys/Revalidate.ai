export interface MXValidationResult {
  mxValid: boolean;
  mxRecords: string[];
}

export function parseMXResult(rawResult: Partial<MXValidationResult> | null | undefined): MXValidationResult {
  return {
    // Fail closed: Default to false on missing or nullish evaluation
    mxValid: rawResult?.mxValid ?? false,
    mxRecords: Array.isArray(rawResult?.mxRecords) ? rawResult.mxRecords : [],
  };
}