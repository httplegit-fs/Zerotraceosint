export interface ApiFieldMapping {
  nameField: string;
  fatherNameField: string;
  mobileField: string;
  altMobileField: string;
  aadhaarField: string;
  addressField: string;
  circleField: string;
  pincodeField: string;
  emailField: string;
  vehicleModelField?: string;
  vehicleClassField?: string;
  engineNoField?: string;
  chassisNoField?: string;
  imeiBrandField?: string;
  imeiModelField?: string;
  imeiTacField?: string;
  tgUsernameField?: string;
  tgBioField?: string;
  extraFields?: Array<{ label: string; path: string; category?: string }>;
}

export interface ApiPresetItem {
  id: string;
  name: string;
  targetUrl: string;
  method?: 'GET' | 'POST';
  keyParamName: string;
  keyValue: string;
  actionParamName?: string;
  actionValue?: string;
  queryParamName: string;
  isDefault?: boolean;
  enabled?: boolean;
}

export interface ApiConfigItem {
  id: string;
  name: string;
  category: string;
  subtitle: string;
  badge: string;
  severity: 'low' | 'med' | 'high' | 'crit';
  
  // Endpoint configuration
  targetUrl: string;
  method: 'GET' | 'POST';
  
  // Dynamic parameters
  keyParamName: string;
  keyValue: string;
  
  // Presets list & active preset tracking
  presets?: ApiPresetItem[];
  activePresetId?: string;
  
  actionParamName: string;
  actionValue: string;
  
  queryParamName: string;
  sampleInput: string;
  
  // Additional custom query params or headers
  customParams?: Record<string, string>;
  headers?: Record<string, string>;
  
  // Execution behavior
  enabled: boolean;
  useProxy: boolean;
  
  // Telemetry status
  lastTestedAt?: string;
  lastStatus?: 'online' | 'offline' | 'error' | 'untested';
  latencyMs?: number;
  lastErrorMessage?: string;
  
  // Field auto-mapping
  responseMapping: ApiFieldMapping;
  detectedStructure?: any;
}

export interface AutoDetectionResult {
  detectedUrl: string;
  detectedKeyParam: string;
  detectedKeyValue: string;
  detectedActionParam: string;
  detectedActionValue: string;
  detectedQueryParam: string;
  detectedQueryValue: string;
  detectedMethod: 'GET' | 'POST';
  suggestedName: string;
  suggestedCategory: string;
  suggestedModuleId?: string;
  confidence: number;
  summary: string;
  fieldCount: number;
}

export type TargetFeatureId = 
  | 'all'
  | 'phone-osint' 
  | 'aadhar-search' 
  | 'upi-search' 
  | 'email-search' 
  | 'vehicle-search' 
  | 'imei-search' 
  | 'telegram-search'
  | 'raw-json';

export interface CustomTextFilterItem {
  id: string;
  phrase: string;
  enabled: boolean;
  action: 'hide' | 'replace';
  replaceWith?: string;
  targetFeature?: TargetFeatureId | string;
  addedAt?: string;
}

export interface FeatureVisibilityMap {
  'phone-osint': boolean;
  'aadhar-search': boolean;
  'upi-search': boolean;
  'email-search': boolean;
  'vehicle-search': boolean;
  'imei-search': boolean;
  'telegram-search': boolean;
  'raw-json': boolean;
  [key: string]: boolean;
}

