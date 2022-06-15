/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'

export default async function getAWSData(
  ): Promise<any[]> {
  
	return csv().fromFile("C:\\Users\\alber\\repositories\\school\\cloud-carbon-footprint\\packages\\prediction\\input\\instancetypes.csv");
  }