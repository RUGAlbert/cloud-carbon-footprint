/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'
import path from 'path'

import { App } from '@cloud-carbon-footprint/app'
export default async function readBTData(
  btInputFile: string,
): Promise<any[]> {

  const btInputData = await csv().fromFile(btInputFile)
  return btInputData;
}
