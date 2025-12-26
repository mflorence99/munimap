# Munimap

For a live demo, please see [washington.munimap.online](https://washington.munimap.online).

## How to setup AWS Transfer manually

1. Create SFTP server:
   1. Service managed
   2. Publicly accessible
   3. Amazon EFS
   4. Create new log group
      1. ignore all else
   5. CREATE
2. Add user
   1. Username: mflo
   2. User ID: 1000
   3. Group ID: 1000
   4. Role: MyTransferRole
   5. Home directory: efs
   6. Optional folder: MuniMap/proxy
   7. SSH public key: `~/.ssh/aws-transfer.pub`
3. Wait ~10 minutes
4. Launch `filezilla` from WSL command line with new seerver endpoint

## How to deploy a new version

1. Download parcels from live site and copy to `\home\markf\mflorence99\munimap\bin\assets`
2. `npm run bin:parcels:curated`
3. Update version in `package.json`
4. Rebuild author and viewer for a sanity check
   1. Check that parcels in live Firestore database now appear in test
5. `npm run bin:aws:transfer` to create AWS Transfer server
   1. Use `filezilla` to SFTP `geojson` files to AWS EFS
6. `npm run lint`
   1. Correct any errors
7. Commit all changes
8. `npm run deploy:aws:author`
9. `npm run deploy:aws:viewer:washington`
10. Sanity test on live author and viewer
11. `npm run firebase:live:backup`
12. `npm run firebase:live:clean` to remove parcel deltas
13. Use AWS Lambda page to remove old versions

## Publishing to npm

Publishing to npm has gotten too hard and too confusing. They don't allow the Authenticator app anymore -- at least for me. Perhaps due to the fact that it is still linked to StartDataLabs. I'm going to make the decisdionb to walk away from it rather than get sucked in further.

Affected packages are below.

### eslint-config.mlflorence99

Outlived is usefullness, but I still use it in old TypeScript projects. I'll just leave it untouched, unupdated, and either replace it in new projects if any, or augment it in other config code.

### eslint-plugin-import-splitnsort

I still use this but I'm not interested in making any changes, so I'll just leave this until the ecosystem no longer supports it (I'll be long gone.)

### serverx-tx

This is critical to Munimap as the proxy server uses it. I promise I will never, ever, update or redeploy this server.

Also, `serverx-angular` uses it to wrap Munimap as an AWS lambda function.

This is a problem because it's called each time we deploy Munimap. The version of serverx-tx on npm is corrupt and we can't update it, given all the bonkers 2FA issues.

The bypass is to reference the dependency in Munimap's `package.json` as:

`"serverx-ts": "../serverx-ts",`

This creates a symlink so when we run `npm i` or `npm ci` we _must_ add the `--install-links` option.

### serverx-angular

We can't update this either but it needs to change the way it installs `serverx-ts` as described above.

I have hacked `/usr/lib/node_modules/serverx-angular/dist/index.js` as follows at lines 121-123 so that all the scripts work properly:

```typescript
console.log(
  chalk_1.default.red('...installing deployment dependencies UPDATED AGAIN')
);
fs.copyFileSync(
  path.join(__dirname, './model/package.json'),
  path.join(deployDir, 'package.json')
);
cp.execSync('npm i --install-links ../../../../serverx-ts', { cwd: deployDir });
```

So, if we need to update `serverx-ts` build it locally only.
