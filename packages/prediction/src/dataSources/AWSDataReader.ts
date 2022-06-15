/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'
import path from 'path'

import { App } from '@cloud-carbon-footprint/app'
export async function readAWSData(
  AWSInputFile: string,
): Promise<any[]> {

  const AWSInputData = await csv().fromFile(AWSInputFile)
  return AWSInputData;
}

export default async function getAWSData(
  ): Promise<any[]> {
  
	return readAWSData("C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\input\\instancetypes.csv");
  }