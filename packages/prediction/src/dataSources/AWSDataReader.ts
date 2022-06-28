/*
 * © 2021 Thoughtworks, Inc.
 */
import csv from 'csvtojson'
import path from 'path'

/**
 * gets the aws data
 * @returns a promise with all the instances
 */
export default async function getAWSData(): Promise<any[]> {
  return csv().fromFile(path.join(process.cwd(), 'input', 'instancetypes.csv'))
}
