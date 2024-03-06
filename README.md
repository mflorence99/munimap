# Munimap

For a live demo, please see [washington.munimap.online](https://washington.munimap.online).

## How to setup AWS Transfer

1. Create SFTYP server:
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
4. Launch `filezilla` with new seerver endpoint

## How to deploy a new version

1. Download parcels from live site and copy to `\home\markf\mflorence99\munimap\proxy\assets`
2. `npm run proxy:parcels:curated`
3. Update version in `package.json`
4. Rebuild author and viewer for a sanity check
   1. Check that parcels in live Firestore database now appear in test
5. Use `filezilla` to SFTP `geojson` files to AWS EFS
6. `npm run lint`
   1. Correct any errors
7. Commit all changes
8. `npm run deploy:aws:author`
9. `npm run deploy:aws:viewer:washington`
10. Sanity test on live author and viedwer
11. `npm run live:firebase:backup`
12. `npm run live:firebase:clean` to remove parcel deltas
13. Use AWS Lambda page to remove old versions
