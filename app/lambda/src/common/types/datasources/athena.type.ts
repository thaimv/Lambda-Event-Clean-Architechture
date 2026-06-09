export type QueryResultsInput = {
  QueryExecutionId: string;
  MaxResults?: number;
  NextToken?: string;
};

export type QueryResultsOutput = {
  ResultSet?: {
    Rows?: Array<{ Data?: Array<{ VarCharValue?: string }> }>;
  };
  NextToken?: string;
};
