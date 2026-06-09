export type TranslateTextInput = {
  Text: string;
  SourceLanguageCode: string;
  TargetLanguageCode: string;
  TerminologyNames?: string[];
  Settings?: {
    Formality?: 'FORMAL' | 'INFORMAL';
    Profanity?: 'MASK' | 'NONE';
  };
};

export type TranslateTextOutput = {
  TranslatedText?: string;
  SourceLanguageCode?: string;
  TargetLanguageCode?: string;
  AppliedTerminologies?: unknown[];
  AppliedSettings?: unknown;
};

export type ImportTerminologyInput = {
  Name: string;
  MergeStrategy?: 'OVERWRITE';
  Description?: string;
  TerminologyData: {
    File: Buffer | Uint8Array;
    Format?: 'CSV' | 'TSV' | 'TMX';
  };
  EncryptionKey?: {
    Type: 'KMS';
    Id: string;
  };
};

export type ImportTerminologyOutput = {
  TerminologyProperties?: {
    Name?: string;
    Arn?: string;
    Description?: string;
  };
};
