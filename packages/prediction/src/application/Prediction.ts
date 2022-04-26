/*
 * © 2021 Thoughtworks, Inc.
 */

import { ComputeEstimator, MemoryEstimator } from '@cloud-carbon-footprint/core'
import {
  Logger,
  OnPremiseDataInput,
  OnPremiseDataOutput,
} from '@cloud-carbon-footprint/common'

import { ON_PREMISE_CLOUD_CONSTANTS } from '@cloud-carbon-footprint/on-premise'
import { OnPremiseDataReport }  from '@cloud-carbon-footprint/on-premise'

export default class Prediction {
  private logger: Logger
  constructor() {
    this.logger = new Logger('Prediction')
  }

  static getPredictionDataFromInputData(
    inputData: OnPremiseDataInput[],
  ): OnPremiseDataOutput[] {
    const onPremiseDataReport = new OnPremiseDataReport(
      new ComputeEstimator(),
      new MemoryEstimator(ON_PREMISE_CLOUD_CONSTANTS.MEMORY_COEFFICIENT),
    )
    return onPremiseDataReport.getEstimates(inputData)
  }
}
