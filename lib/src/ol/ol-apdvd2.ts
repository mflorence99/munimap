// 🔥 KACK for APDVD

import { ParcelID } from "../common";
import { ParcelProperties } from "../common";

const included = new Set<ParcelID>([
  "14-452",
  "14-480",
  "14-481",
  "18-16",
  "18-19",
  "18-20",
  "18-22",
  "18-23",
  "18-24",
  "18-25",
  "18-27",
  "18-29",
  "14-425",
  "14-428",
  "18-14",
  "18-15",
  "18-17",
  "18-18",
  "18-21",
  "18-26",
  "18-28",
  "18-30",
  "18-31",
  "18-36",
  "14-412",
  "14-413",
  "14-414",
  "14-417",
  "14-441",
  "14-442",
  "14-443",
  "14-444",
  "14-445",
  "14-500",
  "18-11-14",
  "18-12",
  "14-454",
  "14-454-01",
  "14-446",
  "14-447",
  "14-448",
  "14-449",
  "14-450",
  "14-451",
  "18-29-01",
  "18-29-03",
  "18-32",
  "18-35",
  "14-415",
  "14-418",
  "14-453",
  "14-420",
  "14-421",
  "14-422",
  "14-423",
  "14-424",
  "14-427",
  "14-477",
  "14-478",
  "14-479",
  "14-482",
  "14-483",
  "14-432",
  "14-433",
  "14-434",
  "14-435",
  "14-439",
  "14-454-08",
  "18-11-02",
  "14-431",
  "14-436",
  "14-488",
  "14-488-01",
  "14-498",
  "14-499",
  "14-504",
  "14-485",
  "14-487",
  "14-496",
  "15-55",
  "10-1",
  "10-2",
  "10-3",
  "10-24",
  "10-25",
  "10-27",
  "14-187",
  "14-396",
  "14-401",
  "14-402",
  "14-403",
  "14-404",
  "14-405",
  "14-406",
  "14-407",
  "14-408",
  "14-409",
  "14-410",
  "14-411",
  "18-11-05",
  "18-11-08",
  "18-11-12",
  "14-452-01",
  "15-54",
  "14-398",
  "14-510",
  "14-506",
  "14-471",
  "14-472",
  "14-473",
  "14-474",
  "14-454-04",
  "18-11",
  "14-508",
  "14-503"
]);

const excluded = new Set<ParcelID>([
  // '14-466',
  // '14-467',
  // '14-468-01',
  // '14-469',
  // '14-475',
  // '14-476',
  // '14-419',
  // '14-468',
  // '18-10',
  // '14-507',
  // '14-512'
]);

export const colorOfAPDVDExcluded = "80, 80, 255";
export const colorOfAPDVDIncluded = "255, 0, 0";
export const colorOfAPDVDOutside = "255, 255, 255";

export function getAPDVDFill(props: ParcelProperties): string {
  if (isAPDVDExcluded(props)) return colorOfAPDVDExcluded;
  if (isAPDVDIncluded(props)) return colorOfAPDVDIncluded;
  if (isAPDVDOutside(props)) return colorOfAPDVDOutside;
  return null;
}

export function isAPDVDExcluded(props: ParcelProperties): boolean {
  return excluded.has(props.id);
}

export function isAPDVDIncluded(props: ParcelProperties): boolean {
  return included.has(props.id);
}

export function isAPDVDOutside(props: ParcelProperties): boolean {
  return !isAPDVDExcluded(props) && !isAPDVDIncluded(props);
}
