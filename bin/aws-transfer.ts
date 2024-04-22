import { CreateServerCommand } from '@aws-sdk/client-transfer';
import { CreateUserCommand } from '@aws-sdk/client-transfer';
import { DeleteServerCommand } from '@aws-sdk/client-transfer';
import { DescribeServerCommand } from '@aws-sdk/client-transfer';
import { TransferClient } from '@aws-sdk/client-transfer';

import { exec } from 'child_process';
import { readFileSync } from 'fs';
import { stdout } from 'process';

import chalk from 'chalk';
// import jsome from 'jsome';

const client = new TransferClient({});

async function run(cmd: string): Promise<any> {
  return new Promise((resolve, _reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) console.error(error);
      resolve(stdout ? stdout : stderr);
    });
  });
}

async function wait(ms = 1000): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main(): Promise<void> {
  // 👇 create a new transfer server
  const server = await client.send(
    new CreateServerCommand({
      Domain: 'EFS',
      EndpointType: 'PUBLIC',
      IdentityProviderType: 'SERVICE_MANAGED',
      Protocols: ['SFTP']
    })
  );
  console.log(chalk.green(`... creating transfer server ${server.ServerId}`));

  try {
    // 👇 read the public key
    const publicKey = readFileSync('/home/markf/.ssh/aws-transfer.pub')
      .toString()
      .trim();

    // 👇 create the required user
    const user = await client.send(
      new CreateUserCommand({
        HomeDirectoryMappings: [
          { Entry: '/', Target: '/fs-0b4ac33814e61435a/MuniMap/proxy' }
        ],
        HomeDirectoryType: 'LOGICAL',
        PosixProfile: {
          Uid: 1000,
          Gid: 1000
        },
        Role: 'arn:aws:iam::010151131616:role/MyTransferRole',
        ServerId: server.ServerId,
        SshPublicKeyBody: publicKey,
        UserName: 'mflo'
      })
    );
    console.log(
      chalk.blue(`...... creating user ${server.ServerId}:${user.UserName}`)
    );

    // 👇 poll until server is ready
    while (true) {
      const status = await client.send(
        new DescribeServerCommand({
          ServerId: server.ServerId
        })
      );
      if (status.Server.State === 'ONLINE') {
        stdout.write('\n');
        break;
      } else {
        stdout.write('.');
        await wait();
      }
    }
    console.log(
      chalk.yellow(`... transfer server ${server.ServerId} is ONLINE`)
    );

    // 👇 run FileZilla to manually transfer files
    await run('filezilla');
  } finally {
    // 👇 we're done with the server now
    await client.send(
      new DeleteServerCommand({
        ServerId: server.ServerId
      })
    );
    console.log(chalk.red(`... deleted transfer server ${server.ServerId}`));
  }
}

main();
