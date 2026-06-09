export type SendEmailInput = {
  Source: string;
  Destination: {
    ToAddresses?: string[];
    CcAddresses?: string[];
    BccAddresses?: string[];
  };
  Message: {
    Subject: { Data: string; Charset?: string };
    Body: {
      Text?: { Data: string; Charset?: string };
      Html?: { Data: string; Charset?: string };
    };
  };
  ReplyToAddresses?: string[];
  ReturnPath?: string;
};

export type SendEmailOutput = {
  MessageId?: string;
};
