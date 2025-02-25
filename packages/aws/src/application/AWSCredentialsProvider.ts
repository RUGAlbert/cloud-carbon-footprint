/*
 * © 2021 Thoughtworks, Inc.
 */

import {
  Credentials,
  config as awsConfig,
  ChainableTemporaryCredentials,
  EC2MetadataCredentials,
} from 'aws-sdk'
import { configLoader } from '@cloud-carbon-footprint/common'
import GCPCredentials from './GCPCredentials'

export default class AWSCredentialsProvider {
  static create(accountId: string): Credentials {
    switch (configLoader().AWS.authentication.mode) {
      case 'GCP':
        return new GCPCredentials(
          accountId,
          configLoader().AWS.authentication.options.targetRoleName,
          configLoader().AWS.authentication.options.proxyAccountId,
          configLoader().AWS.authentication.options.proxyRoleName,
        )
      case 'AWS':
        return new ChainableTemporaryCredentials({
          params: {
            RoleArn: `arn:aws:iam::${accountId}:role/${
              configLoader().AWS.authentication.options.targetRoleName
            }`,
            RoleSessionName:
              configLoader().AWS.authentication.options.targetRoleName,
          },
        })
      case 'EC2-METADATA':
        return new EC2MetadataCredentials({
          httpOptions: { timeout: 5000 },
          maxRetries: 10,
        })
      default:
        return new Credentials(awsConfig.credentials)
    }
  }
}
