/*
 * © 2021 Thoughtworks, Inc.
 */

export type PredictionOutput = {
  host: string
	localServiceName: string
	awsServiceName: string
	awsKilowattHours: number
	awsCo2e: number
	localKilowattHours: number
	localCo2e: number
  }
