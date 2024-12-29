// 🔥 HACK for APDVD

import { ParcelID } from '../common';
import { ParcelProperties } from '../common';

const existing = new Set<ParcelID>([
  '10-11',
  '10-12',
  '10-13',
  '10-15',
  '10-16',
  '10-17',
  '10-18',
  '10-20',
  '10-21',
  '10-22',
  '10-23',
  '10-28',
  '10-29',
  '10-30',
  '10-31',
  '10-32',
  '10-33',
  '10-34',
  '10-35',
  '10-36',
  '10-37',
  '10-38',
  '10-39',
  '10-47',
  '10-48',
  '10-49',
  '10-50',
  '10-53',
  '10-55',
  '10-56',
  '10-58',
  '10-59',
  '10-61',
  '10-62',
  '10-7',
  '10-8',
  '14-1',
  '14-120',
  '14-143',
  '14-144',
  '14-145',
  '14-146',
  '14-147',
  '14-148',
  '14-149',
  '14-150',
  '14-151',
  '14-153',
  '14-155',
  '14-156',
  '14-157',
  '14-158',
  '14-159',
  '14-160',
  '14-161',
  '14-162',
  '14-163',
  '14-164',
  '14-165',
  '14-167',
  '14-168',
  '14-169',
  '14-170',
  '14-171',
  '14-172',
  '14-173',
  '14-174',
  '14-176',
  '14-177',
  '14-178',
  '14-179',
  '14-180',
  '14-181',
  '14-182',
  '14-183',
  '14-184',
  '14-185',
  '14-186',
  '14-189',
  '14-190',
  '14-191',
  '14-192',
  '14-193',
  '14-194',
  '14-196',
  '14-197',
  '14-198',
  '14-199',
  '14-2',
  '14-200',
  '14-201',
  '14-202',
  '14-203',
  '14-204',
  '14-205',
  '14-206',
  '14-216',
  '14-217',
  '14-228',
  '14-234',
  '14-235',
  '14-237',
  '14-239',
  '14-240',
  '14-241',
  '14-242',
  '14-244',
  '14-245',
  '14-247',
  '14-249',
  '14-250',
  '14-251',
  '14-252',
  '14-253',
  '14-254',
  '14-256',
  '14-257',
  '14-258',
  '14-260',
  '14-261',
  '14-263',
  '14-266',
  '14-267',
  '14-268',
  '14-269',
  '14-270',
  '14-271',
  '14-272',
  '14-273',
  '14-274',
  '14-275',
  '14-276',
  '14-277',
  '14-278',
  '14-279',
  '14-281',
  '14-283',
  '14-284',
  '14-285',
  '14-286',
  '14-287',
  '14-288',
  '14-290',
  '14-291',
  '14-292',
  '14-293',
  '14-294',
  '14-295',
  '14-296',
  '14-299',
  '14-300',
  '14-301',
  '14-302',
  '14-303',
  '14-304',
  '14-310',
  '14-311',
  '14-312',
  '14-314',
  '14-315',
  '14-316',
  '14-317',
  '14-32',
  '14-321',
  '14-322',
  '14-324',
  '14-325',
  '14-33',
  '14-34',
  '14-35',
  '14-37',
  '14-38',
  '14-4',
  '14-40',
  '14-43',
  '14-45',
  '14-48',
  '14-490',
  '14-5',
  '14-6',
  '14-69',
  '14-7',
  '15-100',
  '15-101',
  '15-123',
  '15-126',
  '15-127',
  '15-128',
  '15-129',
  '15-131',
  '15-132',
  '15-135',
  '15-136',
  '15-137',
  '15-141',
  '15-143',
  '15-144',
  '15-145',
  '15-147',
  '15-148',
  '15-149',
  '15-150',
  '15-99',
  '14-233',
  '14-232',
  '14-166',
  '14-231',
  '14-230',
  '14-226',
  '14-218',
  '14-224',
  '14-219',
  '14-220',
  '14-223',
  '14-207',
  '14-208',
  '14-215',
  '14-213',
  '14-209',
  '14-212',
  '14-210',
  '14-211',
  '14-119',
  '14-118',
  '14-121',
  '14-122',
  '14-116',
  '14-124',
  '14-114',
  '14-113',
  '14-112',
  '14-111',
  '14-127',
  '14-129',
  '14-110',
  '14-109',
  '14-108',
  '14-130',
  '14-131',
  '14-94',
  '14-95',
  '14-91',
  '14-96',
  '14-97',
  '14-98',
  '14-89',
  '14-86',
  '14-100',
  '14-101',
  '14-102',
  '14-103',
  '14-84',
  '14-83',
  '14-36',
  '14-71',
  '14-90',
  '14-68',
  '14-67',
  '14-73',
  '14-74',
  '14-66',
  '14-65',
  '14-24',
  '14-23',
  '14-22',
  '14-21',
  '14-20',
  '14-19',
  '14-18',
  '14-17',
  '14-15',
  '14-30',
  '14-11',
  '14-10',
  '14-8',
  '14-29',
  '14-28',
  '14-27',
  '14-26',
  '14-365',
  '14-104',
  '14-82',
  '14-362',
  '14-81',
  '14-80',
  '14-76',
  '14-63',
  '14-61',
  '14-44',
  '14-364',
  '14-361',
  '14-360',
  '14-393',
  '14-356',
  '14-392',
  '14-391',
  '14-390',
  '14-355',
  '14-354',
  '14-352',
  '14-387',
  '14-351',
  '14-350',
  '14-349',
  '14-348',
  '14-345',
  '14-375',
  '14-343',
  '14-341',
  '14-374',
  '14-340',
  '14-339',
  '14-373',
  '14-338',
  '14-372',
  '14-337',
  '14-370',
  '14-369',
  '14-368',
  '14-384',
  '14-378',
  '14-379',
  '14-383',
  '14-381',
  '14-380',
  '14-327',
  '15-125',
  '14-328',
  '14-332',
  '14-329',
  '14-333',
  '14-334',
  '14-313',
  '14-335',
  '14-309',
  '14-336',
  '14-307',
  '14-107',
  '14-59',
  '14-53',
  '14-58',
  '14-52',
  '14-51',
  '14-56',
  '14-55',
  '14-50',
  '14-47',
  '10-41',
  '14-54',
  '10-43',
  '10-44',
  '10-45',
  '14-305',
  '14-135',
  '14-222',
  '14-138',
  '14-221',
  '14-139',
  '14-140',
  '14-141',
  '14-142',
  '14-225',
  '14-77',
  '14-320',
  '14-75',
  '14-262'
]);

const proposed = new Set<ParcelID>([
  '14-452',
  '14-480',
  '14-481',
  '18-16',
  '18-19',
  '18-20',
  '18-22',
  '18-23',
  '18-24',
  '18-25',
  '18-27',
  '18-29',
  '14-425',
  '14-428',
  '18-14',
  '18-15',
  '18-17',
  '18-18',
  '18-21',
  '18-26',
  '18-28',
  '18-30',
  '18-31',
  '18-36',
  '14-412',
  '14-413',
  '14-414',
  '14-417',
  '14-441',
  '14-442',
  '14-443',
  '14-444',
  '14-445',
  '14-500',
  '18-11-14',
  '18-12',
  '14-454',
  '14-454-01',
  '14-446',
  '14-447',
  '14-448',
  '14-449',
  '14-450',
  '14-451',
  '18-29-01',
  '18-29-03',
  '18-32',
  '18-35',
  '14-415',
  '14-418',
  '14-453',
  '14-420',
  '14-421',
  '14-422',
  '14-423',
  '14-424',
  '14-427',
  '14-477',
  '14-478',
  '14-479',
  '14-482',
  '14-483',
  '14-432',
  '14-433',
  '14-434',
  '14-435',
  '14-508',
  '14-439',
  '14-454-08',
  '18-11-02',
  '14-431',
  '14-436',
  '14-488',
  '14-488-01',
  '14-498',
  '14-499',
  '14-503',
  '14-504',
  '14-485',
  '14-487',
  '14-496',
  '15-55',
  '10-1',
  '10-2',
  '10-3',
  '10-24',
  '10-25',
  '10-27',
  '14-187',
  '14-396',
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
  '18-11-05',
  '18-11-08',
  '18-11-12',
  '14-452-01',
  '15-54',
  '14-398',
  '14-510',
  '14-506',
  '14-471',
  '14-472',
  '14-473',
  '14-474',
  '14-454-04',
  '18-11'
]);

export const colorOfAPDVDExisting = '25, 118, 210';
export const colorOfAPDVDProposed = '251, 192, 45';
export const colorOfAPDVDOutside = '255, 255, 255';

export function getAPDVDFill(props: ParcelProperties): string {
  if (isAPDVDExisting(props)) return colorOfAPDVDExisting;
  if (isAPDVDProposed(props)) return colorOfAPDVDProposed;
  if (isAPDVDOutside(props)) return colorOfAPDVDOutside;
  return null;
}

export function isAPDVDExisting(props: ParcelProperties): boolean {
  return existing.has(props.id);
}

export function isAPDVDProposed(props: ParcelProperties): boolean {
  return proposed.has(props.id);
}

export function isAPDVDOutside(props: ParcelProperties): boolean {
  return !isAPDVDExisting(props) && !isAPDVDProposed(props);
}
