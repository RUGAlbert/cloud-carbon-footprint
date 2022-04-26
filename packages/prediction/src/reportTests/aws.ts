import {
  AWS_EMISSIONS_FACTORS_METRIC_TON_PER_KWH,
  AWSAccount,
} from '@cloud-carbon-footprint/aws'

import {
  configLoader,
  EmissionRatioResult,
  EstimationResult,
  GroupBy,
  LookupTableInput,
  LookupTableOutput,
  OnPremiseDataInput,
  OnPremiseDataOutput,
  RecommendationResult,
  reduceByTimestamp,
} from '@cloud-carbon-footprint/common'

export function main() {
  let inputData: LookupTableInput[] = [
    {
      serviceName: 'EC2',
      region: 'Texas',
      usageType: 'USW2-BoxUsage:m2.2xlarge',
      usageUnit: 'vCPU-Hours',
      vCpus: '100',
      machineType: 'Intel(R) Xeon(R) Silver 4114 CPU @ 2.20GHz',
    },
  ]

  let res = AWSAccount.getCostAndUsageReportsDataFromInputData(inputData)
  console.log(res)
}
