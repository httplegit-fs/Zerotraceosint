import { ApiConfigItem, AutoDetectionResult, ApiFieldMapping } from '../types/apiTypes';

export const DEFAULT_API_CONFIGS: ApiConfigItem[] = [
  {
    id: 'phone-osint',
    name: 'PHONE NUMBER SEARCH',
    category: 'NETWORK',
    subtitle: 'OSINT Number Intel & Carrier Footprint',
    badge: 'STAGE 01',
    severity: 'crit',
    targetUrl: 'https://storage-deutschland-don-patterns.trycloudflare.com/num',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'DADDY',
    actionParamName: '',
    actionValue: '',
    queryParamName: 'number',
    sampleInput: '9999883039',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-phone-cloudflare',
        name: 'Cloudflare Daddy',
        targetUrl: 'https://storage-deutschland-don-patterns.trycloudflare.com/num',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'DADDY',
        actionParamName: '',
        actionValue: '',
        queryParamName: 'number'
      },
      {
        id: 'preset-phone-alonepatel',
        name: 'AlonePatel V1',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'num',
        queryParamName: 'number'
      }
    ],
    activePresetId: 'preset-phone-cloudflare',
    responseMapping: {
      nameField: 'name',
      fatherNameField: 'father_name',
      mobileField: 'mobile',
      altMobileField: 'alt_number',
      aadhaarField: 'aadhar',
      addressField: 'address',
      circleField: 'circle',
      pincodeField: 'pincode',
      emailField: 'email'
    }
  },
  {
    id: 'aadhar-search',
    name: 'AADHAR SEARCH',
    category: 'SECURITY',
    subtitle: 'Verification & Biometric Status Check',
    badge: 'STAGE 02',
    severity: 'crit',
    targetUrl: 'https://api-src.alonepatel.shop/api',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'INDIAN_HACKER_BRO',
    actionParamName: 'action',
    actionValue: 'aadhar',
    queryParamName: 'aadhar',
    sampleInput: '123456789012',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-aadhar-alonepatel',
        name: 'AlonePatel Aadhaar',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'aadhar',
        queryParamName: 'aadhar'
      },
      {
        id: 'preset-aadhar-uidai',
        name: 'UIDAI Backup Node',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'aadhar',
        queryParamName: 'uid'
      }
    ],
    activePresetId: 'preset-aadhar-alonepatel',
    responseMapping: {
      nameField: 'name',
      fatherNameField: 'father_name',
      mobileField: 'mobile',
      altMobileField: 'alt_number',
      aadhaarField: 'aadhar',
      addressField: 'address',
      circleField: 'circle',
      pincodeField: 'pincode',
      emailField: 'email'
    }
  },
  {
    id: 'upi-search',
    name: 'UPI SEARCH',
    category: 'NETWORK',
    subtitle: 'VPA Recon, Bank Handle & Fraud Check',
    badge: 'STAGE 03',
    severity: 'high',
    targetUrl: 'https://api-src.alonepatel.shop/api',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'INDIAN_HACKER_BRO',
    actionParamName: 'action',
    actionValue: 'upiinfo',
    queryParamName: 'upi',
    sampleInput: 'user@okhdfcbank',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-upi-alonepatel',
        name: 'AlonePatel UPI VPA',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'upiinfo',
        queryParamName: 'upi'
      },
      {
        id: 'preset-upi-npci',
        name: 'NPCI VPA Node',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'upiinfo',
        queryParamName: 'vpa'
      }
    ],
    activePresetId: 'preset-upi-alonepatel',
    responseMapping: {
      nameField: 'account_holder_name',
      fatherNameField: '',
      mobileField: 'mobile',
      altMobileField: '',
      aadhaarField: '',
      addressField: '',
      circleField: '',
      pincodeField: '',
      emailField: ''
    }
  },
  {
    id: 'email-search',
    name: 'EMAIL SEARCH',
    category: 'NETWORK',
    subtitle: 'Breach DB, MX Records & Gravatar OSINT',
    badge: 'STAGE 04',
    severity: 'high',
    targetUrl: 'https://api-src.alonepatel.shop/api',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'INDIAN_HACKER_BRO',
    actionParamName: 'action',
    actionValue: 'email',
    queryParamName: 'email',
    sampleInput: 'user@targetdomain.com',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-email-cloudflare',
        name: 'Cloudflare Daddy Email',
        targetUrl: 'https://storage-deutschland-don-patterns.trycloudflare.com/email',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'DADDY',
        actionParamName: '',
        actionValue: '',
        queryParamName: 'value'
      },
      {
        id: 'preset-email-alonepatel',
        name: 'AlonePatel Email',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'email',
        queryParamName: 'email'
      },
      {
        id: 'preset-email-breach',
        name: 'Breach Intel MX',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'email',
        queryParamName: 'mail'
      }
    ],
    activePresetId: 'preset-email-cloudflare',
    responseMapping: {
      nameField: 'name',
      fatherNameField: 'father_name',
      mobileField: 'mobile',
      altMobileField: 'alt_number',
      aadhaarField: 'aadhar',
      addressField: 'address',
      circleField: 'circle',
      pincodeField: 'pincode',
      emailField: 'email'
    }
  },
  {
    id: 'vehicle-search',
    name: 'VEHICLE SEARCH',
    category: 'LAB_SETUP',
    subtitle: 'RC Status, RTO Database & Chassis Lookup',
    badge: 'STAGE 05',
    severity: 'med',
    targetUrl: 'https://api-src.alonepatel.shop/api',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'INDIAN_HACKER_BRO',
    actionParamName: 'action',
    actionValue: 'vehicle-v1',
    queryParamName: 'rc',
    sampleInput: 'DL8CAF5030',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-vehicle-vahan',
        name: 'Vahan RC V1',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'vehicle-v1',
        queryParamName: 'rc'
      },
      {
        id: 'preset-vehicle-rto',
        name: 'RTO Registry Node',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'vehicle-v1',
        queryParamName: 'vehicle'
      }
    ],
    activePresetId: 'preset-vehicle-vahan',
    responseMapping: {
      nameField: 'owner_name',
      fatherNameField: 'father_name',
      mobileField: 'mobile',
      altMobileField: '',
      aadhaarField: '',
      addressField: 'address',
      circleField: 'rto_name',
      pincodeField: '',
      emailField: '',
      vehicleModelField: 'maker_model',
      vehicleClassField: 'vehicle_class',
      engineNoField: 'engine_no',
      chassisNoField: 'chassis_no'
    }
  },
  {
    id: 'imei-search',
    name: 'IMEI NUMBER SEARCH',
    category: 'SECURITY',
    subtitle: 'TAC Allocation, Device Spec & Blacklist',
    badge: 'STAGE 06',
    severity: 'crit',
    targetUrl: 'https://api-src.alonepatel.shop/api',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'INDIAN_HACKER_BRO',
    actionParamName: 'action',
    actionValue: 'imei-info',
    queryParamName: 'imei_num',
    sampleInput: '358240051234560',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-imei-tac',
        name: 'TAC Device Specs',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'imei-info',
        queryParamName: 'imei_num'
      },
      {
        id: 'preset-imei-gsma',
        name: 'GSMA Blacklist V1',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: 'action',
        actionValue: 'imei-info',
        queryParamName: 'num'
      }
    ],
    activePresetId: 'preset-imei-tac',
    responseMapping: {
      nameField: 'model_name',
      fatherNameField: '',
      mobileField: '',
      altMobileField: '',
      aadhaarField: '',
      addressField: '',
      circleField: '',
      pincodeField: '',
      emailField: '',
      imeiBrandField: 'brand',
      imeiModelField: 'model',
      imeiTacField: 'tac'
    }
  },
  {
    id: 'telegram-search',
    name: 'TELEGRAM ID SEARCH',
    category: 'SCRIPTS',
    subtitle: 'User ID, Channel History & Bot Intel',
    badge: 'STAGE 07',
    severity: 'high',
    targetUrl: 'https://api-src.alonepatel.shop/api',
    method: 'GET',
    keyParamName: 'key',
    keyValue: 'Tgid_num',
    actionParamName: 'action',
    actionValue: 'tgid',
    queryParamName: 'id',
    sampleInput: '12345678',
    enabled: true,
    useProxy: true,
    presets: [
      {
        id: 'preset-telegram-tgid',
        name: 'TGID Recon',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'Tgid_num',
        actionParamName: 'action',
        actionValue: 'tgid',
        queryParamName: 'id'
      },
      {
        id: 'preset-telegram-user',
        name: 'Telegram User Node',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'Tgid_num',
        actionParamName: 'action',
        actionValue: 'tgid',
        queryParamName: 'tgid'
      }
    ],
    activePresetId: 'preset-telegram-tgid',
    responseMapping: {
      nameField: 'first_name',
      fatherNameField: '',
      mobileField: 'phone',
      altMobileField: '',
      aadhaarField: '',
      addressField: '',
      circleField: '',
      pincodeField: '',
      emailField: '',
      tgUsernameField: 'username',
      tgBioField: 'bio'
    }
  }
];

const STORAGE_KEY = 'zerotrace_custom_apis_v2';

export function loadSavedApiConfigs(): ApiConfigItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to ensure any missing field or newly added preset has fallback
        return DEFAULT_API_CONFIGS.map(def => {
          const found = parsed.find((p: ApiConfigItem) => p.id === def.id);
          if (!found) return def;
          
          // Ensure presets exist and include new default presets (like Cloudflare Daddy Email)
          let presets = (found.presets && Array.isArray(found.presets) && found.presets.length > 0)
            ? [...found.presets]
            : (def.presets ? [...def.presets] : []);
          
          if (def.presets) {
            for (const defP of def.presets) {
              const alreadyExists = presets.some(p => p.id === defP.id || p.targetUrl === defP.targetUrl);
              if (!alreadyExists) {
                presets.push(defP);
              }
            }
          }

          return { ...def, ...found, presets };
        }).concat(parsed.filter((p: ApiConfigItem) => !DEFAULT_API_CONFIGS.some(d => d.id === p.id)));
      }
    }
  } catch (e) {
    console.warn('[API Config Load]', e);
  }
  return DEFAULT_API_CONFIGS;
}

export function saveApiConfigs(configs: ApiConfigItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  } catch (e) {
    console.warn('[API Config Save]', e);
  }
}

/**
 * Intelligent Auto-Detection Engine:
 * Analyzes any full API URL string, extracts keys, actions, query parameter names,
 * and sets up structure automatically.
 */
export function autoDetectApiFromUrl(rawUrl: string): AutoDetectionResult {
  const trimmed = rawUrl.trim();
  let urlObj: URL | null = null;
  let baseUrl = trimmed;
  
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      urlObj = new URL(trimmed);
      baseUrl = `${urlObj.origin}${urlObj.pathname}`;
    } else {
      urlObj = new URL(`https://${trimmed}`);
      baseUrl = `https://${urlObj.host}${urlObj.pathname}`;
    }
  } catch {
    baseUrl = trimmed.split('?')[0];
  }

  let detectedKeyParam = '';
  let detectedKeyValue = '';
  let detectedActionParam = '';
  let detectedActionValue = '';
  let detectedQueryParam = '';
  let detectedQueryValue = '';
  let detectedMethod: 'GET' | 'POST' = 'GET';
  let suggestedName = 'CUSTOM INTELLIGENCE API';
  let suggestedCategory = 'NETWORK';
  let suggestedModuleId = '';

  const KEY_CANDIDATES = ['key', 'apikey', 'api_key', 'token', 'auth', 'auth_key', 'secret', 'access_token', 'daddy', 'pass', 'api'];
  const ACTION_CANDIDATES = ['action', 'act', 'type', 'op', 'mode', 'service', 'cmd', 'method', 'endpoint'];
  const QUERY_CANDIDATES = [
    'value', 'val', 'email', 'mail', 
    'number', 'phone', 'mobile', 'num', 'msisdn', 'target', 
    'aadhar', 'aadhaar', 'uid', 'uidai',
    'vpa', 'upi', 'upi_id', 
    'rc', 'reg', 'vehicle', 'vehicle_no', 
    'imei', 'imei_num', 'tac', 
    'id', 'tgid', 'tg_id', 'user', 'username', 'q', 'query', 'input', 'search', 'data'
  ];

  if (urlObj && urlObj.searchParams) {
    // 1. Detect Key Parameter
    for (const param of KEY_CANDIDATES) {
      if (urlObj.searchParams.has(param)) {
        detectedKeyParam = param;
        detectedKeyValue = urlObj.searchParams.get(param) || '';
        break;
      }
    }
    if (!detectedKeyParam) {
      for (const [k, v] of urlObj.searchParams.entries()) {
        const lowerK = k.toLowerCase();
        if (KEY_CANDIDATES.some(c => lowerK.includes(c)) || (v.length > 8 && !v.includes(' ') && !/^\d+$/.test(v))) {
          detectedKeyParam = k;
          detectedKeyValue = v;
          break;
        }
      }
    }

    // 2. Detect Action Parameter
    for (const param of ACTION_CANDIDATES) {
      if (urlObj.searchParams.has(param)) {
        detectedActionParam = param;
        detectedActionValue = urlObj.searchParams.get(param) || '';
        break;
      }
    }

    // 3. Detect Query Parameter
    for (const param of QUERY_CANDIDATES) {
      if (urlObj.searchParams.has(param) && param !== detectedKeyParam && param !== detectedActionParam) {
        detectedQueryParam = param;
        detectedQueryValue = urlObj.searchParams.get(param) || '';
        break;
      }
    }
    // If not found in candidates, pick first unused query param
    if (!detectedQueryParam) {
      for (const [k, v] of urlObj.searchParams.entries()) {
        if (k !== detectedKeyParam && k !== detectedActionParam) {
          detectedQueryParam = k;
          detectedQueryValue = v;
          break;
        }
      }
    }
  }

  // Suggest intelligent name, category & target moduleId based on detected action/query/url/value
  const context = `${baseUrl} ${detectedActionValue} ${detectedQueryParam} ${detectedKeyValue} ${detectedQueryValue}`.toLowerCase();
  
  if (context.includes('/email') || context.includes('email') || context.includes('mail') || detectedQueryValue.includes('@')) {
    suggestedName = baseUrl.includes('cloudflare') ? 'EMAIL SEARCH (CLOUDFLARE DADDY)' : 'EMAIL OSINT MATRIX';
    suggestedCategory = 'NETWORK';
    suggestedModuleId = 'email-search';
  } else if (context.includes('/num') || (context.includes('phone') && !context.includes('imei')) || context.includes('mobile') || context.includes('telecom') || context.includes('msisdn')) {
    suggestedName = baseUrl.includes('cloudflare') ? 'PHONE NUMBER SEARCH (CLOUDFLARE DADDY)' : 'PHONE OSINT GATEWAY';
    suggestedCategory = 'NETWORK';
    suggestedModuleId = 'phone-osint';
  } else if (context.includes('aadhar') || context.includes('aadhaar') || context.includes('uid')) {
    suggestedName = 'AADHAAR IDENTITY GATEWAY';
    suggestedCategory = 'SECURITY';
    suggestedModuleId = 'aadhar-search';
  } else if (context.includes('upi') || context.includes('vpa') || context.includes('bank')) {
    suggestedName = 'UPI VPA RECON GATEWAY';
    suggestedCategory = 'NETWORK';
    suggestedModuleId = 'upi-search';
  } else if (context.includes('vehicle') || context.includes('rc') || context.includes('vahan') || context.includes('rto')) {
    suggestedName = 'VEHICLE RTO REGISTRY';
    suggestedCategory = 'LAB_SETUP';
    suggestedModuleId = 'vehicle-search';
  } else if (context.includes('imei') || context.includes('tac') || context.includes('device')) {
    suggestedName = 'IMEI TAC SPECS GATEWAY';
    suggestedCategory = 'SECURITY';
    suggestedModuleId = 'imei-search';
  } else if (context.includes('tg') || context.includes('telegram') || context.includes('tgid')) {
    suggestedName = 'TELEGRAM INTEL GATEWAY';
    suggestedCategory = 'SCRIPTS';
    suggestedModuleId = 'telegram-search';
  }

  let confidence = 50;
  if (detectedKeyParam && detectedKeyValue) confidence += 20;
  if (detectedActionValue) confidence += 15;
  if (detectedQueryParam) confidence += 15;
  if (suggestedModuleId) confidence += 10;

  const summary = `Auto-Detected: Base URL "${baseUrl}" | Key: "${detectedKeyParam}=${detectedKeyValue || '(None)'}" | Action: "${detectedActionParam}=${detectedActionValue || '(None)'}" | Query: "${detectedQueryParam}" | Target Module: ${suggestedModuleId || 'CUSTOM'}`;

  return {
    detectedUrl: baseUrl,
    detectedKeyParam: detectedKeyParam || 'key',
    detectedKeyValue: detectedKeyValue || '',
    detectedActionParam: detectedActionParam || (detectedActionValue ? 'action' : ''),
    detectedActionValue: detectedActionValue || '',
    detectedQueryParam: detectedQueryParam || 'number',
    detectedQueryValue: detectedQueryValue || '',
    detectedMethod,
    suggestedName,
    suggestedCategory,
    suggestedModuleId,
    confidence: Math.min(confidence, 100),
    summary,
    fieldCount: (detectedKeyParam ? 1 : 0) + (detectedActionParam ? 1 : 0) + (detectedQueryParam ? 1 : 0)
  };
}

/**
 * Deep Analysis of JSON Payload to automatically extract and map fields
 */
export function analyzeJsonStructure(jsonObj: any): {
  mapping: ApiFieldMapping;
  detectedFields: Array<{ key: string; path: string; sampleValue: string; type: string }>;
  summary: string;
} {
  const detectedFields: Array<{ key: string; path: string; sampleValue: string; type: string }> = [];
  
  function scan(obj: any, currentPath = '') {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        scan(obj[0], currentPath ? `${currentPath}[0]` : '[0]');
      }
    } else {
      for (const [k, v] of Object.entries(obj)) {
        const fullPath = currentPath ? `${currentPath}.${k}` : k;
        if (v !== null && typeof v === 'object') {
          scan(v, fullPath);
        } else {
          detectedFields.push({
            key: k,
            path: fullPath,
            sampleValue: String(v),
            type: typeof v
          });
        }
      }
    }
  }

  scan(jsonObj);

  const findPath = (candidateKeys: string[]): string => {
    for (const key of candidateKeys) {
      const lower = key.toLowerCase();
      const match = detectedFields.find(f => f.key.toLowerCase() === lower || f.key.toLowerCase().replace(/_/g, '') === lower.replace(/_/g, ''));
      if (match) return match.path;
    }
    // Partial substring fallback
    for (const key of candidateKeys) {
      const lower = key.toLowerCase();
      const match = detectedFields.find(f => f.key.toLowerCase().includes(lower) && f.sampleValue && f.sampleValue !== 'null');
      if (match) return match.path;
    }
    return '';
  };

  const mapping: ApiFieldMapping = {
    nameField: findPath(['name', 'full_name', 'fullname', 'subscriber_name', 'owner_name', 'account_holder_name', 'first_name']),
    fatherNameField: findPath(['father_name', 'fathername', 'father', 'fname', 'care_of', 'guardian']),
    mobileField: findPath(['mobile', 'number', 'phone', 'phone_number', 'msisdn', 'mobile_no', 'num']),
    altMobileField: findPath(['alt_number', 'alt_mobile', 'alt_num', 'alternate_mobile', 'secondary_mobile', 'alt']),
    aadhaarField: findPath(['aadhar', 'aadhaar', 'uid', 'uidai', 'aadhar_no', 'aadhaar_no', 'id_number']),
    addressField: findPath(['address', 'full_address', 'raw_address', 'location', 'residence']),
    circleField: findPath(['circle', 'telecom_circle', 'operator', 'carrier', 'state', 'rto_name']),
    pincodeField: findPath(['pincode', 'pin', 'postal_code', 'zip', 'zipcode']),
    emailField: findPath(['email', 'mail', 'email_id', 'registered_email']),
    vehicleModelField: findPath(['maker_model', 'model', 'vehicle_model', 'brand']),
    vehicleClassField: findPath(['vehicle_class', 'class', 'type']),
    engineNoField: findPath(['engine_no', 'engine_number', 'engine']),
    chassisNoField: findPath(['chassis_no', 'chassis_number', 'vin']),
    imeiBrandField: findPath(['brand', 'manufacturer', 'vendor']),
    imeiModelField: findPath(['model', 'device_name', 'model_name']),
    imeiTacField: findPath(['tac', 'tac_code', 'type_allocation_code']),
    tgUsernameField: findPath(['username', 'handle']),
    tgBioField: findPath(['bio', 'about', 'description'])
  };

  const matchedCount = Object.values(mapping).filter(Boolean).length;
  const summary = `Detected ${detectedFields.length} JSON properties. Automatically mapped ${matchedCount} intelligence attributes.`;

  return {
    mapping,
    detectedFields,
    summary
  };
}

/**
 * Builds the URL with all query parameters for execution
 */
export function buildExecutionUrl(config: ApiConfigItem, inputVal: string): string {
  let url = config.targetUrl.trim();
  const params = new URLSearchParams();

  if (config.keyParamName && config.keyValue) {
    params.set(config.keyParamName, config.keyValue);
  }

  if (config.actionParamName && config.actionValue) {
    params.set(config.actionParamName, config.actionValue);
  }

  if (config.queryParamName && inputVal) {
    params.set(config.queryParamName, inputVal);
  }

  if (config.customParams) {
    for (const [k, v] of Object.entries(config.customParams)) {
      if (k && v) params.set(k, v);
    }
  }

  const queryString = params.toString();
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  return url;
}
