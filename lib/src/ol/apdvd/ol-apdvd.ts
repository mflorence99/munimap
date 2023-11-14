// 🔥 HACK FOR APDVD

import { ParcelID } from '../../common';
import { ParcelProperties } from '../../common';

const existingExcept = new Set<ParcelID>([
  '10-3',
  '10-4',
  '10-6',
  '10-26',
  '14-187',
  '14-462',
  '14-487',
  '15-06',
  '15-119',
  '15-97',
  '15-98'
]);

const existingStreets = [
  'ADAMS',
  'ASHUELOT DRIVE',
  'BUCHANAN',
  'CLEVELAND',
  'COOLIDGE',
  'GARFIELD',
  'GRANT',
  'HARDING',
  'HARRISON',
  'HAYES',
  'JACKSON',
  'JEFFERSON',
  'LINCOLN',
  'MADISON',
  'MCKINLEY',
  'MCKINNON',
  'MONROE',
  'PENINSULA',
  'PIERCE',
  'PRESIDENTIAL',
  'STOWELL',
  'TAFT',
  'TAYLOR',
  'VAN BUREN'
];

const proposed = new Set<ParcelID>([
  '10-1',
  '10-2',
  '10-24',
  '10-25',
  '10-27',
  '10-3',
  '14-187',
  '14-396',
  '14-398',
  '14-401',
  '14-402',
  '14-403',
  '14-404',
  '14-405',
  '14-406',
  '14-407',
  '14-408',
  '14-409',
  '14-410',
  '14-411',
  '14-412',
  '14-413',
  '14-414',
  '14-415',
  '14-417',
  '14-418',
  '14-419',
  '14-420',
  '14-421',
  '14-422',
  '14-423',
  '14-424',
  '14-425',
  '14-427',
  '14-428',
  '14-430',
  '14-431',
  '14-432',
  '14-433',
  '14-434',
  '14-435',
  '14-436',
  '14-437',
  '14-438',
  '14-439',
  '14-441',
  '14-442',
  '14-443',
  '14-444',
  '14-445',
  '14-446',
  '14-447',
  '14-448',
  '14-449',
  '14-450',
  '14-451',
  '14-451-01',
  '14-452',
  '14-452-01',
  '14-453',
  '14-454',
  '14-454-01',
  '14-454-04',
  '14-454-08',
  '14-466',
  '14-467',
  '14-468',
  '14-468-01',
  '14-469',
  '14-471',
  '14-472',
  '14-473',
  '14-474',
  '14-475',
  '14-476',
  '14-477',
  '14-478',
  '14-479',
  '14-480',
  '14-481',
  '14-482',
  '14-483',
  '14-485',
  '14-487',
  '14-488',
  '14-488-01',
  '14-496',
  '14-498',
  '14-499',
  '14-500',
  '14-503',
  '14-504',
  '14-506',
  '14-507',
  '14-510',
  '14-512',
  '15-54',
  '15-55',
  '18-10',
  '18-11',
  '18-11-02',
  '18-11-05',
  '18-11-08',
  '18-11-12',
  '18-11-14',
  '18-12',
  '18-14',
  '18-15',
  '18-16',
  '18-17',
  '18-18',
  '18-19',
  '18-20',
  '18-21',
  '18-22',
  '18-23',
  '18-24',
  '18-25',
  '18-26',
  '18-27',
  '18-28',
  '18-29',
  '18-29-01',
  '18-29-03',
  '18-30',
  '18-31',
  '18-32',
  '18-35',
  '18-36'
]);

export const colorOfAPDVDExcluded = '255, 255, 255';
export const colorOfAPDVDExisting = '255, 0, 0';
export const colorOfAPDVDProposed = '0, 0, 255';

export function getAPDVDFill(props: ParcelProperties): string {
  if (isAPDVDExcluded(props)) return colorOfAPDVDExcluded;
  if (isAPDVDExisting(props)) return colorOfAPDVDExisting;
  if (isAPDVDProposed(props)) return colorOfAPDVDProposed;
  return null;
}

export function isAPDVDExcluded(props: ParcelProperties): boolean {
  return !isAPDVDExisting(props) && !isAPDVDProposed(props);
}

export function isAPDVDExisting(props: ParcelProperties): boolean {
  return (
    !isAPDVDProposed(props) &&
    !existingExcept.has(props.id) &&
    existingStreets.some((street) => props.address.includes(street))
  );
}

export function isAPDVDProposed(props: ParcelProperties): boolean {
  return proposed.has(props.id);
}
